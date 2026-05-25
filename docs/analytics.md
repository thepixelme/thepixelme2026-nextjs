# Analytics

Google Analytics 4, mounted via [`@next/third-parties/google`](https://nextjs.org/docs/app/guides/third-party-libraries#google-analytics). Consent-gated, env-gated, and event-typed.

## Env var

`NEXT_PUBLIC_GA_ID` — GA4 Measurement ID (`G-XXXXXXXXXX`). Optional.

- When **unset**, no analytics script loads, no consent prompt is shown, and `trackEvent()` is a no-op. The desktop Notification Center shell still mounts (so the menu-bar clock can open an empty NC); it just contains no notifications.
- When **set**, the consent prompt appears on first visit. On desktop the [Notification Center](desktop-shell.md#notification-center-srccomponentsnotificationsnotificationcentertsx) panel auto-opens with the consent notification inside; on mobile a standalone liquid-glass notification card slides down from above the top edge. GA only loads after Accept.
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
| absent      | Consent card shown. The mobile banner is rendered in the initial server HTML (see SSR section below). Desktop NC auto-opens and is **modal-locked** (Esc / X / backdrop / clock-toggle-to-close are all blocked); mobile shows a top-center card that can't be dismissed without a choice. No GA until the visitor decides. |

`readConsent()` matches the cookie against `/(?:^|; )ga-consent=([^;]+)/`. `writeConsent()` assigns `document.cookie = "ga-consent=...; Max-Age=31536000; Path=/; SameSite=Lax; Secure" (Secure only on https)`. Because `document.cookie = ...` doesn't throw when the browser rejects the cookie, `writeConsent()` performs a read-back and returns `true` only when the value persisted. On Accept-with-storage-failure, in-memory `consent` stays `null` (fail closed — `<GoogleAnalytics>` does not mount and NC stays locked); user must Decline to escape. On Decline-with-storage-failure, in-memory `consent` flips to `"denied"` for the session even though it didn't persist; reload re-prompts.

## SSR (mobile banner)

The mobile consent banner ships in the initial server HTML so it can be the LCP candidate without paying for hydration. [`AnalyticsConsentServer`](../src/components/analytics/AnalyticsConsentServer.tsx) is an async Server Component that calls `readConsentServer()` (which reads the cookie via `next/headers`), then renders the client [`AnalyticsConsent`](../src/components/analytics/AnalyticsConsent.tsx) with the value seeded in via the `initialConsent` prop. The root layout wraps it in `<Suspense fallback={null}>` to keep the dynamic access isolated; without PPR / Cache Components configured, `/` is currently dynamic but the verification step is the SSR HTML inspection, not the route mode.

The mobile branch in `AnalyticsConsent.tsx` is hidden on desktop via Tailwind `lg:hidden` (matching `useIsMobile`'s 1023.98 px cutoff = Tailwind v4 `lg` 1024 px); the desktop card stays client-gated on `isMobile === false` since desktop is already at the LCP target. Framer Motion's `AnimatePresence initial={false}` is set so the SSR'd banner first-paints at its animate state (visible) instead of `opacity: 0` — which would disqualify it as an LCP candidate.

**Re-decide (R8)**: the desktop card is persistent — after a decision it switches to a "Analytics enabled/disabled · Change preference" status form. Clicking "Change preference" swaps back to Decline/Allow buttons without resetting persisted consent. Desktop change-preference picks keep NC open showing the new status. Mobile re-opens via the MobileStatusBar clock toggle (clock is interactive only when env is set); mobile re-decide picks close the card.

**`ga-disable` flag (R8)**: written synchronously from `accept()` and `decline()` *before* the consent state update, so on Denied → Allow `next/script` mounts gtag.js with the flag already cleared and the first `page_view` fires; on Granted → Decline the flag is set before unmount, so any in-flight gtag activity stops. A `useEffect` keyed on `analyticsEnabled` is a backstop for mount / hydration / cross-tab cases. See Google's docs: <https://developers.google.com/analytics/devguides/collection/analyticsjs/user-opt-out>.

**Cookie limitation**: existing `_ga` / `_gid` cookies aren't actively cleared on Decline. They remain until expiry; the disable flag prevents further writes. Cookie cleanup would belong to a future CMP integration.

To reset for testing: open DevTools → Application → Cookies → delete the `ga-consent` cookie for the origin. For full end-to-end QA of every consent state transition, see **[docs/analytics-testing.md](analytics-testing.md)**.

**This is a consent gate, not a CMP.** No full GDPR/UK ePrivacy compliance is claimed: no preference granularity, no records of consent, no policy copy, no cookie cleanup, no Consent Mode v2. What R8 does cover: forced explicit decision before dismissal (Decline is equally available) + withdrawable lifecycle on both viewports + reliable per-property disable. If full compliance becomes a goal, swap [AnalyticsConsent](../src/components/analytics/AnalyticsConsent.tsx) for a real CMP without touching the rest.

## Event catalog

All events go through `trackEvent()` from [src/lib/analytics.ts](../src/lib/analytics.ts), which sends via `sendGAEvent` and short-circuits if consent isn't `"granted"` or the env var is unset. The event union is a TypeScript discriminated union — adding or renaming an event in `analytics.ts` rejects mistyped callsites at compile time.

| Event | Params | Fired from |
|---|---|---|
| `contact_form_submit` | `subject_length: number` | [ContactApp.tsx:80-87](../src/components/apps/ContactApp.tsx), inside the success branch (`payload.ok === true`). Failed submissions and validation errors do not fire. |
| `app_open` | `app_id: AppId` | The `useCallback` dispatch wrapper in `WindowsProvider` ([src/lib/windows-store.ts:205-220](../src/lib/windows-store.ts)). Captures every `OPEN` action — Dock, MenuBar, Spotlight, Finder, mobile — through one chokepoint. The reducer stays pure. |
| `spotlight_select` | `app_id: AppId`, `query_length: number` | The `launch()` function in [Spotlight.tsx](../src/components/desktop/Spotlight.tsx), hit by both Enter-key and click paths. `query_length` is sent instead of the raw query to avoid PII. |
| `outbound_click` | `href: string`, `surface: "about_social" \| "project_link" \| "project_source"` | `onClick` on the three `target="_blank"` anchors: [AboutApp.tsx](../src/components/apps/AboutApp.tsx) social links, [CaseStudy.tsx](../src/components/apps/preview/CaseStudy.tsx) Visit / Source buttons. |

Page views are handled automatically by `<GoogleAnalytics>` (no custom code).

## Adding a new event

1. Add a new variant to the `GAEvent` union in [src/lib/analytics.ts](../src/lib/analytics.ts).
2. Call `trackEvent({ name: "your_event", ... })` from the callsite.
3. Document it in the event-catalog table above.

Avoid sending raw user input as event params — prefer normalized signals (lengths, enums, counts).
