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
    "A browser extension that turns raw JSON responses into a usable workspace: tree view, search, JSONPath filtering, schema export, and quick request retries from the same tab.",
  description:
    "I built APIPeek because checking an API response in the browser should not immediately turn into a chain of copy-paste chores.",
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
    "The browser is usually the first place I see an API response, but it is a bad place to work with one. If I want to retry the request, filter a nested value, or turn the payload into types, I have to move the same JSON through three or four other tools. APIPeek keeps those small jobs next to the response.",
  highlights: [
    {
      title: "Mounting React inside a shadow root, on a page that isn't yours",
      body: "The viewer runs inside a shadow DOM so the host page cannot style it, and it cannot style the host page. The tricky part was getting the extension's own CSS, design tokens, and font to live inside that boundary too. WXT's shadow-root UI helpers handled the style injection; the rest came down to scoping tokens to `.apipeek-root` and inlining IBM Plex Mono for CSP-heavy pages.",
    },
    {
      title: "Bypassing CORS with a type-safe message bridge",
      body: "The request drawer can resend calls to arbitrary origins, which a content script cannot do reliably. APIPeek sends those requests through the MV3 service worker instead. I kept the bridge small and typed, so each message has a known shape and the service worker only answers the messages it owns.",
      code: "export type Message =\n  | { type: 'apipeek:fetch';  req: ApiRequest }\n  | { type: 'apipeek:schema'; json: unknown; target: SchemaTarget };",
    },
    {
      title: "Keeping a hibernating service worker warm",
      body: "MV3 lets service workers go idle quickly. That is good for the browser, but annoying when a user clicks `Send` and waits through a cold start. When the request drawer opens, APIPeek keeps a runtime port alive and refreshes it before Chrome closes it. When the drawer closes, the worker is free to sleep again.",
    },
    {
      title: "Lazy-loading 1.4 MB of quicktype-core out of the content bundle",
      body: "`quicktype-core` is too large to ship in the content script. I moved schema generation to the service worker and load the package only when someone asks for types. Normal JSON pages stay fast; the heavier code is paid for once, at the moment it is needed.",
    },
  ],
  designNotes:
    "The UI is intentionally quiet: mono type, compact controls, clear borders, and light/dark themes that follow the user's preference. The popup, command bar, request drawer, and viewer all share the same token set, with theme state synced through `chrome.storage`.",
  learnings: [
    {
      lead: "MV3 changes the shape of the app.",
      body: "Bundle size, worker lifetime, permissions, and CSP all affect product decisions, not just implementation details.",
    },
    {
      lead: "Typed extension messaging pays for itself quickly.",
      body: "Once the content script and service worker share a message union, refactors become much less fragile.",
    },
    {
      lead: "Shadow DOM is helpful, but never free.",
      body: "The isolation is worth it, as long as styles, fonts, and theme tokens are designed for that boundary from the start.",
    },
  ],
};
