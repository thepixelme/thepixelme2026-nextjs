# Analytics consent — manual test guide

A walkthrough for verifying the GA consent flow end-to-end. Pair this with [docs/analytics.md](analytics.md) (which describes the contract) and [docs/desktop-shell.md](desktop-shell.md) (which describes the UI components).

This guide assumes:

- You have access to a working `NEXT_PUBLIC_GA_ID` (a real GA4 measurement ID like `G-XXXXXXXXXX`). Set it in `.env.local`.
- You can run `npm run dev` and view the site at `http://localhost:3000`.
- You're comfortable opening browser DevTools.

If you don't have a real GA ID, you can still use a placeholder like `G-TESTTESTTEST` for everything except the "GA actually fires a page_view" checks — gtag will load and call the collect endpoint with a bogus ID, which is fine for verifying the gate.

---

## 0. Setup — what to have open

1. Set `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX` in `.env.local`. **Restart `npm run dev` after changing this** (it's inlined at build/dev-server start).
2. Open `http://localhost:3000` in a normal Chrome/Safari window (not Incognito — Incognito skews cookie persistence testing).
3. Open DevTools. Keep these panels handy:
   - **Console** — for typing `window['ga-disable-G-XXXXXXXXXX']` and reading the value.
   - **Network** tab, filtered to `analytics` or `google` — for spotting `gtag/js?id=...` (gtag.js loading) and `g/collect` (data being sent).
   - **Application → Cookies → `http://localhost:3000`** — for deleting `ga-consent` between tests and watching it change.
   - **Elements** — for DOM-inspecting the close X and the mobile clock.

### "Fresh state" — how to reset between scenarios

You'll do this constantly. The fastest path:

1. DevTools → **Application** → **Cookies** → `http://localhost:3000` → select the row with name `ga-consent` → press **Delete** (trash icon). Hard reload so the next request is made without the cookie (the server-rendered banner shell depends on cookie state being read at request time).
2. Network tab → click 🚫 (clear) to wipe captured requests.
3. Hard reload: **Cmd/Ctrl+Shift+R**.

Now you're back to "first-visit, undecided."

---

## 1. Desktop first visit → **Allow** path

**Setup:** Fresh state. `NEXT_PUBLIC_GA_ID` is set. Window is wide (≥1024px).

**Steps:**

1. Reload the page.
2. The Notification Center (NC) panel should slide in from the right edge automatically, showing one consent notification card.
3. Inspect the card. The title should be **"Allow Analytics?"**. Two equal-width buttons at the bottom: **Decline** and **Allow**.
4. In DevTools → Elements, find the panel's `<aside>` header. There should be **no X close button** (the persistent flag hides it). The header just shows "Notification Center" text.
5. Press **Esc**. Click the menu-bar clock. → **NC should not close.** (Esc and clock-toggle close attempts are refused while persistent.) Clicking outside the panel **no longer hits a backdrop** — clicks on the wallpaper, dock, or any underlying control reach those elements directly. Confirm: **click a Dock icon while the consent card is showing → the app opens and its window appears. The consent card remains visible.** This validates the non-blocking behavior.
6. Click **Allow**.

**Expected:**

- The NC panel slides closed within ~250ms.
- Network tab: a request to `https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX` (gtag.js loading).
- Network tab: a request to `https://www.google-analytics.com/g/collect?...&en=page_view&...` (the page_view event).
- Console: `window['ga-disable-G-XXXXXXXXXX']` returns `false`.
- Cookies: `ga-consent` is `"granted"`.
- Click the menu-bar clock → NC re-opens, this time showing a card titled **"Analytics enabled"** with a single **"Change preference"** action. The close X is now visible in the header (persistent flag released).

---

## 2. Desktop first visit → **Decline** path

**Setup:** Fresh state. Wide window.

**Steps:**

1. Reload. NC auto-opens persistent, consent card visible. (The rest of the page remains interactive — clicking outside the panel hits underlying controls; only Accept / Decline dismiss the card.)
2. Click **Decline**.

**Expected:**

- NC slides closed.
- Network tab: **no** requests to `googletagmanager.com` or `google-analytics.com`.
- Console: `window['ga-disable-G-XXXXXXXXXX']` returns `true`.
- Cookies: `ga-consent` is `"denied"`.
- Click the menu-bar clock → NC re-opens showing **"Analytics disabled"** + **"Change preference"** action. X close button visible.

---

## 3. Desktop change-preference flow

**Setup:** From the end of scenario 1 or 2 (consent is decided, NC is closed).

**Steps:**

1. Click the menu-bar clock → NC re-opens with the status card.
2. Click **"Change preference"** in the card.
3. The card should swap to the **"Allow Analytics?"** layout with **Decline** and **Allow** buttons. **NC stays open** (no slide-out animation).
4. Click the opposite of what you previously chose (e.g. if granted, click Decline).

**Expected:**

- Consent flips: Cookies `ga-consent` updates to the new value.
- The card switches **in place** to the new status — `"Analytics enabled"` ↔ `"Analytics disabled"`. NC **stays open** (this is the intentional desktop UX so the user sees the new state).
- `window['ga-disable-...']` flips correspondingly (true on Decline, false on Allow).
- Bonus check: close NC, reload page. The persisted choice survives (the `ga-consent` cookie still has the latest value).

---

## 4. Withdrawal really stops gtag (Grant → Decline)

This is the key test for the `ga-disable` flag.

**Setup:** Fresh state. Wide window.

**Steps:**

1. Reload. Click **Allow** to load GA. Confirm a `g/collect` request fires for the initial page_view.
2. Open an app from the Dock (e.g. click the Finder icon). The app window opens.
3. Network tab: confirm a `g/collect` request fires for `event=app_open` (this is the custom `trackEvent` going through). Keep an eye on the request count.
4. Click the menu-bar clock → NC opens with status card.
5. Click **"Change preference"** → Decline.
6. Open another app (e.g. Contact). Close it. Open another.

**Expected:**

- After Decline: console shows `window['ga-disable-G-XXXXXXXXXX'] === true`.
- After step 6: **no new `g/collect` requests** in the network tab. The previously-loaded gtag.js sees the disable flag and silently drops everything; `trackEvent()` also short-circuits on the consent check.

If you see requests still firing after Decline, the `ga-disable` flag isn't being honored — that's a regression of the R8 v6 fix.

---

## 5. Re-grant really resumes gtag (Denied → Allow — the v6 race fix)

This is the test that R8 v6 specifically targets.

**Setup:** End of scenario 4 (consent is `denied`, GA was previously loaded, `ga-disable` is `true`).

**Steps:**

1. Click clock → NC opens with "Analytics disabled" status.
2. Click **"Change preference"** → Allow.
3. Watch the network tab carefully.

**Expected:**

- `window['ga-disable-G-XXXXXXXXXX']` is now `false`.
- A new `g/collect` request for the page_view fires shortly after Allow.
- Opening an app continues to fire `app_open` events.

If no page_view fires after Allow, the synchronous `setGaDisabled(false)` in `accept()` might be running after `setConsent`, letting the flag stay `true` while gtag re-inits. That's the bug R8 v6 fixed; it would mean the fix regressed.

---

## 6. Reload persistence

**Setup:** Whatever the current consent state is.

**Steps:**

1. Note the current Cookies `ga-consent` value.
2. Hard reload the page (Cmd/Ctrl+Shift+R).

**Expected:**

- If `ga-consent === "granted"`: GA loads automatically on first paint; no consent card visible; clock click opens NC with "Analytics enabled" status.
- If `ga-consent === "denied"`: GA does not load; no consent card visible; clock click opens NC with "Analytics disabled" status; `window['ga-disable-...']` is `true` (set by the effect backstop on hydration).
- If `ga-consent` is absent (deleted): you get the first-visit experience again (NC auto-opens persistent — non-blocking but undismissable without a decision).

---

## 7. Mobile flow (≤1023px wide)

**Setup:** DevTools → toggle device toolbar → choose iPhone 15 / 390×844 or similar. Fresh state. Reload.

**Steps:**

1. The consent card appears top-center, just below the status bar. There's **no Notification Center panel** (mobile doesn't have one).
2. In the status bar, the clock should be a tap target — DevTools → Elements → find the clock element. It should be a `<button>`, not a `<span>`. (R8 v6 finding.)
3. Tap the clock while the card is showing. → The card stays. (NC is persistent — close attempts are refused. Mobile NC isn't visible anyway, but the persistent flag is still set.)
4. Tap **Decline** on the card. → Card hides.
5. Tap the clock again. → Card re-appears in Decline/Allow buttons mode.
6. Tap **Allow**. → Card hides. GA loads. `g/collect` request for page_view fires.

**Expected at every step:** behavior matches the descriptions. There's no status-mode "Change preference" intermediate on mobile — the re-decide UI is just the Decline/Allow buttons directly.

---

## 8. Mobile env-unset: clock stays plain text

**Setup:** Remove `NEXT_PUBLIC_GA_ID` from `.env.local` (or comment it out). Restart `npm run dev`. Switch to mobile width.

**Steps:**

1. Reload.
2. DevTools → Elements → find the MobileStatusBar clock.

**Expected:**

- The clock is a `<span>`, **not** a `<button>` (no onClick handler, no hover affordance).
- Tapping it does nothing.
- No consent card visible anywhere.
- No GA requests in the network tab.

Restore the env var when done.

---

## 9. Storage-failure paths

**Setup:** Wide window. Fresh state. Open the Console.

**Steps to simulate the cookie write being rejected:**

Cookies can be rejected silently by the browser (third-party cookie blocking, quota, malformed value). `document.cookie = ...` never throws — the write either persists or doesn't. `writeConsent()` performs a read-back and returns `false` when the value didn't persist.

The cleanest local simulation is to make `readConsent()` see no cookie regardless of what was written: in DevTools → Application → Cookies → right-click the origin → **Clear** before clicking Allow, and ALSO put a temporary stub in the Console:

```js
// Stub readConsent's source. Restore by reloading.
Object.defineProperty(document, "cookie", {
  configurable: true,
  get() { return ""; },
  set() { /* swallow writes — simulates browser-side rejection */ },
});
```

(Reload the page when done — the stub is per-document and reload restores normal cookie access.)

### 9a. Desktop trap on Accept-failure

1. Reload. NC auto-opens persistent with consent card.
2. Click **Allow**.

**Expected:**

- Cookies: `ga-consent` is **not** set (the write didn't persist; `writeConsent()` returned `false` from the read-back).
- Card **stays visible** in buttons mode (consent stayed `null`).
- NC stays persistent (X still hidden, Esc/clock don't close, no backdrop to click). The user can ignore the banner and use the site; GA does not load. They can still click Decline to dismiss the banner.
- GA does **not** load — `window['ga-disable-G-XXXXXXXXXX']` is `true`.

3. Click **Decline**. → NC closes (in-memory consent flips to `"denied"`; deferred-close fires).

4. Reload to remove the cookie stub. → You're back to fresh state (the writes never persisted).

### 9b. Mobile failed-Accept stays visible

1. Reload to clear the cookie stub, then re-apply the override above. Switch to mobile width. Hard reload to clear consent.
2. Card auto-shows top-center.
3. Tap **Allow**.

**Expected:**

- Card **remains visible** (this is the R8 v4 fix — gating on `consent === null`, not `promptVisible`).
- `window['ga-disable-...']` is `true`.
- Tap **Decline** to escape.

If the card disappears after step 3, the mobile gate is incorrectly checking `promptVisible` — that's a regression.

---

## 10. Reduced-motion

**Setup:** macOS → System Settings → Accessibility → Display → "Reduce motion" ON. (Or Chrome DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion" → "reduce".)

**Steps:** Fresh state. Reload.

**Expected:** NC appears **instantly** rather than sliding in. Closing on Allow/Decline also unmounts instantly. Spring animation is suppressed.

---

## 11. Other chrome unchanged (regression spot-checks)

After all the analytics work, the rest of the site should be visually identical.

**Steps:**

1. Press **Cmd+K** while NC is open. → Spotlight overlay appears **above** the NC panel (Spotlight is `z-60`, NC is `z-50`). Esc closes Spotlight; NC is revealed unchanged.
2. Right-click the wallpaper → desktop context menu still appears.
3. Drag a window by its titlebar → still works. Resize from edges → still works.
4. Click the Dock icons → apps open. Click the traffic-light close → window closes.
5. Toggle theme via System Settings app → glass-light ↔ glass-dark transitions still work.
6. **Non-blocking consent (regression check):** delete the `ga-consent` cookie and hard-reload. While the persistent consent card is visible, drag a window, click a Dock icon, right-click the wallpaper, press **Cmd+K** for Spotlight. **All should work normally.** The consent card itself stays put.

If any of these regressed, something analytics-related accidentally broke a shared piece.

---

## Quick reference — what to check, where

| Signal | Where |
|---|---|
| Consent persisted state | DevTools → Application → Cookies → name `ga-consent` |
| In-memory disable flag | Console: `window['ga-disable-G-XXXXXXXXXX']` |
| GA script loaded | Network tab → `gtag/js?id=...` request |
| Page_view sent | Network tab → `g/collect?...&en=page_view` |
| Custom event sent | Network tab → `g/collect?...&en=app_open` (or other event name) |
| Persistent banner active | Elements → NC `<aside>` header → no X button; no `<button aria-label="Close Notification Center">` sibling backdrop in the DOM |
| Mobile clock interactive | Elements → MobileStatusBar clock → `<button>` not `<span>` |

## Common failure modes and what they mean

| Symptom | Likely cause |
|---|---|
| NC closes when you press Esc on the first visit | Persistent flag not wired (`setPersistent` not being called, or context doesn't honor it) |
| Clicking the Dock / wallpaper while consent card is up does nothing (backdrop intercepts) | Conditional backdrop regression — verify `!persistent` gate around the `<button>` backdrop in `NotificationCenter.tsx` |
| Click Allow on fresh visit → NC stays open | Deferred-close effect ordering wrong (lock effect must come first in declaration order) |
| Denied → Allow doesn't fire page_view | `setGaDisabled(false)` not called synchronously before `setConsent("granted")` in `accept()` |
| Decline doesn't stop traffic | `ga-disable` flag isn't being set; either `setGaDisabled(true)` missing from `decline()` or the gaId string is wrong |
| Mobile failed-Accept hides the card | Mobile gate is still checking `promptVisible` instead of `consent === null` |
| Mobile clock tap does nothing when env is set | MobileStatusBar's env-gated button isn't rendering, or `toggle()` isn't wired to `useNotificationCenter()` |
