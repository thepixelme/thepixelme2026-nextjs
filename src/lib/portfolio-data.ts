export interface Highlight {
  title: string;
  body: string;
  code?: string;
}

export interface Learning {
  lead: string;
  body: string;
}

export interface Project {
  id: string;
  title: string;
  tags: string[];
  summary: string;
  description: string;
  link?: string;
  image?: string;
  role?: string;
  stack?: string[];
  status?: string;
  period?: string;
  problem?: string;
  highlights?: Highlight[];
  designNotes?: string;
  learnings?: Learning[];
}

export interface ResumeEntry {
  kind: "job" | "education";
  org: string;
  role: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface Photo {
  src: string;
  alt: string;
  caption?: string;
}

export interface Social {
  label: string;
  href: string;
  brand: "github" | "x" | "dribbble" | "instagram";
}

export const ABOUT = {
  name: "Nhat Nguyen",
  handle: "thepixelme",
  title: "Bridging the Gap Between Business Vision and Technical Reality",
  location: "USA, Earth",
  email: "nhat@thepixelme.com",
  bio: "I am a Full-Stack Engineer and Product Strategist who builds with a commercial mindset. I specialize in architecting systems where technical decisions drive business growth, transforming abstract requirements into robust, high-performance digital ecosystems.",
  skills: [
    {
      category: "Core Tech",
      items: [
        "JavaScript",
        "TypeScript",
        "React",
        "React Native",
        "Node.js",
        "PostgreSQL",
      ],
    },
    {
      category: "Cloud & Scaling",
      items: ["AWS/DevOps", "CI/CD Pipeline", "System Architecture"],
    },
    {
      category: "Business & Product",
      items: [
        "Product Strategy & Roadmapping",
        "Agile Leadership",
        "User-Centric Design",
      ],
    },
  ],
};

export const SOCIALS: Social[] = [
  { label: "GitHub", href: "https://github.com/thepixelme", brand: "github" },
  { label: "X", href: "https://x.com/thepixelme", brand: "x" },
  {
    label: "Dribbble",
    href: "https://dribbble.com/thepixelme",
    brand: "dribbble",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/thepixelme",
    brand: "instagram",
  },
];

export const PROJECTS: Project[] = [
  {
    id: "apipeek",
    title: "APIPeek — JSON viewer & API sandbox",
    tags: ["Browser extension", "TypeScript", "React"],
    summary:
      "A Chrome / Firefox extension that turns the browser's built-in JSON viewer into a developer-friendly API sandbox — collapsible tree, search, JSONPath filter, schema generation, and a request panel that lets you change method, headers and body and re-fire the call without ever leaving the tab.",
    description:
      "Most of the engineering went into making MV3's constraints — isolated content scripts, hibernating service workers, no `eval`, single-file bundles, hostile host CSS — invisible to the user.",
    role: "Sole engineer and designer",
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
    period: "Late 2025 — early 2026",
    status: "v0.0.1, prepared for Chrome Web Store submission",
    problem:
      "Looking at a JSON response in a browser tab is a dead end. You eyeball it, then you copy-paste it into Postman to re-fire the request, into `jq` to filter, into quicktype.io to generate types, into VS Code to format. APIPeek collapses all of those round-trips into the page where the response already lives.\n\nThe interesting part isn't the feature list — it's that delivering this on top of an MV3 extension means living inside an unforgiving runtime: isolated content scripts, hibernating service workers, no `eval`, single-file content bundles, and a hostile CSS environment that belongs to whatever site you happen to be on. Most of the engineering went into making those constraints invisible to the user.",
    highlights: [
      {
        title:
          "Mounting React inside a shadow root, on a page that isn't yours",
        body: "The viewer renders into a shadow DOM attached to the host page. That gives APIPeek bulletproof CSS isolation — no site styles can leak in, none of APIPeek's styles can leak out — but it breaks every assumption React has about where to insert `<style>` tags.\n\nI leaned on WXT's `createShadowRootUi` with `cssInjectionMode: 'ui'`, which routes injected CSS into the shadow tree instead of `document.head`. The CSS itself had to be reworked: design tokens are scoped to `.apipeek-root`, **not** `:root`, because `:root` selectors don't match across the shadow boundary. IBM Plex Mono is base64-inlined into the stylesheet so the typography survives sites with strict CSP that would block external font fetches.\n\nThe result: the React UI looks identical on jsonplaceholder.typicode.com, on a Confluence page, and on a corporate intranet behind three layers of CSS resets.",
      },
      {
        title: "Bypassing CORS with a type-safe message bridge",
        body: "The \"Send\" button in the request sandbox needs to fire `fetch()` against arbitrary origins — which a content script can't do without preflight. The fix is to dispatch the request from the background service worker (which runs under `host_permissions: ['<all_urls>']`) and pipe the response back.\n\nRather than passing untyped strings, the bridge is a discriminated union. Both ends validate the `type` discriminant before processing, malformed messages are rejected silently, and the SW handler returns `true` only for messages it owns — so the Chrome message bus doesn't dead-lock waiting for a response that never comes. Adding a new cross-realm operation means extending the union; TypeScript then forces every handler and caller to be updated.",
        code: "export type Message =\n  | { type: 'apipeek:fetch';  req: ApiRequest }\n  | { type: 'apipeek:schema'; json: unknown; target: SchemaTarget };",
      },
      {
        title: "Keeping a hibernating service worker warm",
        body: "MV3 service workers idle out after ~30 seconds of inactivity. The first request after they idle pays a 100–300 ms cold-start cost — invisible normally, but the request sandbox is exactly the moment a user expects \"Send\" to feel snappy.\n\nThe fix is a long-lived port. When the request drawer mounts, the content script opens a `chrome.runtime.connect({ name: 'apipeek:keepalive' })`. The SW listens for that named port and keeps itself alive as long as it's open. Chrome force-disconnects ports after 5 minutes, so the client reconnects every 4 minutes on a timer. The disconnect handler is intentionally empty — once the user closes the drawer, we *want* the SW to idle out and stop billing the user's battery.\n\nIt's a small piece of code (~30 LOC), but it required reading enough of the MV3 source notes to know that ports — not alarms or `setInterval` — are the supported keepalive mechanism.",
      },
      {
        title:
          "Lazy-loading 1.4 MB of quicktype-core out of the content bundle",
        body: "Schema generation (TypeScript / Zod / Go from a JSON sample) uses `quicktype-core`, which weighs ~1.4 MB minified. WXT bundles content scripts as a single file with no code-splitting — so naively importing quicktype would force every JSON page to download 1.4 MB before the viewer can render.\n\nInstead, schema generation is treated as a background-only operation. The content script sends `{ type: 'apipeek:schema', json, target }`; the SW does `await import('quicktype-core')` on first request, caches the module for its lifetime, and returns the generated source. The user pays a one-time ~200 ms hit on the first \"Generate types\" click, but the per-page bundle stays small enough to mount instantly.\n\nThis kind of bundle-shape decision is where MV3 architecture diverges hard from regular SPA work — and it only becomes obvious when you stare at the network panel of a slow JSON-heavy page.",
      },
      {
        title: "A search that doesn't collapse on large payloads",
        body: 'The viewer renders multi-megabyte responses. A naive "expand everything to show search matches" approach would freeze the tab. Instead, `findMatches()` walks the JSON once, returning both matched paths *and* the set of ancestor paths leading to each match. `react-json-tree`\'s `shouldExpandNodeInitially` then expands exactly those ancestors and nothing else — search highlights become visible without unfolding the unrelated 90% of the tree.\n\nThe same path-as-stable-key idea powers JSONPath filtering (`$..items[?(@.id)]` via `jsonpath-plus`), the breadcrumb strip, and per-node "Copy JSONPath" — all backed by one canonical `pathToString()` helper. Getting that primitive right early meant the rest of the viewer fell out almost for free.',
      },
      {
        title: "State across three realms without a sync nightmare",
        body: 'Popup, content script, and background SW each run in isolated JS contexts. There is no shared Zustand store — each realm imports its own instance. Coordination happens on two narrow channels.\n\n`chrome.storage.local.onChanged` handles durable state (settings, env variables, request history). Writes from the popup propagate to every mounted content script as a callback fires.\n\n`chrome.runtime.sendMessage` handles one-shot RPCs (fetch, schema gen). The background acts as the canonical writer for history — content scripts never mutate the log directly.\n\nKeeping those channels narrow — and refusing to invent a third — is what stopped the architecture from sprawling into "every realm syncs everything to every other realm."',
      },
    ],
    designNotes:
      "I treated this as a design project as well as an engineering one. The aesthetic is OpenCode-inspired: IBM Plex Mono everywhere, warm near-black surfaces (`#1A1A19` on dark, off-white on light), Apple-HIG semantic colors (system blue for actions, system red for destructive), zero shadows, zero brightness filters, flat depth communicated through borders and tonal shifts.\n\nThe popup, command bar, request drawer, and viewer all share one token set. Theme switching (light / dark / system) syncs live across realms via the storage channel above.",
    learnings: [
      {
        lead: "MV3 is a different runtime, not just a stricter version of MV2.",
        body: "Code-splitting, persistence, port lifecycles, CSP — every assumption from regular web work needs re-examining.",
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
  },
  {
    id: "atlas",
    title: "Atlas — design system",
    tags: ["Design system", "React", "TypeScript"],
    summary: "120-component design system shipped across 4 product surfaces.",
    description:
      "Atlas is a design system used by four product teams. It shipped 120 React components, a token pipeline, and a Figma library. Reduced PR review time by 38%.",
    link: "https://example.com/atlas",
  },
  {
    id: "harbor",
    title: "Harbor — finance dashboard",
    tags: ["Product design", "Data viz"],
    summary: "Real-time analytics for a fintech with 200k MAU.",
    description:
      "Designed and built the dashboard surface, including 14 chart types, real-time websocket updates, and an opinionated empty-state system.",
  },
  {
    id: "fern",
    title: "Fern — note taking",
    tags: ["Product design", "Native"],
    summary: "Calm, plaintext-first note-taking app for macOS.",
    description:
      "A side project. Markdown-first, fully keyboard-driven, with a custom outline view. Shipped to 8k users.",
  },
  {
    id: "ortus",
    title: "Ortus — booking flow",
    tags: ["Conversion", "Front-end"],
    summary: "Rebuilt a hotel chain's booking flow; +18% conversion.",
    description:
      "End-to-end redesign of a 7-step booking flow into 3 steps. Built with Next.js + Tailwind. Conversion lifted 18%, abandon rate dropped 22%.",
  },
  {
    id: "voya",
    title: "Voya — travel guide",
    tags: ["Editorial", "CMS"],
    summary: "Editorial travel site with a custom CMS.",
    description:
      "Mobile-first long-form articles with custom map embeds. Sanity-powered CMS for the editorial team.",
  },
  {
    id: "circuit",
    title: "Circuit — runner watch face",
    tags: ["Wearable", "Motion"],
    summary: "Watch face for Wear OS runners. 200k installs.",
    description:
      "A minimal, glanceable watch face designed for running outdoors. Optimized for daylight legibility.",
  },
];

export const RESUME: ResumeEntry[] = [
  {
    kind: "job",
    org: "ThePixelMe Studio",
    role: "Founder, Design & Engineering",
    start: "2022",
    end: "Present",
    bullets: [
      "Lead design and front-end engineering for 8+ shipped products.",
      "Built a reusable design-system pipeline used across all client work.",
      "Speaker at three regional design conferences on motion in product UI.",
    ],
  },
  {
    kind: "job",
    org: "Acme Co.",
    role: "Senior Product Designer",
    start: "2019",
    end: "2022",
    bullets: [
      "Owned the design language for the flagship B2B product (1.2M MAU).",
      "Partnered with engineering on a tokens-first rebuild that cut UI bugs ~40%.",
    ],
  },
  {
    kind: "education",
    org: "Queensland University of Technology",
    role: "BFA, Interactive & Visual Design",
    start: "2014",
    end: "2017",
    bullets: [
      "First-class honours. Capstone in motion design for accessibility.",
    ],
  },
];

export const PHOTOS: Photo[] = [
  {
    src: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200",
    alt: "Soft gradient sky",
    caption: "Atlas brand visual",
  },
  {
    src: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200",
    alt: "Geometric abstract",
    caption: "Harbor pitch deck",
  },
  {
    src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200",
    alt: "Coastline aerial",
    caption: "Voya editorial",
  },
  {
    src: "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=1200",
    alt: "Desk overhead",
    caption: "Studio life",
  },
  {
    src: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200",
    alt: "Neon lights",
    caption: "Circuit launch",
  },
  {
    src: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=1200",
    alt: "Pastel geometry",
    caption: "Fern marketing site",
  },
];
