import type { Project } from "./types";

export const apipeek: Project = {
  id: "apipeek",
  title: "APIPeek — JSON viewer & API sandbox",
  tags: ["Browser extension", "TypeScript", "React"],
  link: "https://chromewebstore.google.com/detail/apipeek/kpndkgphbnjghmaonfhhcmlnamlaegee",
  linkLabel: "Install on Chrome Web Store",
  source: "https://github.com/thepixelme/apipeek",
  summary:
    "A Chrome / Firefox extension that turns the browser's built-in JSON viewer into a developer-friendly API sandbox: collapsible tree, search, JSONPath filter, schema generation, and a request panel that lets you change method, headers and body and re-fire the call without ever leaving the tab.",
  description:
    "Most of the engineering went into making MV3's constraints: isolated content scripts, hibernating service workers, no `eval`, single-file bundles, hostile host CSS. All of which are invisible to the user.",
  role: "Sole developer, from concept to store listing",
  stack: [
    "TypeScript",
    "React 19",
    "Zustand",
    "WXT",
    "MV3 service worker",
    "quicktype-core",
    "jsonpath-plus",
    "react-json-tree",
  ],
  status: "v0.0.1, prepared for Chrome Web Store submission",
  problem:
    "Looking at a JSON response in a browser tab is a dead end. You eyeball it, then you copy-paste it into Postman to re-fire the request, into `jq` to filter, into quicktype.io to generate types, into VS Code to format. APIPeek collapses all of those round-trips into the page where the response already lives.\n\nThe interesting part isn't the feature list; it's that delivering this on top of an MV3 extension means living inside an unforgiving runtime: isolated content scripts, hibernating service workers, no `eval`, single-file content bundles, and a hostile CSS environment that belongs to whatever site you happen to be on. Most of the engineering went into making those constraints invisible to the user.",
  highlights: [
    {
      title: "Mounting React inside a shadow root, on a page that isn't yours",
      body: "The viewer renders into a shadow DOM attached to the host page. That gives APIPeek bulletproof CSS isolation: no site styles can leak in, none of APIPeek's styles can leak out, but it breaks every assumption React has about where to insert `<style>` tags.\n\nI leaned on WXT's `createShadowRootUi` with `cssInjectionMode: 'ui'`, which routes injected CSS into the shadow tree instead of `document.head`. The CSS itself had to be reworked: design tokens are scoped to `.apipeek-root`, **not** `:root`, because `:root` selectors don't match across the shadow boundary. IBM Plex Mono is base64-inlined into the stylesheet so the typography survives sites with strict CSP that would block external font fetches.\n\nThe result: the React UI looks identical on jsonplaceholder.typicode.com, on a Confluence page, and on a corporate intranet behind three layers of CSS resets.",
    },
    {
      title: "Bypassing CORS with a type-safe message bridge",
      body: "The \"Send\" button in the request sandbox needs to fire `fetch()` against arbitrary origins, which a content script can't do without preflight. The fix is to dispatch the request from the background service worker (which runs under `host_permissions: ['<all_urls>']`) and pipe the response back.\n\nRather than passing untyped strings, the bridge is a discriminated union. Both ends validate the `type` discriminant before processing, malformed messages are rejected silently, and the SW handler returns `true` only for messages it owns.  So the Chrome message bus doesn't dead-lock waiting for a response that never comes. Adding a new cross-realm operation means extending the union; TypeScript then forces every handler and caller to be updated.",
      code: "export type Message =\n  | { type: 'apipeek:fetch';  req: ApiRequest }\n  | { type: 'apipeek:schema'; json: unknown; target: SchemaTarget };",
    },
    {
      title: "Keeping a hibernating service worker warm",
      body: "MV3 service workers idle out after ~30 seconds of inactivity. The first request after they idle pays a 100–300 ms cold-start cost, invisible normally, but the request sandbox is exactly the moment a user expects \"Send\" to feel snappy.\n\nThe fix is a long-lived port. When the request drawer mounts, the content script opens a `chrome.runtime.connect({ name: 'apipeek:keepalive' })`. The SW listens for that named port and keeps itself alive as long as it's open. Chrome force-disconnects ports after 5 minutes, so the client reconnects every 4 minutes on a timer. The disconnect handler is intentionally empty; once the user closes the drawer, we *want* the SW to idle out and stop billing the user's battery.\n\nIt's a small piece of code (~30 LOC), but it required reading enough of the MV3 source notes to know that ports, not alarms or `setInterval`, are the supported keepalive mechanism.",
    },
    {
      title: "Lazy-loading 1.4 MB of quicktype-core out of the content bundle",
      body: "Schema generation (TypeScript / Zod / Go from a JSON sample) uses `quicktype-core`, which weighs ~1.4 MB minified. WXT bundles content scripts as a single file with no code-splitting. So naively importing quicktype would force every JSON page to download 1.4 MB before the viewer can render.\n\nInstead, schema generation is treated as a background-only operation. The content script sends `{ type: 'apipeek:schema', json, target }`; the SW does `await import('quicktype-core')` on first request, caches the module for its lifetime, and returns the generated source. The user pays a one-time ~200 ms hit on the first \"Generate types\" click, but the per-page bundle stays small enough to mount instantly.\n\nThis kind of bundle-shape decision is where MV3 architecture diverges hard from regular SPA work, and it only becomes obvious when you stare at the network panel of a slow JSON-heavy page.",
    },
    {
      title: "A search that doesn't collapse on large payloads",
      body: 'The viewer renders multi-megabyte responses. A naive "expand everything to show search matches" approach would freeze the tab. Instead, `findMatches()` walks the JSON once, returning both matched paths *and* the set of ancestor paths leading to each match. `react-json-tree`\'s `shouldExpandNodeInitially` then expands exactly those ancestors and nothing else, search highlights become visible without unfolding the unrelated 90% of the tree.\n\nThe same path-as-stable-key idea powers JSONPath filtering (`$..items[?(@.id)]` via `jsonpath-plus`), the breadcrumb strip, and per-node "Copy JSONPath", all backed by one canonical `pathToString()` helper. Getting that primitive right early meant the rest of the viewer fell out almost for free.',
    },
    {
      title: "State across three realms without a sync nightmare",
      body: 'Popup, content script, and background SW each run in isolated JS contexts. There is no shared Zustand store; each realm imports its own instance. Coordination happens on two narrow channels.\n\n`chrome.storage.local.onChanged` handles durable state (settings, env variables, request history). Writes from the popup propagate to every mounted content script as a callback fires.\n\n`chrome.runtime.sendMessage` handles one-shot RPCs (fetch, schema gen). The background acts as the canonical writer for history; content scripts never mutate the log directly.\n\nKeeping those channels narrow, and refusing to invent a third, is what stopped the architecture from sprawling into "every realm syncs everything to every other realm."',
    },
  ],
  designNotes:
    "I treated this as a design project as well as an engineering one. The aesthetic is OpenCode-inspired: IBM Plex Mono everywhere, warm near-black surfaces (`#1A1A19` on dark, off-white on light), Apple-HIG semantic colors (system blue for actions, system red for destructive), zero shadows, zero brightness filters, flat depth communicated through borders and tonal shifts.\n\nThe popup, command bar, request drawer, and viewer all share one token set. Theme switching (light / dark / system) syncs live across realms via the storage channel above.",
  learnings: [
    {
      lead: "MV3 is a different runtime, not just a stricter version of MV2.",
      body: "Code-splitting, persistence, port lifecycles, CSP, every assumption from regular web work needs re-examining.",
    },
    {
      lead: "Type-safe IPC is the cheapest investment in extension code.",
      body: "Once the message union exists, refactoring across realms becomes a TypeScript exercise instead of a debugging exercise.",
    },
    {
      lead: "Shadow DOM gives you isolation, but charges you in tooling.",
      body: "Most React component libraries assume `document.head` style injection; designing around that constraint shaped a lot of small decisions.",
    },
    {
      lead: "A small architecture document pays back fast.",
      body: 'An AGENT.md defining realm boundaries and a "when you change X, update Y" matrix was the single biggest reason the codebase stayed coherent over the build.',
    },
  ],
};
