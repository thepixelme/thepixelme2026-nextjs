import type { Project } from "./types";

export const bonnevilleMobile: Project = {
  id: "bonneville-mobile",
  title: "Bonneville News & Sports Mobile",
  tags: ["Mobile", "React Native", "TypeScript", "Expo", "Native modules"],
  orientation: "portrait",
  screenshots: [
    {
      src: "/bonneville-mobile/screenshot-homescreen.jpg",
      alt: "Seattle Sports home screen on iPhone with branded station header, content-type tabs (All / News / Podcasts / Videos / Shorts), a featured live MLB show card with red play button, a live Tigers vs Royals scoreboard, and the persistent bottom tab bar",
    },
    {
      src: "/bonneville-mobile/screenshot-videoscreen.jpg",
      alt: "Videos tab with a horizontally-scrolling Featured row of episode tiles above a Shorts row of portrait video thumbnails",
    },
    {
      src: "/bonneville-mobile/screenshot-actionscreen.jpg",
      alt: "Connect screen letting listeners interact with the station via SMS to the studio line, voice-message recording, and a coming-soon section for additional channels",
    },
    {
      src: "/bonneville-mobile/screenshot-explorescreen.jpg",
      alt: "Explore screen with News and Podcasts tabs, team filter chips (Latest / Seattle Seahawks / Seattle Mariners / & other categories), and a vertical list of news article cards with cover photos",
    },
    {
      src: "/bonneville-mobile/screenshot-myscreen.jpg",
      alt: "My account screen showing the loyalty-points dashboard (points, tier with progress to next tier), Saved Articles, Favorite Shows, In-Progress Podcasts, Favorite Videos and Shorts",
    },
    {
      src: "/bonneville-mobile/screenshot-livestream-player.jpg",
      alt: "Full-screen Now Playing livestream view with Major League Baseball cover art, a LIVE badge, Video/Audio output toggle, and a large red pause button",
    },
    {
      src: "/bonneville-mobile/screenshot-vod-player.jpg",
      alt: "Video-on-demand player showing a Bump & Stacy podcast episode preview with Save and Share buttons and the show description below",
    },
    {
      src: "/bonneville-mobile/screenshot-short-player.jpg",
      alt: "Vertical short-form video player swiping between two clips, with a TALKING caption overlay and floating like / share controls on the right edge",
    },
    {
      src: "/bonneville-mobile/screenshot-loginscreen.jpg",
      alt: "Onboarding sign-in screen with the Seattle Sports 710 AM logo, the tagline 'Your Home for Sports', and Sign In / Sign Up buttons",
    },
  ],
  summary:
    "Nine mobile apps — one for each of Bonneville International's news and sports radio stations across five U.S. markets — all built and shipped from a single codebase. KIRO Newsradio, KSL Newsradio, KTAR News, Arizona Sports, Sactown Sports, KSL Sports, Seattle Red, Seattle Sports, and Denver Sports.",
  description:
    "I led both sides — product and engineering. I owned the roadmap, made the architectural calls, wrote code alongside the team, and led a small group of developers all the way to launch.",
  role: "Product & engineering lead, small developer team",
  stack: [
    "Expo 54",
    "React Native 0.81",
    "TypeScript 5.9",
    "Zustand",
    "TanStack Query",
    "Expo Router 6",
    "Reanimated 4",
    "react-native-video 7",
    "Braze 20",
    "Firebase 24",
    "AWS Cognito + DynamoDB",
    "Swift",
    "Kotlin",
  ],
  status:
    "Live in production — 9 apps on the App Store and Google Play, ~24,000 lines of TypeScript across 159 files",
  problem:
    "The obvious approach would have been nine separate apps — one team per station, each with its own backlog, its own bugs, its own years of accumulated mess. I pushed for the opposite: one app that puts on a different costume for each station. Same engine, different paint job. Every new feature ships to all nine stations the day it's built. Every bug fix lands everywhere at once. Onboarding a new station — should Bonneville acquire one — is a configuration change, not a six-month rebuild.",
  highlights: [
    {
      title: "Nine apps in the App Store, built and shipped from one project",
      body: "Each station has its own logo, colors, and brand — and to a listener, each one feels like a polished standalone app. Behind the scenes, they're the same app wearing different costumes. A single configuration file holds each station's identity (name, app icon, push credentials, brand colors), and the build turns that map into nine separate App Store and Google Play submissions. Adding a tenth station is one new entry in the map.",
    },
    {
      title: "When the off-the-shelf tools fell short, we built our own",
      body: "Two features had no working off-the-shelf solution: pre-roll ads (the ones that play before a podcast or live stream — Bonneville's main way of monetizing the app) and CarPlay (so drivers can keep listening in the car). I built both as custom native modules in Swift (iPhone) and Kotlin (Android), plugging straight into our audio and video player. The ads module handles every step of an ad's lifecycle. The CarPlay module gives drivers a clean in-car experience without ever needing the phone app open. Together, they unlocked revenue for the business and in-car listening for the audience.",
    },
    {
      title: "The show is already loaded by the time the ad ends",
      body: "On radio apps, listeners expect playback to be immediate — tap and the show starts. A pre-roll ad already strains that expectation; if the actual show then takes another two or three seconds to buffer after the ad ends, it feels broken. The fix lives inside the ads module: while the ad is playing, it quietly tells the audio and video player to start fetching and buffering the real content in parallel — two normally-separate systems coordinated through the native bridge. By the time the ad finishes, the show is already loaded. The hand-off is invisible: no spinner, no awkward gap.",
    },
    {
      title: "A cost curve that scales with listeners, not with carelessness",
      body: "Every time the app saves something — your podcast progress, your loyalty points, a saved article — Bonneville pays a tiny fraction of a cent to the cloud database. Multiply by tens of thousands of listeners, every couple of minutes, all day long, and the bill adds up fast. The database also charges in fixed one-kilobyte chunks: a 1.1 KB save costs the same as a 2 KB one. I wrote a single rule into the team's standards: every save fits inside one kilobyte, skip the write when nothing changed, batch quick edits together. Steady state is about 80 bytes every two minutes per listener — a bill that scales with the audience, not with carelessness.",
    },
  ],
  learnings: [
    {
      lead: "Owning both sides of the table changes what's possible.",
      body: "When the same person owns the product roadmap and the technical roadmap, decisions like *one app or nine* get made on what's right for the business — not on what's easiest given who reports to whom.",
    },
    {
      lead: "Writing custom plumbing is sometimes the only path to the product you want.",
      body: "If we'd waited for an off-the-shelf plugin to support pre-roll ads and CarPlay the way we needed, the project would still be waiting. Sometimes the bravest call is to stop hunting for a workaround and build the missing piece yourself.",
    },
    {
      lead: "Spending the company's money carefully is an engineering job, not just a finance one.",
      body: "The bill from a cloud database is set by every line of code that writes to it. Putting a clear, measurable rule into the team's standards — every save under one kilobyte — gave reviewers a target to design against. The result is a bill that scales with how many people use the app, not with how careful any one engineer happened to be on a Tuesday.",
    },
  ],
};
