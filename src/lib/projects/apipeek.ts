import type { Project } from "./types";

export const apipeek: Project = {
  id: "apipeek",
  title: "APIPeek — JSON viewer & API sandbox",
  tags: ["Browser extension", "TypeScript", "React"],
  link: "https://chromewebstore.google.com/detail/apipeek/kpndkgphbnjghmaonfhhcmlnamlaegee",
  linkLabel: "Install on Chrome Web Store",
  source: "https://github.com/thepixelme/apipeek",
  screenshots: [
    {
      src: "/apipeek/screenshot-0.jpg",
      alt: "APIPeek's tabular Preview mode rendering a 10-row JSON array as a spreadsheet-style grid in dark theme",
    },
    {
      src: "/apipeek/screenshot-1.jpg",
      alt: "The collapsible JSON tree viewer in light theme with the Request drawer open on the right, showing method, URL, headers, and body",
    },
    {
      src: "/apipeek/screenshot-2.jpg",
      alt: "The JSON tree viewer in light theme showing nested keys and values for an array response",
    },
    {
      src: "/apipeek/screenshot-3.jpg",
      alt: "The APIPeek extension popup over a JSON page, showing Settings tab with theme picker (System / Light / Dark) and Force-enable URLs list",
    },
  ],
  summary:
    "A Chrome / Firefox extension that turns the browser's built-in JSON viewer into a developer-friendly API sandbox: collapsible tree, search, JSONPath filter, schema generation, and a request panel that lets you change method, headers and body and re-fire the call without ever leaving the tab.",
  description:
    "Built solo, end to end. The interesting work isn't the feature list; it's making it all run inside MV3's runtime without the user feeling any of the seams.",
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
    "Looking at a JSON response in a browser tab is a dead end. You eyeball it, then you copy-paste it into Postman to re-fire the request, into `jq` to filter, into quicktype.io to generate types, into VS Code to format. APIPeek collapses all of those round-trips into the page where the response already lives.",
  highlights: [
    {
      title: "Mounting React inside a shadow root, on a page that isn't yours",
      body: "The viewer mounts into a shadow DOM on the host page. CSS isolation works both ways: site styles can't leak in, APIPeek's can't leak out.  But React's default `<style>` injection breaks across the shadow boundary.\n\nWXT's `createShadowRootUi` with `cssInjectionMode: 'ui'` routes styles into the shadow tree. Design tokens scope to `.apipeek-root`, **not** `:root` (selectors don't cross the boundary), and IBM Plex Mono is base64-inlined so typography survives sites with strict CSP.",
    },
    {
      title: "Bypassing CORS with a type-safe message bridge",
      body: "The `Send` button needs to fetch against arbitrary origins, which a content script can't do without CORS preflight. The request dispatches from the service worker (`host_permissions: ['<all_urls>']`) and pipes back.\n\nThe bridge is a discriminated union, not stringly-typed JSON. Both ends validate the `type` discriminant; the SW handler returns `true` only for messages it owns, so the Chrome message bus never dead-locks waiting on a response that never comes.",
      code: "export type Message =\n  | { type: 'apipeek:fetch';  req: ApiRequest }\n  | { type: 'apipeek:schema'; json: unknown; target: SchemaTarget };",
    },
    {
      title: "Keeping a hibernating service worker warm",
      body: "MV3 service workers idle out after ~30s. The first call after that pays a 100–300 ms cold-start, which is fine usually, but brutal on the `Send` button.\n\nThe fix is a long-lived port. When the request drawer mounts, the content script opens `chrome.runtime.connect({ name: 'apipeek:keepalive' })`. The SW stays alive while the port is open. Chrome force-disconnects ports at 5 minutes, so the client reconnects every 4. When the drawer closes, we let the SW idle out: keepalive shouldn't outlive intent.",
    },
    {
      title: "Lazy-loading 1.4 MB of quicktype-core out of the content bundle",
      body: "`quicktype-core` weighs ~1.4 MB minified, and WXT bundles content scripts as a single file, no code-splitting. Importing it directly would force every JSON page to pull 1.4 MB before the viewer mounts.\n\nSchema generation is a background-only operation. The content script sends `{ type: 'apipeek:schema', json, target }`; the SW runs `await import('quicktype-core')` on first request and caches the module. Users pay a one-time ~200 ms cost on first generate; the per-page bundle stays small enough to mount instantly.",
    },
  ],
  designNotes:
    "OpenCode-inspired aesthetic: IBM Plex Mono everywhere, warm near-black surfaces (`#1A1A19` dark, off-white light), Apple-HIG semantic colors (system blue for actions, system red for destructive). No shadows, no brightness filters, depth comes from borders and tonal shifts.\n\nPopup, command bar, request drawer, and viewer share one token set. Light / dark / system syncs live across realms via `chrome.storage`.",
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
  ],
};
