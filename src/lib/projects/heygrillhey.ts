import type { Project } from "./types";

export const heygrillhey: Project = {
  id: "heygrillhey",
  title: "Hey Grill Hey — Recipe and commerce rebuild",
  tags: ["Web", "Headless WordPress", "Gatsby", "Shopify", "TypeScript"],
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
    "A faster, easier-to-shop rebuild of Susie Bulloch's BBQ recipe site, bringing recipes, ads, and Shopify products into one responsive experience.",
  description:
    "I worked on the front end with a small team to move Hey Grill Hey from a traditional WordPress theme to a Gatsby site powered by WordPress and Shopify. The result was faster for readers, cleaner for shoppers, and still familiar for the editorial team.",
  role: "Front-end developer, on a small team",
  stack: [
    "Gatsby",
    "TypeScript",
    "Headless WordPress",
    "WPGraphQL",
    "Shopify Storefront API",
    "Custom Recipe plugin (PHP)",
    "Tailwind CSS",
  ],
  status: "Live in production at heygrillhey.com",
  problem:
    "The old site had to support a lot at once: a large recipe archive, display ads, and a Shopify store that lived away from the main experience. The challenge was to make the site feel faster and more unified without forcing the content team into a new CMS.",
  highlights: [
    {
      title: "Kept publishing familiar while making the site faster",
      body: "WordPress stayed as the place Susie's team writes and manages recipes. Gatsby pulled that content over WPGraphQL and turned it into static pages, so editors kept their workflow while readers got a faster, more reliable site.",
    },
    {
      title: "Brought the store into the recipe experience",
      body: "Shopify products are rendered inside the same Gatsby app as the recipes, with shared navigation and styling. That made the path from a recipe to a sauce, rub, kit, or cookbook feel like one brand experience instead of a jump to another storefront.",
    },
    {
      title: "Improved page speed without dropping revenue needs",
      body: "Recipe and product pages are generated ahead of time, served from a CDN, and paired with responsive, lazy-loaded images. Heavy ad and analytics scripts are deferred, which helps the main content appear quickly while still leaving room for the business model.",
    },
    {
      title: "Designed for cooks on phones",
      body: "Recipe cards, ingredient checklists, product galleries, and ad placements all reflow from desktop to mobile. That mattered because recipe traffic often comes from people cooking in the moment, not browsing from a perfect desk setup.",
    },
    {
      title: "Protected ad performance and the reading experience",
      body: "Ad units are placed in-content, in the desktop rail, and in mobile-friendly positions, with fixed-height containers to avoid layout jumps. Below-the-fold slots load only when needed, improving viewability without making the page feel heavy.",
    },
    {
      title: "Made every recipe easier to maintain and reuse",
      body: "A custom WordPress Recipe plugin gave editors structured fields for ingredients, instructions, timing, yields, and ratings. That data powers consistent recipe cards, search-friendly markup, and reader actions like saving, pinning, printing, and email signup.",
    },
  ],
};
