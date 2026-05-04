# Data

Static portfolio content is split across two locations:

- **[src/lib/portfolio-data.ts](../src/lib/portfolio-data.ts)** — `ABOUT`, `SOCIALS`, `RESUME`, `PHOTOS` and their interfaces.
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

interface Project {
  id: string;
  title: string;
  tags: string[];
  summary: string;        // one-liner; shown on grid card and as the tagline in detail
  description: string;    // 1–2 sentences; lede paragraph in detail view
  link?: string;          // primary CTA href (live demo / install / canonical URL)
  linkLabel?: string;     // primary CTA label; defaults to "Visit project"
  source?: string;        // optional source-code URL; renders a "View source" button next to the primary CTA
  image?: string;         // declared but not read by any current app

  // Optional case-study fields. Render only when present; light projects
  // can omit them and fall back to the title + description layout.
  role?: string;          // e.g. "Sole engineer and designer"
  stack?: string[];       // tech list rendered as mono pills in the meta strip
  status?: string;        // e.g. "v0.0.1, prepared for Chrome Web Store submission"
  problem?: string;       // long prose; supports \n\n + inline formatting
  highlights?: Highlight[];
  designNotes?: string;   // long prose
  learnings?: Learning[]; // bullet list with bold leads
}
```

Used by: [FinderApp](../src/components/apps/FinderApp.tsx) (grid card uses only `id`, `title`, `summary`, `tags`) and [ProjectDetail](../src/components/apps/ProjectDetail.tsx) (case-study layout — renders any optional fields that are present). [TerminalApp](../src/components/apps/TerminalApp.tsx) reads `id` and `title` for `ls projects`.

### `ResumeEntry`

```ts
interface ResumeEntry {
  kind: "job" | "education";
  org: string;
  role: string;
  start: string;     // free-form, e.g. "2022", "Jan 2022"
  end: string;       // free-form, e.g. "Present", "2017"
  bullets: string[];
}
```

Used by: [ResumeApp](../src/components/apps/ResumeApp.tsx). The component partitions on `kind` to render two sections (Experience / Education).

### `Photo`

```ts
interface Photo {
  src: string;
  alt: string;
  caption?: string;
}
```

Used by: [PhotosApp](../src/components/apps/PhotosApp.tsx). The grid uses `alt` for accessibility and shows `caption` on hover and in the lightbox footer.

### `Social`

```ts
interface Social {
  label: string;
  href: string;
  brand: "github" | "x" | "dribbble" | "instagram";
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

Read by: [AboutApp](../src/components/apps/AboutApp.tsx) (full object), [ResumeApp](../src/components/apps/ResumeApp.tsx) (name, title, location, email), [ContactApp](../src/components/apps/ContactApp.tsx) (email), [TerminalApp](../src/components/apps/TerminalApp.tsx) (handle, title, bio).

## `SOCIALS: Social[]`

| `brand`     | `label`     | `href`                              |
| ----------- | ----------- | ----------------------------------- |
| `github`    | `GitHub`    | `https://github.com/thepixelme`     |
| `x`         | `X`         | `https://x.com/thepixelme`          |
| `dribbble`  | `Dribbble`  | `https://dribbble.com/thepixelme`   |
| `instagram` | `Instagram` | `https://instagram.com/thepixelme`  |

Order matters — it determines the rendered order in About → Find me.

## `PROJECTS: Project[]` ([src/lib/projects/index.ts](../src/lib/projects/index.ts))

| `id`      | file                                                       | `title`                              | `tags`                                 | rich case-study? |
| --------- | ---------------------------------------------------------- | ------------------------------------ | -------------------------------------- | ---------------- |
| `apipeek` | [apipeek.ts](../src/lib/projects/apipeek.ts)               | APIPeek — JSON viewer & API sandbox  | Browser extension · TypeScript · React | yes (full)       |

Each project lives in its own file under [src/lib/projects/](../src/lib/projects/) so that long-form copy doesn't crowd one giant module. [index.ts](../src/lib/projects/index.ts) imports each project file and exports `PROJECTS: Project[]` in the order they should appear in the Finder grid.

To add a new project: create `src/lib/projects/<id>.ts` with `export const <id>: Project = { ... }`, then add the import and array entry in `index.ts`.

[FinderApp](../src/components/apps/FinderApp.tsx) derives its sidebar `Tags` filter by uniquing across `PROJECTS`. Adding/removing entries rebuilds the sidebar automatically.

## `RESUME: ResumeEntry[]`

Three entries, ordered as shown:

| `kind`      | `org`                                | `role`                            | `start` | `end`     | `bullets` |
| ----------- | ------------------------------------ | --------------------------------- | ------- | --------- | --------- |
| `job`       | ThePixelMe Studio                    | Founder, Design & Engineering     | `2022`  | `Present` | 3         |
| `job`       | Acme Co.                             | Senior Product Designer           | `2019`  | `2022`    | 2         |
| `education` | Queensland University of Technology  | BFA, Interactive & Visual Design  | `2014`  | `2017`    | 1         |

`ResumeApp` partitions by `kind` and renders Experience first, Education second.

## `PHOTOS: Photo[]`

Six entries pointing at Unsplash CDN URLs (`?w=1200`):

| Index | `alt`                | `caption`              |
| ----- | -------------------- | ---------------------- |
| 0     | Soft gradient sky    | Atlas brand visual     |
| 1     | Geometric abstract   | Harbor pitch deck      |
| 2     | Coastline aerial     | Voya editorial         |
| 3     | Desk overhead        | Studio life            |
| 4     | Neon lights          | Circuit launch         |
| 5     | Pastel geometry      | Fern marketing site    |

Captions are paired by content with `PROJECTS` entries but the linkage is implicit (string match) — there is no relational join.

## Notes for editing

- No async/server side; changes appear at the next dev-server hot reload.
- Consumers import via named exports — `ABOUT`, `SOCIALS`, `RESUME`, `PHOTOS` from `@/lib/portfolio-data`; `PROJECTS` and the project types from `@/lib/projects`. Renaming a constant requires updating every consumer; TypeScript will surface them.
- There are no environment-specific overrides (no dev/prod data switch).
