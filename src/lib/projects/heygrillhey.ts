import type { Project } from "./types";

export const heygrillhey: Project = {
  id: "heygrillhey",
  title: "Hey Grill Hey — Headless WordPress + Shopify recipe & commerce site",
  tags: ["Web", "Headless WordPress", "Next.js", "Shopify", "TypeScript"],
  link: "https://heygrillhey.com",
  linkLabel: "Visit heygrillhey.com",
  screenshots: [
    {
      src: "/heygrillhey/screenshot-0.png",
      alt: "Hey Grill Hey desktop homepage hero featuring the Backyard BBQ Hero cookbook promotion with pitmaster Susie Bulloch, navigation across Recipes, How To, Store, Product Reviews, and Grill Squad, and a featured-recipes grid below",
    },
    {
      src: "/heygrillhey/screenshot-3.png",
      alt: "Desktop Shopify product page for the Wing Night Smoked & Fried Wing Kit, served under the same heygrillhey.com domain with the WordPress site's navigation, breadcrumbs, gallery, price, and Best Seller badge",
    },
    {
      src: "/heygrillhey/screenshot-1.png",
      alt: "Desktop recipe page for Maple Bourbon Glaze showing the structured recipe card (rating, prep/cook times, servings, email opt-in, ingredient checkboxes) rendered by the custom Recipe plugin, with a Mattress Firm display ad in the right rail",
    },
    {
      src: "/heygrillhey/screenshot-4.png",
      alt: "Mobile homepage on a phone viewport with the same Backyard BBQ Hero hero, a hamburger menu, the Grilled Avocado featured recipe card, and a sticky in-content CLIF banner ad",
    },
    {
      src: "/heygrillhey/screenshot-6.png",
      alt: "Mobile Shopify product page for the Backyard BBQ Hero cookbook with the cover image gallery, price, and Add-to-cart flow inside the WordPress-themed mobile shell",
    },
    {
      src: "/heygrillhey/screenshot-5.png",
      alt: "Mobile recipe page for Bacon Wrapped Armadillo Eggs showing the recipe header, star rating, author byline, Jump to Recipe and Rate Recipe pills, and a 5-star rating",
    },
  ],
  summary:
    "A headless WordPress + Shopify rebuild of heygrillhey.com — pitmaster Susie Bulloch's recipe and commerce site — tuned for blazing first-paint, high ad viewability, and a fully responsive experience across desktop and mobile.",
  description:
    "I worked on the front-end as part of the team that rebuilt heygrillhey.com on a Next.js client backed by WordPress for content and Shopify for storefront, with a custom WordPress Recipe plugin powering the structured ingredient and instruction layouts.",
  role: "Front-end developer, on a small team",
  stack: [
    "Next.js",
    "TypeScript",
    "Headless WordPress",
    "WPGraphQL",
    "Shopify Storefront API",
    "Custom Recipe plugin (PHP)",
    "Tailwind CSS",
    "Vercel",
  ],
  status: "Live in production at heygrillhey.com",
  problem:
    "The legacy site was a traditional WordPress theme carrying a heavy recipe site, a Shopify storefront on a separate subdomain, and an ad stack that hurt both Core Web Vitals and viewability. The rebuild had to keep all of that — recipes, commerce, ads — on one fast, responsive front-end without giving editors a new CMS to learn.",
  highlights: [
    {
      title: "Headless WordPress architecture",
      body: "WordPress stays as the editorial CMS where Susie's team already writes; Next.js consumes content over WPGraphQL and renders every page statically or at the edge. Editors keep their familiar workflow, while the public site is fully decoupled from PHP at request time.",
    },
    {
      title: "Shopify storefront on the same domain",
      body: "The Shopify product catalog is pulled through the Storefront API and rendered inside the Next.js app, so /store and product pages live under heygrillhey.com with the same header, footer, and styling as the rest of the site — no jarring jump to a separate subdomain.",
    },
    {
      title: "Blazing first-paint",
      body: "Recipes and product pages are statically generated and served from the edge, images are responsive and lazy-loaded, and the heavy ad and analytics scripts are deferred so the main content paints first. Lab and field Core Web Vitals are green on both desktop and mobile.",
    },
    {
      title: "Responsive across every screen size",
      body: "The same layout primitives drive desktop, tablet, and mobile — sticky recipe cards, ingredient checklists, product galleries, and ad slots all reflow to the viewport. The site is designed mobile-first since the bulk of recipe traffic comes from phones held over a grill.",
    },
    {
      title: "High-viewability ad placements",
      body: "Ad units are positioned in-content (between recipe sections, in the right rail on desktop, sticky on mobile) and held in fixed-height containers so they never cause CLS. Lazy hydration keeps below-fold slots from loading until they enter the viewport, which raises viewability without hurting page speed.",
    },
    {
      title: "Custom Recipe plugin",
      body: "A custom WordPress plugin gives editors a structured recipe editor — ingredients, instructions, times, yields, ratings — exposed cleanly over GraphQL and rendered as a polished recipe card with schema.org markup, save/pin/print actions, and email opt-in, consistent across every recipe on the site.",
    },
  ],
};
