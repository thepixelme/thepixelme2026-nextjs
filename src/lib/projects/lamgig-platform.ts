import type { Project } from "./types";

export const lamgigPlatform: Project = {
  id: "lamgig-platform",
  title: "LamGig — All-in-one business dashboard for small businesses",
  tags: [
    "Web",
    "Next.js",
    "PostgreSQL",
    "React",
    "TypeScript",
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
    "A multi-tenant SaaS dashboard where small business owners run their whole operation — menu, online orders, payments, customer marketing, and a loyalty program — from one simple, safe place.",
  description:
    "I founded LamGig and designed and built the dashboard and everything behind it myself in about three months: the multi-tenant backend, the database, payments, messaging, and the owner-facing interface. It's the kind of system companies usually staff with a full product team — roughly 150,000 lines of code.",
  role: "Founder — product, design, and sole engineer",
  stack: [
    "Next.js 16",
    "React 19",
    "TypeScript",
    "Supabase (Postgres + RLS)",
    "WorkOS",
    "Stripe Connect",
    "Resend",
    "APNs + FCM",
    "Tailwind CSS + shadcn/ui",
    "Zod",
    "Upstash Redis",
    "Sentry",
    "Vercel",
    "Playwright",
    "Vitest",
  ],
  status:
    "Live in production and ready for real payments. The full dashboard runs end to end on staging with a demo cafe, ahead of its first pilot business.",
  problem:
    "Big chains run on enterprise software: online ordering, customer data, automated marketing, and loyalty programs. A neighborhood cafe can't afford that, so it juggles a handful of disconnected subscriptions that don't share customers or data.\n\nThe LamGig dashboard puts all of it in one place. The hard part was making it simple enough for an owner who logs in once a month, yet robust enough to handle money, customer data, and messaging for many businesses at once.",
  highlights: [
    {
      title: "A live order counter in the browser",
      body: "New orders appear on the Orders screen the moment they're paid, with a chime so nobody misses one, and move across New, Preparing, and Ready with a single tap. Staff can pause online ordering for 30 minutes or until close, mark items sold out for the day, and issue refunds, and the Home screen flags anything that needs attention, like orders running late.",
    },
    {
      title: "Payments with revenue built in",
      body: "Payments run on Stripe Connect, so each business is paid straight to its own bank account while LamGig's platform fee is collected automatically on every order. Production is set up for real money, with an emergency kill switch, nightly payment reconciliation, the ability to rebuild any order from Stripe's records, and merchant terms each business accepts before taking payments.",
    },
    {
      title: "Edit, publish, and undo in one click",
      body: "Owners update their menu, prices, hours, and branding in plain forms, then publish when they're ready. Every publish is saved as a numbered version, and going back to an earlier one takes a single click. It's instant because nothing is rebuilt; the live version simply points back. If a publish is interrupted halfway, it resumes exactly where it left off, and every one of those failure points has an automated test that deliberately breaks it.",
    },
    {
      title: "Marketing that runs itself, politely",
      body: "Owners can send email campaigns and push notifications, or switch on five ready-made automations: welcome, thank-you, win-back, birthday, and loyalty milestone. The guardrails are built in: customers must opt in, unsubscribing takes one click, bounced addresses are suppressed, nobody gets more than one marketing message every three days, and notifications only go out between 9 a.m. and 8 p.m. local time. Every report shows the orders each message brought in, so owners can see what their marketing actually earns.",
    },
    {
      title: "A loyalty program owners control",
      body: "Each business sets its own points rules: points per dollar, a daily check-in bonus, joining and birthday rewards. Staff can add points for in-store purchases right from the dashboard when a member shows their six-digit code. Rule changes are scheduled 30 days out and members are emailed automatically, the dashboard estimates the value of points outstanding for the books, and a member credited more than three times in a day is flagged to the owner.",
    },
    {
      title: "Enterprise-grade security and reliability, from a team of one",
      body: "Every business's data is walled off inside the database itself, not just hidden in the interface, and team members get admin, editor, or viewer access. LamGig's own staff work from a dedicated staff console to set up businesses, review activity, and resolve stuck operations, and a customer's data can be erased on request at one business or across the whole platform. Behind it all sit 39 automated verification suites, 127 test files, and a release process where nothing reaches production without a manual sign-off.",
    },
  ],
  designNotes:
    "The dashboard is written for a busy owner, not a developer. Technical ideas like drafts, versions, and rollbacks are explained in plain words where they appear (“Version 13 is live — published by you”), every form says what each field is for, and risky actions explain what will change before they happen.\n\nEvery role sees only what it can use: viewers get read-only screens, editors can change content, and admins manage the team, payments, and publishing.",
  learnings: [
    {
      lead: "Design for the once-a-month user.",
      body: "Owners don't log in every day, so they never build muscle memory. Plain language and guardrails beat clever shortcuts: every screen has to make sense to someone who has forgotten how it works.",
    },
    {
      lead: "Build the brain, buy only the delivery.",
      body: "Instead of renting a marketing suite, LamGig runs its own segments, automations, and frequency rules, and pays only for sending: email through Resend, and push straight to Apple and Google with no vendor in between. That keeps costs low and keeps the customer relationship in the business's hands.",
    },
    {
      lead: "Prove it on real infrastructure, with real money.",
      body: "Each phase ended with a sign-off run against real services: real Gmail and Outlook inboxes, live Stripe configuration in production, and alerts fired on purpose in production to prove they work. Anything not actually exercised is recorded as untested, which kept a one-person project honest as it grew.",
    },
  ],
};
