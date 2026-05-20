# Data

Static portfolio content is split across two locations:

- **[src/lib/portfolio-data.ts](../src/lib/portfolio-data.ts)** — `ABOUT`, `SOCIALS` and their interfaces.
- **[src/lib/projects/](../src/lib/projects/)** — one file per project (`apipeek.ts`, etc.), the `Project` / `Highlight` / `Learning` types in [types.ts](../src/lib/projects/types.ts), and an [index.ts](../src/lib/projects/index.ts) that aggregates the per-project exports into `PROJECTS: Project[]`.

Apps import directly from these — there is no API layer, no CMS, no fetch.

## Types

### `Project` ([src/lib/projects/types.ts](../src/lib/projects/types.ts))

```ts
interface Highlight {
  title: string;
  body: string;       // supports \n\n for paragraphs and inline `code` / **bold** / *em*
  code?: string;      // optional code snippet rendered as a mono block
}

interface Learning {
  lead: string;       // bolded headline of the takeaway
  body: string;       // explanation; same inline-formatting support as Highlight.body
}

interface Screenshot {
  src: string;        // path under /public, e.g. "/apipeek/screenshot-1.jpg"
  alt: string;        // descriptive alt text; also used as the lightbox aria-label
}

interface Project {
  id: string;
  title: string;
  tags: string[];
  summary: string;        // one-liner; shown on grid card and as the tagline in detail
  description: string;    // 1–2 sentences; lede paragraph in detail view
  link?: string;          // primary CTA href (live demo / install / canonical URL)
  linkLabel?: string;     // primary CTA label; defaults to "Visit project"
  source?: string;        // optional source-code URL; renders a "View source" button next to the primary CTA
  logo?: Screenshot;      // optional brand icon; rendered as the Finder card thumbnail (preferred over screenshots[0]) and as a 64px chip to the left of the title in ProjectDetail
  screenshots?: Screenshot[]; // index 0 becomes the hero; full set rendered as a gallery section in ProjectDetail with click-to-lightbox

  // Optional case-study fields. Render only when present; light projects
  // can omit them and fall back to the title + description layout.
  role?: string;          // e.g. "Sole engineer and designer"
  stack?: string[];       // tech list rendered as mono pills in the meta strip
  status?: string;        // e.g. "v0.0.1, prepared for Chrome Web Store submission"
  orientation?: "landscape" | "portrait"; // default "landscape"; "portrait" switches FinderApp card to object-contain and PreviewApp/CaseStudy slots to aspect-9/19 with a 3-col gallery
  problem?: string;       // long prose; supports \n\n + inline formatting
  highlights?: Highlight[];
  designNotes?: string;   // long prose
  learnings?: Learning[]; // bullet list with bold leads
}
```

Used by: [FinderApp](../src/components/apps/FinderApp.tsx) (grid card uses `id`, `title`, `summary`, `tags`, and `screenshots[0]` as the thumbnail when present, otherwise a gradient-with-initial fallback) and [ProjectDetail](../src/components/apps/ProjectDetail.tsx) (case-study layout — renders any optional fields that are present, including `screenshots` as the hero image plus a gallery section with a shared lightbox). [TerminalApp](../src/components/apps/TerminalApp.tsx) reads `id` and `title` for `ls projects`.

### `Social`

```ts
interface Social {
  label: string;
  href: string;
  brand: "github";
}
```

Used by: [AboutApp](../src/components/apps/AboutApp.tsx) and the `BRANDS` map there. The `brand` literal union must match the keys of `BRANDS`. Adding a brand requires three coordinated edits:

1. Add the literal to `Social["brand"]`.
2. Add a matching `simple-icons` import + entry in `BRANDS` in [AboutApp.tsx](../src/components/apps/AboutApp.tsx).
3. Add the entry to `SOCIALS`.

## `ABOUT`

A plain object (not an interface'd type) with the operator's identity:

| Field      | Type       | Current value                                                                                  |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `name`     | `string`   | `"Nhat Nguyen"`                                                                                |
| `handle`   | `string`   | `"thepixelme"`                                                                                 |
| `title`    | `string`   | `"Designer & Front-end Engineer"`                                                              |
| `location` | `string`   | `"Brisbane, Australia"`                                                                        |
| `email`    | `string`   | `"nhat@thepixelme.com"`                                                                        |
| `bio`      | `string`   | `"I design and build interfaces that feel as good as they look. I obsess over typography, motion, and the small details — the kind of stuff most people never notice but everyone feels."` |
| `skills`   | `{ category: string; items: string[] }[]` | 3 groups, 11 entries total: **Core Tech** (TypeScript, React/Next.js, Node.js, PostgreSQL), **Cloud & Scaling** (AWS/DevOps, System Architecture, Scalable Infrastructure), **Business & Product** (Product Strategy, Technical ROI Analysis, Agile Leadership, User-Centric Design) |

Read by: [AboutApp](../src/components/apps/AboutApp.tsx) (full object), [ContactApp](../src/components/apps/ContactApp.tsx) (email), [TerminalApp](../src/components/apps/TerminalApp.tsx) (handle, title, bio).

## `SOCIALS: Social[]`

| `brand`  | `label`  | `href`                          |
| -------- | -------- | ------------------------------- |
| `github` | `GitHub` | `https://github.com/thepixelme` |

Order matters — it determines the rendered order in About → Find me.

## `PROJECTS: Project[]` ([src/lib/projects/index.ts](../src/lib/projects/index.ts))

| `id`                | file                                                             | `title`                                                         | `tags`                                                           | rich case-study?              |
| ------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------- |
| `claudeswitcher`    | [claudeswitcher.ts](../src/lib/projects/claudeswitcher.ts)       | ClaudeSwitcher                                                  | macOS · Swift · SwiftUI · Menu-bar app                           | yes (full + logo + 2 shots)   |
| `bonneville-mobile` | [bonneville-mobile.ts](../src/lib/projects/bonneville-mobile.ts) | Bonneville News & Sports Mobile                                 | Mobile · React Native · TypeScript · Expo · Native modules       | yes (full + 9 portrait shots) |
| `heygrillhey`       | [heygrillhey.ts](../src/lib/projects/heygrillhey.ts)             | Hey Grill Hey — Recipe and commerce rebuild                         | Web · Headless WordPress · Gatsby · Shopify · TypeScript         | yes (full + 6 shots)          |
| `apipeek`           | [apipeek.ts](../src/lib/projects/apipeek.ts)                     | APIPeek — JSON viewer & API sandbox                             | Browser extension · TypeScript · React                           | yes (full + 4 shots)          |

Each project lives in its own file under [src/lib/projects/](../src/lib/projects/) so that long-form copy doesn't crowd one giant module. [index.ts](../src/lib/projects/index.ts) imports each project file and exports `PROJECTS: Project[]` in the order they should appear in the Finder grid.

To add a new project: create `src/lib/projects/<id>.ts` with `export const <id>: Project = { ... }`, then add the import and array entry in `index.ts`.

[FinderApp](../src/components/apps/FinderApp.tsx) derives its sidebar `Tags` filter by uniquing across `PROJECTS`. Adding/removing entries rebuilds the sidebar automatically.

## Notes for editing

- No async/server side; changes appear at the next dev-server hot reload.
- Consumers import via named exports — `ABOUT`, `SOCIALS` from `@/lib/portfolio-data`; `PROJECTS` and the project types from `@/lib/projects`. Renaming a constant requires updating every consumer; TypeScript will surface them.
- There are no environment-specific overrides (no dev/prod data switch).
