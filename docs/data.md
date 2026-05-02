# Data

All static portfolio content lives in [src/lib/portfolio-data.ts](../src/lib/portfolio-data.ts). The file exports four typed constants and four interfaces. Apps import directly — there is no API layer, no CMS, no fetch.

## Types

### `Project`

```ts
interface Project {
  id: string;
  title: string;
  tags: string[];
  summary: string;
  description: string;
  link?: string;
  image?: string;     // declared but not read by any current app
}
```

Used by: [FinderApp](../src/components/apps/FinderApp.tsx) (grid + detail view) and [TerminalApp](../src/components/apps/TerminalApp.tsx) (`ls projects`).

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

## `PROJECTS: Project[]`

Seven entries, ordered as shown:

| `id`      | `title`                              | `tags`                                | `link`                  |
| --------- | ------------------------------------ | ------------------------------------- | ----------------------- |
| `apipeek` | APIPeek — JSON viewer & API sandbox  | Browser extension · TypeScript · React | —                      |
| `atlas`   | Atlas — design system                | Design system · React · TypeScript    | `https://example.com/atlas` |
| `harbor`  | Harbor — finance dashboard           | Product design · Data viz             | —                       |
| `fern`    | Fern — note taking                   | Product design · Native               | —                       |
| `ortus`   | Ortus — booking flow                 | Conversion · Front-end                | —                       |
| `voya`    | Voya — travel guide                  | Editorial · CMS                       | —                       |
| `circuit` | Circuit — runner watch face          | Wearable · Motion                     | —                       |

Each has a `summary` (1 sentence, shown in cards) and `description` (1–2 sentences, shown in detail view).

[FinderApp](../src/components/apps/FinderApp.tsx) derives its sidebar `Tags` filter by uniquing across this array. Adding/removing entries rebuilds the sidebar automatically.

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

- The file has no async/server side; changes appear at the next dev-server hot reload.
- All consumers import via the named export pattern (`import { ABOUT, PROJECTS } from "@/lib/portfolio-data"`). Renaming a constant requires updating every consumer; TypeScript will surface them.
- There are no environment-specific overrides (no dev/prod data switch).
