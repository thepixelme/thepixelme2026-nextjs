# Analytics

Google Analytics 4, mounted via [`@next/third-parties/google`](https://nextjs.org/docs/app/guides/third-party-libraries#google-analytics). Consent-gated, env-gated, and event-typed. For the events themselves and how to read them in GA, see [analytics-events.md](analytics-events.md).

## Env var

`NEXT_PUBLIC_GA_ID` — GA4 Measurement ID (`G-XXXXXXXXXX`). Optional.

- When **unset**, no analytics script loads, no consent prompt is shown, and `trackEvent()` is a no-op. The desktop Notification Center shell still mounts (so the menu-bar clock can open an empty NC); it just contains no notifications.
- When **set**, the consent prompt appears on first visit. On desktop the [Notification Center](desktop-shell.md#notification-center-srccomponentsnotificationsnotificationcentertsx) panel auto-opens with the consent notification inside, once the [laptop intro](desktop-shell.md#laptop-intro-srccomponentsintrolaptopintrotsx) has finished; on mobile a standalone liquid-glass notification card slides down from above the top edge, once the phone/tablet desk intro (if it plays) has zoomed into the home screen. GA only loads after Accept.
- `NEXT_PUBLIC_*` values are **inlined into the client bundle at `next build` time**. Changing this var after a build does not change the deployed bundle — you must rebuild. If runtime configurability is ever needed, expose the ID from a server route and read it from the client instead.
- This is a deliberate `NEXT_PUBLIC_*` exception (see [AGENTS.md](../AGENTS.md)) because GA4 must run in the browser; there is no way to keep the measurement ID server-side.

Documented placeholder in [.env.example](../.env.example).

## Consent contract

[src/lib/analytics-consent.ts](../src/lib/analytics-consent.ts) exports the server-safe contract: `GA_CONSENT_COOKIE = "ga-consent"`, the `ConsentValue` type, and the `parseConsent()` parser. [src/lib/analytics.ts](../src/lib/analytics.ts) provides the client-side cookie read/write; [src/lib/analytics-server.ts](../src/lib/analytics-server.ts) provides the server-side read (via `next/headers cookies()`). The split keeps `@next/third-parties/google` (which is `'use client'`) out of the server graph.

The session-state machine lives in the [`useAnalyticsConsent()`](../src/lib/useAnalyticsConsent.ts) hook, which is the **single owner** of consent state — it must be called only once, inside [`AnalyticsConsent`](../src/components/analytics/AnalyticsConsent.tsx). The hook receives `initialConsent` (read server-side from the cookie by [`AnalyticsConsentServer`](../src/components/analytics/AnalyticsConsentServer.tsx)) and seeds its state from it, so the consent banner can ship in the initial server HTML. Notification surfaces receive `accept` / `decline` as props.

| Cookie `ga-consent` | Effect |
|---|---|
| `"granted"` | `<GoogleAnalytics>` mounts. `trackEvent()` sends events. `window['ga-disable-' + gaId]` is `false`. |
| `"denied"`  | No script mount, no `trackEvent()`. `window['ga-disable-' + gaId]` is `true` so any previously-loaded gtag.js also stops sending. |
| absent      | Consent card shown. The mobile banner is rendered in the initial server HTML (see SSR section below). Desktop NC auto-opens and is **persistent** (X is hidden; Esc, clock-toggle, and clicks on the rest of the page do not close it — but the rest of the page remains interactive); mobile shows a top-center card that can't be dismissed without a choice. No GA until the visitor decides. |

`readConsent()` matches the cookie against `/(?:^|; )ga-consent=([^;]+)/`. `writeConsent()` assigns `document.cookie = "ga-consent=...; Max-Age=31536000; Path=/; SameSite=Lax; Secure" (Secure only on https)`. Because `document.cookie = ...` doesn't throw when the browser rejects the cookie, `writeConsent()` performs a read-back and returns `true` only when the value persisted. On Accept-with-storage-failure, in-memory `consent` stays `null` (fail closed — `<GoogleAnalytics>` does not mount and NC stays persistent); the user can ignore the banner and continue using the site, or click Decline to dismiss it. GA still does not load until a successful Accept persists. On Decline-with-storage-failure, in-memory `consent` flips to `"denied"` for the session even though it didn't persist; reload re-prompts.

## SSR (mobile banner)

The mobile consent banner ships in the initial server HTML so it can be the LCP candidate without paying for hydration. [`AnalyticsConsentServer`](../src/components/analytics/AnalyticsConsentServer.tsx) is an async Server Component that calls `readConsentServer()` (which reads the cookie via `next/headers`), then renders the client [`AnalyticsConsent`](../src/components/analytics/AnalyticsConsent.tsx) with the value seeded in via the `initialConsent` prop. The root layout wraps it in `<Suspense fallback={null}>` to keep the dynamic access isolated; without PPR / Cache Components configured, `/` is currently dynamic but the verification step is the SSR HTML inspection, not the route mode.

The mobile branch in `AnalyticsConsent.tsx` is shown only where the mobile shell is, via `hidden mobile:block` (the `mobile:` custom variant is the same media query as `useIsMobile`: narrower than 1024 px, or portrait). While the desk intro may still play it also carries `intro-device:hidden`, so on portrait screens with motion allowed the banner waits for the intro to finish and the intro's headline is the first paint; with reduced motion or on a phone on its side the banner still ships visible; the desktop card stays client-gated on `isMobile === false` since desktop is already at the LCP target. Framer Motion's `AnimatePresence initial={false}` is set so the SSR'd banner first-paints at its animate state (visible) instead of `opacity: 0` — which would disqualify it as an LCP candidate.

**Re-decide (R8)**: the desktop card is persistent — after a decision it switches to a "Analytics enabled/disabled · Change preference" status form. Clicking "Change preference" swaps back to Decline/Allow buttons without resetting persisted consent. Desktop change-preference picks keep NC open showing the new status. Mobile re-opens via the MobileStatusBar clock toggle (clock is interactive only when env is set); mobile re-decide picks close the card.

**`ga-disable` flag (R8)**: written synchronously from `accept()` and `decline()` *before* the consent state update, so on Denied → Allow `next/script` mounts gtag.js with the flag already cleared and the first `page_view` fires; on Granted → Decline the flag is set before unmount, so any in-flight gtag activity stops. A `useEffect` keyed on `analyticsEnabled` is a backstop for mount / hydration / cross-tab cases. See Google's docs: <https://developers.google.com/analytics/devguides/collection/analyticsjs/user-opt-out>.

**Cookie limitation**: existing `_ga` / `_gid` cookies aren't actively cleared on Decline. They remain until expiry; the disable flag prevents further writes. Cookie cleanup would belong to a future CMP integration.

To reset for testing: open DevTools → Application → Cookies → delete the `ga-consent` cookie for the origin. For full end-to-end QA of every consent state transition, see **[docs/analytics-testing.md](analytics-testing.md)**.

**This is a consent gate, not a CMP.** No full GDPR/UK ePrivacy compliance is claimed: no preference granularity, no records of consent, no policy copy, no cookie cleanup, no Consent Mode v2. What R8 does cover: explicit decision required to dismiss the banner (Decline is equally available), but the rest of the site remains usable while undecided + withdrawable lifecycle on both viewports + reliable per-property disable. If full compliance becomes a goal, swap [AnalyticsConsent](../src/components/analytics/AnalyticsConsent.tsx) for a real CMP without touching the rest.

## Event catalog

The full list of events and parameters, what each one means, and how to set up and read them in the GA console, is in **[docs/analytics-events.md](analytics-events.md)**. Keep it in sync with the `GAEvent` union.

## Sending events

All events go through `trackEvent()` from [src/lib/analytics.ts](../src/lib/analytics.ts). The event union `GAEvent` is a TypeScript discriminated union, so adding or renaming an event or parameter rejects mistyped callsites at compile time.

`trackEvent()` short-circuits unless the `ga-consent` cookie is `"granted"` and `NEXT_PUBLIC_GA_ID` is set. Otherwise it:

1. Adds `shell: "desktop" | "mobile"` to every event, from `MOBILE_MEDIA_QUERY` (the same split as `useIsMobile()`), and drops params whose value is `undefined`.
2. Calls `window.gtag("event", name, params)` when gtag exists.
3. Otherwise queues the event (up to 50). gtag only exists once `<GoogleAnalytics>`'s inline init script has run, and `<GoogleAnalytics>` mounts inside `AnalyticsConsent`, which streams in under `<Suspense>` after the desktop has hydrated (and only after Accept on a first visit). `AnalyticsConsent` calls `flushPendingEvents()` in an effect keyed on `analyticsEnabled`; because `<GoogleAnalytics>` is its child, the child's `next/script` effect has already injected the init script (inline scripts run synchronously on insert), so queued events land in `dataLayer` after `js` and `config`. `sendGAEvent` from `@next/third-parties` is not used: it drops events with a console warning when gtag hasn't initialised.

Helpers:

- `trackOutboundClick(url, surface, projectId?)` — sends `outbound_click` with `link_domain` parsed from the URL.
- `flushPendingEvents()` — sends the queue; a no-op until gtag exists.
- Types `OutboundSurface` and `TerminalCommand` are exported for callsites that build params.

The window store's `OPEN` action requires a `source` (`AppOpenSource` in [src/types/window.ts](../src/types/window.ts)) unless it is `silent`, so every new launch surface has to say where it is; the dispatch wrapper sends it as `opened_from` on `app_open` and `project_view` (see [window-manager.md](window-manager.md#hooks-exported)).

In development builds (`NODE_ENV === "development"`), `<GoogleAnalytics debugMode>` adds `debug_mode: true` to the `config` call, so dev hits show in GA's DebugView and can be excluded with a Developer traffic data filter. Production builds don't set it.

Page views are handled automatically by `<GoogleAnalytics>` (no custom code). The URL never changes, so there is one `page_view` per page load.

## Adding a new event

1. Add a new variant to the `GAEvent` union in [src/lib/analytics.ts](../src/lib/analytics.ts). Check the name against GA's limits: event and parameter names up to 40 characters, none starting with `_`, `ga_`, `google_`, `firebase_` or `gtag.`; string values up to 100 characters; at most 25 parameters per event.
2. Don't name a parameter `source`, `medium`, `campaign`, `term` or `content`: GA stores the session's traffic source under those keys on every event. Reuse a built-in parameter name where one fits (`method`, `percent_scrolled`, `link_url`, `link_domain`) so it lands in GA's existing dimension.
3. Call `trackEvent({ name: "your_event", ... })` from the callsite.
4. Document it in [docs/analytics-events.md](analytics-events.md): the at-a-glance table, the custom-dimension table for any new parameter, and an event reference entry.

Avoid sending raw user input as event params — prefer normalized signals (lengths, enums, counts).
