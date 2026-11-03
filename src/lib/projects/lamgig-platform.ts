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
      src: "/lamgig/screenshot-calendar.jpg",
      alt: "Calendar in the LamGig dashboard for the salon demo: a day of sample appointments in a column for each team member, with New booking, Walk-in, and Block time buttons",
    },
    {
      src: "/lamgig/screenshot-website-salon.jpg",
      alt: "Home page of the salon demo's website: a large photo of nails being painted, the salon's name, today's opening time, and a Book now button",
    },
    {
      src: "/lamgig/screenshot-booking.jpg",
      alt: "Booking page on the salon demo's website at step 3 of 4: a row of dates and the open times for a gel manicure, with the service, person, and total summarized below",
    },
    {
      src: "/lamgig/screenshot-ordering.jpg",
      alt: "Order for pickup page on the cafe demo's website: coffees with photos and prices, one marked sold out, beside a Your order panel",
    },
    {
      src: "/lamgig/screenshot-orders.jpg",
      alt: "Orders screen for the cafe demo: sample orders in New, Preparing, and Ready columns with a one-tap button on each, plus controls to pause online orders and mark items sold out",
    },
    {
      src: "/lamgig/screenshot-app.jpg",
      alt: "Four screens from the cafe demo's iPhone app: the home screen with an Order online button, the menu, a mock-up of the level-up screen saying You reached Gold above a bottom navigation with Rewards selected, and a We miss you push notification on the lock screen. A caption says points are built and levels are a mock-up, not built yet",
    },
    {
      src: "/lamgig/screenshot-customers.jpg",
      alt: "Customers screen for the cafe demo: sample customers sorted into New, Regulars, VIP, At risk, Lapsed, Subscribed, and Rewards members, each with orders, lifetime value, and points",
    },
    {
      src: "/lamgig/screenshot-automations.jpg",
      alt: "Automations list in the cafe demo's Marketing screen: Welcome, Thank-you, Win-back, Birthday, and Loyalty milestone, each switched on, with sample counts of messages sent in the last 30 days",
    },
    {
      src: "/lamgig/screenshot-win-back.jpg",
      alt: "Win-back automation report for the cafe demo, with sample figures: emails sent and opened, and the orders and sales that followed within 7 days, with a plain explanation of how they are counted",
    },
    {
      src: "/lamgig/screenshot-publish.jpg",
      alt: "Publish screen: the live version, a Publish again button, and a version history with a one-click Roll back button beside every earlier version",
    },
  ],
  summary:
    "The technology big chains pay six figures for, in one product a small business can run by itself: a website and apps under its own name, online ordering and payments, appointment booking, a customer list that sorts itself, automatic marketing, and loyalty points.",
  description:
    "I founded LamGig and designed and built all of it myself: the dashboard business owners work in, the websites and iPhone and Android apps their customers use, and everything behind them that takes payments, books appointments, and sends marketing. It comes to more than 250,000 lines of code and more than 3,000 automated tests, the kind of product a company would normally give to a full team.",
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
    "Live in production with two demo stores, a cafe and a salon. No real business is on it yet, so every customer, order, and dollar in these screenshots is sample data. Production is set up for real payments and bookings. Email and push marketing and the iPhone and Android apps are built and tested, but aren't yet switched on for real businesses or in the app stores. A fourth product, Connected Growth, where neighboring businesses send each other customers, is planned and not built.",
  problem:
    "Nearly 60% of revenue at Starbucks' US company-run stores comes from rewards members. Starbucks knows your name, your usual, and the week you stopped coming, and it sends you a reason to come back. The business on your corner has a paper book, or a few separate subscriptions that don't share customers or data. A restaurant that joins a delivery app gives up a cut of every order and gets a first name and a last initial in return.\n\nLamGig gives that business the whole set under its own name. Every order, appointment, and loyalty point lands on one customer record that belongs to the business, and the marketing works from it automatically. The hard part was keeping all of that simple for an owner with no technical help, while making it solid enough to handle money, customer data, and messaging for many businesses at once.",
  highlights: [
    {
      title: "One click updates the website and both apps",
      body: "Owners change their menu or services, prices, hours, and branding in plain forms, then press Publish. The website and the iPhone and Android apps all update within about a minute, with no developer and no app store release. Every publish is saved, so one click brings back any earlier version. If a publish fails halfway, it picks up where it stopped.",
    },
    {
      title: "Online ordering with no marketplace in the middle",
      body: "Customers order pickup on the business's own website or app and pay by card or mobile wallet. Paid orders appear on the counter screen within seconds, with a chime, and staff move each one along with a tap. They can pause ordering during a rush, mark items sold out for the day, and issue refunds. Through Stripe, the money goes straight to the business's own bank account and LamGig's fee comes out automatically.",
    },
    {
      title: "Takes bookings while the shop is closed",
      body: "A salon's customers choose a service, a person, and a time on its website at any hour. The appointment lands on the front desk's calendar by itself, and one person can never be booked twice for the same time. Customers get a confirmation and a reminder email and can change or cancel online, up to a cutoff the business sets. The owner gets a summary in the morning. Walk-ins and phone bookings go on the same calendar.",
    },
    {
      title: "A customer list that builds and sorts itself",
      body: "Every order, visit, and loyalty sign-up lands on one customer record, with no data entry. LamGig sorts customers into new, regular, VIP, at risk, and lapsed, so an owner can see who is slipping away while there's still time to act. The list belongs to the business, not a marketplace.",
    },
    {
      title: "Marketing that runs itself and reports what it earned",
      body: "Five ready-made automations send themselves once they're turned on: welcome, thank-you, win-back, birthday, and loyalty milestone, by email or push notification. Owners can send their own campaigns too. Each report shows the orders a message brought in and what they were worth. Customers have to opt in, unsubscribing takes one click, and nobody gets more than one marketing email every three days.",
    },
    {
      title: "Loyalty points across the website, apps, and counter",
      body: "Customers earn points on orders, at the counter with a six-digit code from the app, and for opening the app each day. One account works on the website and in both apps, with sign-in by email code, password, Google, or Apple. Each business sets its own rules in plain language, and members are told automatically before a rule changes. Points can be earned today. Spending them, and the levels shown in the app screenshot, are planned and not built yet.",
    },
    {
      title: "Built to be trusted with money and customer data",
      body: "Each business's data is kept separate inside the database itself, not just in the app, and team members only get the access their role allows. A customer's data can be erased on request, at one business or across the whole platform. LamGig's own staff work from a separate console where they set up businesses and clear anything stuck. More than 3,000 automated tests check the work, and nothing reaches production without my sign-off.",
    },
  ],
  designNotes:
    "The dashboard is written for a busy business owner with no technical help. Ideas like drafts, versions, and rollbacks get a plain explanation right where they appear, every form says what each field is for, and risky actions spell out what will change before anything happens.\n\nEach role sees only what it can use. Viewers get read-only screens, editors can change content, counter staff work the orders, and admins manage the team, payments, and publishing.\n\nThe customer side works the same way. The websites and apps take every color, font, word, and price from what the owner published, so nobody has to touch code to change them. A cafe and a nail salon run on the same platform and look nothing alike.",
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
      lead: "A salon sells time, not a cart.",
      body: "Ordering and booking look alike until you build them. A cart can sell the same coffee all day, but an hour can only be sold once. So booking got its own engine, and the rule that one person can't be booked twice lives in the database, where a bug in the app can't break it.",
    },
    {
      lead: "Prove it on real services, not on paper.",
      body: "Each phase ended with a sign-off run against real services: real Gmail and Outlook inboxes, live Stripe configuration in production, push delivered to a real iPhone through Apple, and alerts fired on purpose in production to prove they work. Anything I didn't actually run is recorded as untested, which kept a one-person project honest as it grew.",
    },
  ],
};
