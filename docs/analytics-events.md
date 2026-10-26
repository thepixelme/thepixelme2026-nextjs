# Analytics events — GA4 reference

What the site sends to Google Analytics 4, what each event and parameter means, and how to set up and read it in the GA console. For the consent gate, env var, and code contract, see [analytics.md](analytics.md).

The site is a single page, so GA's page-based reports (Pages and screens, Landing page) show little beyond `/`. Almost everything worth knowing lives in the custom events below.

## At a glance

| Event | Fires when | Key params |
|---|---|---|
| [`intro_complete`](#intro_complete) | The visitor finishes the desk intro and lands on the desktop or home screen | `method`, `seconds_to_enter` |
| [`app_open`](#app_open) | An app window or sheet is opened (or brought to the front) | `app_id`, `opened_from` |
| [`window_action`](#window_action) | A window is closed, minimized, maximized, or restored | `app_id`, `action` |
| [`spotlight_open`](#spotlight_open) | Spotlight search opens | `method` |
| [`spotlight_select`](#spotlight_select) | An app is launched from Spotlight | `app_id`, `query_length` |
| [`project_view`](#project_view) | A project opens in Preview | `project_id`, `opened_from` |
| [`finder_filter`](#finder_filter) | A tag (or All Projects) is picked in Finder's sidebar | `filter_tag` |
| [`screenshot_view`](#screenshot_view) | A project screenshot is shown in the image viewer | `project_id`, `screenshot_index`, `opened_from` |
| [`case_study_scroll`](#case_study_scroll) | A case study is scrolled past 25 / 50 / 75 / 100 % | `project_id`, `percent_scrolled` |
| [`outbound_click`](#outbound_click) | A link to another site is clicked | `link_url`, `link_domain`, `surface`, `project_id` |
| [`contact_form_start`](#contact_form_start) | The visitor starts typing a message | — |
| [`contact_form_submit`](#contact_form_submit) | A message is sent successfully | `subject_length`, `message_length` |
| [`contact_form_error`](#contact_form_error) | Sending a message fails | `error_type` |
| [`terminal_command`](#terminal_command) | A command is run in Terminal | `command`, `command_target` |

Every event above also carries [`shell`](#shell-on-every-event). GA adds its own automatic events on top (`page_view`, `session_start`, `first_visit`, `user_engagement`, plus any [enhanced measurement](#3-enhanced-measurement) events left on).

## What reaches GA (read this before trusting the numbers)

- **Nothing is sent until the visitor clicks Allow** on the consent prompt. Visitors who decline, never decide, or block GA with an ad blocker or privacy browser are invisible. Treat every count as a floor, not a census; a developer-heavy audience blocks GA often.
- **The intro runs before the consent prompt.** On a first visit the prompt only appears once the visitor is past the intro, so their `intro_complete` is never recorded. `intro_complete` therefore only comes from returning visitors who allowed analytics on an earlier visit.
- **A first visit's `page_view` fires at the moment of Allow**, not at page load, so it lands after the intro.
- **Raw text never leaves the browser.** Spotlight queries, contact-form contents, and Terminal input are reduced to lengths or to a fixed list of values before sending.

## One-time GA setup

All paths are in the GA4 Admin screen (gear icon, bottom-left).

### 1. Register the custom dimensions

GA only shows an event parameter in reports and Explorations after it is registered. Go to **Admin → Data display → Custom definitions → Create custom dimension**, choose **Scope: Event**, and type the event parameter exactly as below. The dimension name is free text; these are suggestions.

| Dimension name | Event parameter | Sent with |
|---|---|---|
| Shell | `shell` | every custom event |
| App | `app_id` | `app_open`, `window_action`, `spotlight_select` |
| Opened from | `opened_from` | `app_open`, `project_view`, `screenshot_view` |
| Project ID | `project_id` | `project_view`, `screenshot_view`, `case_study_scroll`, `outbound_click` |
| Window action | `action` | `window_action` |
| Finder tag | `filter_tag` | `finder_filter` |
| Screenshot number | `screenshot_index` | `screenshot_view` |
| Link surface | `surface` | `outbound_click` |
| Contact error | `error_type` | `contact_form_error` |
| Terminal command | `command` | `terminal_command` |
| Terminal target | `command_target` | `terminal_command` |

These four parameters feed GA's **built-in** dimensions and need no registration: `method` → **Method**, `percent_scrolled` → **Percent scrolled**, `link_url` → **Link URL**, `link_domain` → **Link domain**.

Optional custom **metrics** (same screen, **Custom metrics** tab), for averaging numbers in Explorations:

| Metric name | Event parameter | Unit |
|---|---|---|
| Seconds to enter | `seconds_to_enter` | Time → Seconds |
| Message length | `message_length` | Standard |
| Spotlight query length | `query_length` | Standard |

Custom dimensions and metrics are **not retroactive**: they start filling in 24–48 hours after you create them and never show data from before. Register them first. A standard property allows 50 event-scoped dimensions and 50 custom metrics, so this list uses a fraction of that.

### 2. Mark key events

**Admin → Data display → Key events → New key event**, enter the event name:

- `contact_form_submit` — the primary goal: someone sent a message.

Optional second goal, a click through to a live project: **Admin → Data display → Events → Create event**, name it `project_link_click`, with the conditions `event_name` equals `outbound_click` and `surface` equals `project_link`; then mark `project_link_click` as a key event. (The click is still recorded as `outbound_click` too.)

### 3. Enhanced measurement

**Admin → Data collection and modification → Data streams →** (the web stream) **→ Enhanced measurement** (gear icon).

| Setting | Recommendation | Why |
|---|---|---|
| Page views | On | Records the one `page_view` per visit. "Page changes based on browser history events" does nothing here; the URL never changes. |
| Scrolls | Off (harmless either way) | GA's `scroll` watches the page itself, which never scrolls here. `case_study_scroll` measures reading depth instead. |
| Outbound clicks | On | GA's automatic `click` event (`outbound: true`) catches every external link, including any not instrumented. `outbound_click` adds which surface and project the link came from. |
| Site search | Off | There are no search-result URLs. |
| Form interactions | **Off** | The Terminal prompt is a `<form>`, so typed commands can show up as `form_start` / `form_submit`, and the contact form's `form_submit` fires on failed sends too. The `contact_form_*` events cover this precisely. |
| Video engagement, File downloads | Either | Nothing on the site triggers them. |

### 4. Keep test traffic out

Local dev servers (`npm run dev`) send every hit with `debug_mode: true` (see [Testing](#testing-the-events)). Those hits **are** counted in normal reports until you filter them out:

- **Admin → Data collection and modification → Data filters → Create filter → Developer traffic**, then set its state to **Active**. Filtering is permanent for the data it drops, so try it in **Testing** state first if unsure.
- Optionally, an **Internal traffic** filter for your own IP addresses (define the IPs under the web stream's **Configure tag settings → Define internal traffic**).

### 5. Data retention

**Admin → Data collection and modification → Data retention → Event data retention**: raise it from 2 months to **14 months**. Explorations (funnels, free-form tables) can only look back as far as this setting, and a low-traffic site needs the longer window to build up useful numbers.

If a report shows a data-thresholding warning (counts withheld because they are small), **Admin → Data display → Reporting identity → Device-based** removes the thresholding that Google signals adds.

## Global parameter

### `shell` (on every event)

Which interface the visitor was looking at when the event fired:

| Value | Meaning |
|---|---|
| `desktop` | The macOS-style desktop: landscape viewports 1024 px wide or more. Windows, Dock, menu bar, Terminal. |
| `mobile` | The touch shell: viewports narrower than 1024 px, or portrait at any width (phones, tablets, an upright monitor). Home screen, sheets, mobile dock. |

This is not GA's **Device category**: a tablet held sideways at 1180 px gets `desktop`, and a rotated monitor gets `mobile`. Use **Shell** as a breakdown to compare the two interfaces.

## Event reference

### `intro_complete`

The visitor finished the desk intro (the scroll-to-zoom room scene) and the live desktop or home screen took over. Fires once per page load. Never fires for visitors who don't get the intro (reduced motion, a desktop window squarer than 5:4, or a phone on its side), and see [What reaches GA](#what-reaches-ga-read-this-before-trusting-the-numbers): only returning, consenting visitors are recorded.

| Param | Values | Meaning |
|---|---|---|
| `method` | `scroll` | Scrolled or swiped the zoom all the way in by hand. |
| | `click` | Clicked or tapped the device screen, which plays the zoom. |
| | `keyboard` | Pressed ↓, Space, Enter, Page Down or End, which plays the zoom. |
| | `skip` | Pressed Esc or ⌘K / Ctrl+K, which jumps straight in. |
| `seconds_to_enter` | number, 1 decimal | Seconds from the start of page load to entering. Includes load time; a tab left in the background makes large outliers. |

Fired from [DeskIntro.tsx](../src/components/intro/DeskIntro.tsx). Answers: do visitors understand the intro, or skip it? How long do they linger in the room?

### `app_open`

An app was opened from a visitor action. Opening an app that is already open (or minimized) brings it to the front and still counts. The About window that opens by itself during the desktop intro does **not** count.

| Param | Values | Meaning |
|---|---|---|
| `app_id` | `about`, `finder`, `contact`, `terminal`, `preview` | The app. `preview` is the project viewer; see `project_view` for which project. |
| `opened_from` | `dock` | Desktop Dock icon. |
| | `menu_bar` | Desktop menu bar: the name (About), Projects (Finder) or Contact. |
| | `spotlight` | Picked in Spotlight. |
| | `finder` | A project card in Finder (always `app_id: preview`). |
| | `home_screen` | Mobile home screen: About me, Contact, See all (Finder), or a project in the carousel. |
| | `mobile_dock` | Mobile dock icon. |
| | `status_bar` | Mobile status bar name (About). |

Fired from the dispatch wrapper in [windows-store.ts](../src/lib/windows-store.ts), so every launch surface is covered. Answers: which apps do visitors open, and which navigation do they actually use?

### `window_action`

A window-chrome button was used.

| Param | Values | Meaning |
|---|---|---|
| `app_id` | as `app_open` | The window's app. |
| `action` | `close` | Desktop red traffic light, or mobile **Done**. |
| | `minimize` | Desktop yellow traffic light. |
| | `maximize` | Desktop green traffic light or a title-bar double-click, on a normal window. |
| | `restore` | The same, on a maximized window. |

Fired from [Window.tsx](../src/components/window/Window.tsx) and [AppSheet.tsx](../src/components/mobile/AppSheet.tsx). Going home on mobile (the home indicator) is not counted. Answers: do visitors maximize Preview to see screenshots bigger? Which apps get closed straight away?

### `spotlight_open`

Spotlight search opened.

| Param | Values | Meaning |
|---|---|---|
| `method` | `shortcut` | ⌘K / Ctrl+K. Pressing it while Spotlight is already open doesn't count again. |
| | `click` | The magnifier in the desktop menu bar or the mobile status bar. |

Fired from [Spotlight.tsx](../src/components/desktop/Spotlight.tsx), [MenuBar.tsx](../src/components/desktop/MenuBar.tsx) and [MobileStatusBar.tsx](../src/components/mobile/MobileStatusBar.tsx). Pair with `spotlight_select` to see how many searches end in a launch.

### `spotlight_select`

An app was launched from Spotlight (Enter or click). An `app_open` with `opened_from: spotlight` follows it.

| Param | Values | Meaning |
|---|---|---|
| `app_id` | as `app_open` | The app launched. |
| `query_length` | number | Characters typed before choosing (0 = picked from the full list). The query text itself is not sent. |

### `project_view`

A project opened in Preview (its case study). Fires every time a project is opened, including switching to another project while Preview is already open. An `app_open` with `app_id: preview` accompanies it.

| Param | Values | Meaning |
|---|---|---|
| `project_id` | see [Project IDs](#project-ids) | The project. |
| `opened_from` | `finder` | A card in Finder's project grid. |
| | `home_screen` | The mobile home screen's project carousel. |

Fired from the dispatch wrapper in [windows-store.ts](../src/lib/windows-store.ts). Answers: which projects attract attention?

### `finder_filter`

A filter was picked in Finder's sidebar. Re-picking the filter that is already active doesn't count.

| Param | Values | Meaning |
|---|---|---|
| `filter_tag` | `all`, or a tag: `App`, `Web`, `TypeScript`, `Swift`, `Node.js`, `React`, `React Native`, `Next.js`, `PostgreSQL`, `WordPress`, `Shopify`, `Supabase`, `Stripe` | `all` is **All Projects**. The tag list is `PROJECT_TAGS` in [src/lib/projects/types.ts](../src/lib/projects/types.ts). |

Fired from [FinderApp.tsx](../src/components/apps/FinderApp.tsx). Answers: what technologies are visitors looking for?

### `screenshot_view`

A project screenshot was shown in the image viewer. Each screenshot shown counts, so paging through five screenshots is five events.

| Param | Values | Meaning |
|---|---|---|
| `project_id` | see [Project IDs](#project-ids) | The project. |
| `screenshot_index` | 1, 2, 3 … | Position in the project's gallery (1 = first). |
| `opened_from` | `case_study` | A thumbnail inside the case study. |
| | `sidebar` | A thumbnail in Preview's desktop sidebar. |
| | `viewer` | Moving within the viewer: ← / → keys on desktop; swipe or the filmstrip on mobile. |

Fired from [PreviewApp.tsx](../src/components/apps/PreviewApp.tsx). Answers: do visitors look at the screenshots, and how deep into a gallery do they go?

### `case_study_scroll`

The case study was scrolled past a depth milestone. Each milestone fires at most once per project per time the project is opened (flipping to a screenshot and back doesn't repeat it). Depth is scroll position, so 100 means the visitor reached the end ("What I learned"). A case study short enough to fit without scrolling sends nothing.

| Param | Values | Meaning |
|---|---|---|
| `project_id` | see [Project IDs](#project-ids) | The project. |
| `percent_scrolled` | `25`, `50`, `75`, `100` | The milestone reached. Jumping straight to the bottom fires every milestone passed on the way. |

Fired from [PreviewApp.tsx](../src/components/apps/PreviewApp.tsx). Answers: are case studies being read, and where do readers drop off?

### `outbound_click`

A link to another site was clicked (they all open in a new tab).

| Param | Values | Meaning |
|---|---|---|
| `link_url` | URL | The destination (GA truncates values over 100 characters). |
| `link_domain` | hostname | e.g. `github.com`, `www.lamgig.com`. |
| `surface` | `project_link` | The case study's primary button (e.g. "Visit lamgig.com"). |
| | `project_source` | The case study's **View source** button. |
| | `about_social` | A social link in About (e.g. GitHub). |
| `project_id` | see [Project IDs](#project-ids) | The project, for `project_link` and `project_source`. Absent for `about_social`. |

Fired from [CaseStudy.tsx](../src/components/apps/preview/CaseStudy.tsx) and [AboutApp.tsx](../src/components/apps/AboutApp.tsx). If enhanced measurement's outbound clicks are on, GA's own `click` event fires for the same click; filter on event name to avoid double counting. Answers: which projects do visitors go and try for real?

### `contact_form_start`

The visitor typed into the Contact form for the first time in a new message (any field). After a successful send, the next edit counts as a new start. No params.

Fired from [ContactApp.tsx](../src/components/apps/ContactApp.tsx). `contact_form_submit` ÷ `contact_form_start` is the form's completion rate.

### `contact_form_submit`

**Key event.** A message was accepted by the server and emailed. Failed attempts don't fire it.

| Param | Values | Meaning |
|---|---|---|
| `subject_length` | number | Characters in the (optional) subject; 0 = left blank. |
| `message_length` | number | Characters in the message. |

The name, email, subject, and message themselves are never sent to GA.

### `contact_form_error`

Sending failed and the visitor saw an error.

| Param | Values | Meaning |
|---|---|---|
| `error_type` | `rate_limit` | More than 3 sends from one IP in 10 minutes. |
| | `validation` | The server rejected a field (e.g. a malformed email). |
| | `server` | The send failed on the server (e.g. the email provider errored or its env vars are missing). Worth investigating if it shows up. |
| | `network` | The request never reached the server (offline, blocked). |

### `terminal_command`

A command was run in Terminal (desktop only). Empty input doesn't count.

| Param | Values | Meaning |
|---|---|---|
| `command` | `help`, `whoami`, `ls`, `cat`, `clear` | A command the Terminal understands. |
| | `unknown` | Anything else. What was typed is **not** sent. |
| `command_target` | `projects`, `about.md`, `other` | The path given to `ls` or `cat`; `other` for any other path. Absent for other commands and for a bare `ls` / `cat`. |

Fired from [TerminalApp.tsx](../src/components/apps/TerminalApp.tsx). Answers: does anyone find the Terminal, and do they get past `help`?

### Project IDs

`project_id` is the project's `id` from [src/lib/projects/](../src/lib/projects/):

| `project_id` | Project |
|---|---|
| `lamgig-platform` | LamGig: The growth platform for small businesses |
| `bonneville-mobile` | Bonneville News & Sports Mobile |
| `claudeswitcher` | ClaudeSwitcher |
| `heygrillhey` | Hey Grill Hey — Recipe and commerce rebuild |
| `apipeek` | APIPeek — JSON viewer & API sandbox |

## Reading the data in GA

| You want to know | Where | Set up |
|---|---|---|
| Is anything arriving right now? | **Reports → Realtime** | Event count by Event name card. Shows the last 30 minutes. |
| Totals for every event | **Reports → Engagement → Events** | Click an event name for its detail page; registered parameters appear as cards there. |
| Which projects get attention | **Explore → Free form** | Rows: Project ID. Columns: Opened from. Values: Event count. Filter: Event name exactly matches `project_view`. |
| Are case studies read to the end | **Explore → Free form** | Rows: Project ID. Columns: Percent scrolled. Values: Event count. Filter: Event name exactly matches `case_study_scroll`. Compare the `25` column to `100`. |
| Desktop vs mobile behaviour | Any report or exploration | Add **Shell** as a breakdown, or use it as a comparison in standard reports. |
| How visitors navigate | **Explore → Free form** | Rows: App. Columns: Opened from. Values: Event count. Filter: Event name exactly matches `app_open`. |
| Visitor journey to a message | **Explore → Funnel exploration** | Steps: `page_view` → `project_view` → `case_study_scroll` (parameter `percent_scrolled` = 100) → `contact_form_submit`. Breakdown: Shell. |
| Contact form drop-off | **Explore → Funnel exploration** | Steps: `app_open` (App = `contact`) → `contact_form_start` → `contact_form_submit`. Check `contact_form_error` by Contact error alongside. |
| Paths between events | **Explore → Path exploration** | Starting point: `page_view` (or `intro_complete`); node type: Event name. |
| How people get past the intro | **Explore → Free form** | Rows: Method. Values: Event count, Seconds to enter (custom metric). Filter: Event name exactly matches `intro_complete`. Average = Seconds to enter ÷ Event count. |

In Explorations, add dimensions and metrics in the **Variables** column first (the **+** next to Dimensions / Metrics); a custom dimension only appears there after it has been registered and has collected data.

## Testing the events

**Watch the events in the browser without sending anything to GA.** Run the dev server with a placeholder ID (a variable set in the shell overrides `.env.local`), allow analytics in the consent prompt, then list what was queued for GA in the DevTools console:

```bash
NEXT_PUBLIC_GA_ID=G-TESTTESTTEST npm run dev
```

```js
dataLayer.filter((a) => a[0] === "event").map((a) => [a[1], a[2]])
```

**Watch them arrive in GA.** With the real ID in `.env.local`, `npm run dev` marks every hit with `debug_mode: true`, so they stream into **Admin → Data display → DebugView** within seconds, with every parameter shown (registered or not). Production builds never set `debug_mode`. Keep the [Developer traffic filter](#4-keep-test-traffic-out) active so these test hits stay out of reports.

To reset the consent choice between tests, delete the `ga-consent` cookie; [analytics-testing.md](analytics-testing.md) walks through the consent flow itself.

## Changing the events

Event and parameter names are what GA stores, so renaming one splits its history in two: the old name stops at the change and the new one starts from zero. To add an event, follow [Adding a new event](analytics.md#adding-a-new-event) and add it to this page; register any new parameter as a custom dimension in GA before shipping so data collects from the first day.
