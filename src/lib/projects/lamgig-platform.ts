import type { Project } from "./types";

export const lamgigPlatform: Project = {
  id: "lamgig-platform",
  title: "LamGig: The growth platform for small businesses",
  tags: [
    "Web",
    "App",
    "Next.js",
    "PostgreSQL",
    "React",
    "TypeScript",
    "Swift",
    "Node.js",
    "Supabase",
    "Stripe",
  ],
  link: "https://www.lamgig.com",
  linkLabel: "Visit lamgig.com",
  screenshots: [
    {
      src: "/lamgig/screenshot-orders.jpg",
      alt: "LamGig dashboard Orders screen for the LamGig Cafe demo: a live order queue with New, Preparing, and Ready columns, each order card showing its items, total, and a Start or Picked up button, plus controls to pause online ordering and mark items sold out",
    },
    {
      src: "/lamgig/screenshot-home.jpg",
      alt: "Dashboard Home screen with a Needs you alert about late orders and an Open orders button, Orders today and Sales today cards, and a Recent activity feed of team and loyalty actions",
    },
    {
      src: "/lamgig/screenshot-menu.jpg",
      alt: "Dashboard Menu editor listing Coffee items with descriptions, prices, and availability toggles, with a seasonal item switched off and a New category button",
    },
    {
      src: "/lamgig/screenshot-publish.jpg",
      alt: "Publish screen showing the live version, a Publish again button, and a version history with a one-click Roll back button beside every earlier version",
    },
    {
      src: "/lamgig/screenshot-store.jpg",
      alt: "Store settings screen with online ordering status and pause options, live Stripe payments with accepted merchant terms, LamGig Payments switched on, and new-order email alerts",
    },
    {
      src: "/lamgig/screenshot-rewards.jpg",
      alt: "Rewards program settings showing what members earn now and a scheduled change to points per dollar, daily app check-in, joining, and birthday points, each with plain-language rules",
    },
    {
      src: "/lamgig/screenshot-push-automation.jpg",
      alt: "Win-back automation editor in the Marketing section: a push notification form with title, message, and tap destination beside a live lock-screen preview",
    },
  ],
  summary:
    "A multi-tenant platform that gives small businesses the technology big chains pay six figures for: their own website and iOS and Android apps, online ordering and payments, customer accounts, a loyalty program, and automated email and push marketing, all run from one dashboard.",
  description:
    "I founded LamGig and designed and built the entire platform myself in about three months. That covers the multi-tenant backend and database, the owner dashboard and LamGig's staff console, payments, email and push messaging, the customer website, and native iOS and Android apps. It comes to more than 200,000 lines of code, which is the kind of system a company would normally give to a full product team.",
  role: "Founder, designer, and sole engineer",
  stack: [
    "Next.js 16",
    "React 19",
    "TypeScript",
    "Supabase (Postgres + RLS)",
    "WorkOS",
    "Stripe Connect",
    "Resend",
    "APNs + FCM",
    "SwiftUI",
    "Kotlin + Jetpack Compose",
    "Tailwind CSS + shadcn/ui",
    "Zod",
    "Upstash Redis",
    "Sentry",
    "Vercel",
    "Playwright",
    "Vitest",
  ],
  status:
    "Live in production and set up for real payments. The whole platform, including the website and both apps, runs end to end on staging with a demo cafe, ahead of its first pilot business.",
  problem:
    "Big chains run on enterprise software for online ordering, customer data, automated marketing, and loyalty. A neighborhood cafe can't afford any of that, so it pays for a handful of separate subscriptions that don't share customers or data.\n\nLamGig gives that cafe the whole set on one platform. Its website and apps carry its own brand, and ordering, payments, the customer list, loyalty, and marketing all work from the same data. The hard part was keeping it simple for an owner who logs in once a month while making it solid enough to handle money, customer data, and messaging for many businesses at once.",
  highlights: [
    {
      title: "One publish updates the website and both apps",
      body: "Owners change their menu, prices, hours, and branding in plain forms and publish when they're ready. The website and the native iOS and Android apps all read the same published content, so a new price reaches a customer's phone within a minute, with no app update. Each publish is saved as a numbered version, and rolling back takes one click. Rollback is instant because nothing gets rebuilt; the live pointer just moves back to the earlier version. If a publish fails halfway, it picks up where it stopped, and each of those failure points has an automated test that breaks it on purpose.",
    },
    {
      title: "Online ordering with a live counter",
      body: "Customers order pickup on the business's own website and pay by card or mobile wallet. The order appears on the dashboard's Orders screen as soon as it's paid, with a chime so nobody misses it, and staff move it through New, Preparing, and Ready with one tap. They can pause online ordering for 30 minutes or until close, mark items sold out for the day, and issue refunds. The Home screen flags anything that needs attention, like orders running late.",
    },
    {
      title: "Payments with LamGig's revenue built in",
      body: "Payments run on Stripe Connect. Each business is paid straight to its own bank account, and LamGig's platform fee comes out of every order automatically. Production is set up for real money. LamGig's staff can stop ordering for one business or the whole platform in an emergency, a job reconciles payments every night, any order can be rebuilt from Stripe's records, and each business accepts merchant terms before it can take a payment.",
    },
    {
      title: "Email and push marketing with guardrails",
      body: "Owners can send email campaigns and push notifications, or turn on five ready-made automations: welcome, thank-you, win-back, birthday, and loyalty milestone. Customers have to opt in, unsubscribing takes one click, bounced addresses are suppressed, nobody gets more than one marketing message every three days, and notifications only go out between 9 a.m. and 8 p.m. local time. Each report shows the orders a message brought in, so owners can see what their marketing earns.",
    },
    {
      title: "Customer accounts and a loyalty program",
      body: "Customers sign in with an email code, a password, Google, or Apple, and the same account works on the website and in both apps. Each business sets its own points rules: points per dollar, a daily check-in in the app, and points for joining and on birthdays. At the counter, a member shows a six-digit code from the app and staff add points for the purchase from the dashboard. Rule changes are scheduled 30 days out and members are emailed about them automatically. The dashboard also estimates what outstanding points are worth for the books, and flags any member credited more than three times in a day.",
    },
    {
      title: "Security and reliability from a team of one",
      body: "Postgres row-level security keeps each business's data separate inside the database itself, and team members get admin, editor, or viewer access. LamGig's own staff work from a separate staff console where they set up businesses, review activity, and clear stuck operations. A customer's data can be erased on request at one business or across the whole platform. Behind all of it are 39 automated verification suites, 136 test files, and a release process where nothing reaches production without a manual sign-off.",
    },
  ],
  designNotes:
    "The dashboard is written for a busy cafe owner. Ideas like drafts, versions, and rollbacks get a plain explanation right where they appear, every form says what each field is for, and risky actions spell out what will change before anything happens.\n\nEach role sees only what it can use. Viewers get read-only screens, editors can change content, and admins manage the team, payments, and publishing.\n\nThe customer side works the same way. The website and apps take every color, font, word, and price from what the owner published, so the business looks like itself everywhere and nobody has to touch code to change it.",
  learnings: [
    {
      lead: "Design for the once-a-month user.",
      body: "Owners don't log in every day, so they never build muscle memory. Plain language and guardrails work better for them than clever shortcuts, and every screen has to make sense to someone who has forgotten how it works.",
    },
    {
      lead: "Build the marketing engine, pay only for sending.",
      body: "Instead of renting a marketing suite, LamGig runs its own segments, automations, and frequency rules. It pays only to send: email through Resend, and push straight to Apple and Google with no vendor in between. That keeps costs low and keeps the customer relationship with the business.",
    },
    {
      lead: "Prove it on real infrastructure, with real money.",
      body: "Each phase ended with a sign-off run against real services: real Gmail and Outlook inboxes, live Stripe configuration in production, push delivered to a real iPhone through Apple, and alerts fired on purpose in production to prove they work. Anything I didn't actually run is recorded as untested, which kept a one-person project honest as it grew.",
    },
  ],
};
