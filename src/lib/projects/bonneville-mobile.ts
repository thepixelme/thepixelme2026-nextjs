import type { Project } from "./types";

export const bonnevilleMobile: Project = {
  id: "bonneville-mobile",
  title: "Bonneville News & Sports Mobile",
  tags: ["Mobile", "React Native", "TypeScript", "Expo", "Native modules"],
  orientation: "portrait",
  screenshots: [
    {
      src: "/bonneville-mobile/screenshot-homescreen.jpg",
      alt: "Seattle Sports home screen on iPhone with branded station header, content-type tabs (All / News / Podcasts / Videos), a featured live MLB show card with red play button, a live Tigers vs Royals scoreboard, and the persistent bottom tab bar",
    },
    {
      src: "/bonneville-mobile/screenshot-livestream-player.jpg",
      alt: "Full-screen Now Playing livestream view with Major League Baseball cover art, a LIVE badge, Video/Audio output toggle, and a large red pause button",
    },
    {
      src: "/bonneville-mobile/screenshot-explorescreen.jpg",
      alt: "Explore screen with News and Podcasts tabs, team filter chips (Latest / Seattle Seahawks / Seattle Mariners), and a vertical list of news article cards with cover photos",
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
      src: "/bonneville-mobile/screenshot-videoscreen.jpg",
      alt: "Videos tab with a horizontally-scrolling Featured row of episode tiles above a Shorts row of portrait video thumbnails",
    },
    {
      src: "/bonneville-mobile/screenshot-actionscreen.jpg",
      alt: "Connect screen letting listeners interact with the station via SMS to the studio line, voice-message recording, and a coming-soon section for additional channels",
    },
    {
      src: "/bonneville-mobile/screenshot-myscreen.jpg",
      alt: "My account screen showing the loyalty-points dashboard (4 points, BASIC tier with progress to Silver), Saved Articles, and Favorite Shows sections",
    },
    {
      src: "/bonneville-mobile/screenshot-loginscreen.jpg",
      alt: "Onboarding sign-in screen with the Seattle Sports 710 AM logo, the tagline 'Your Home for Sports', and Sign In / Sign Up buttons",
    },
  ],
  summary:
    "A multi-tenant React Native platform that ships nine branded news and sports radio apps from one codebase — KIRO Newsradio, KSL Newsradio, KTAR News, Arizona Sports, Sactown Sports, KSL Sports, Seattle Red, Seattle Sports, Denver Sports — for Bonneville International across five U.S. markets.",
  description:
    "I led both product and engineering: I owned the roadmap, made the architectural calls, contributed to the code, and led a small developer team to ship it.",
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
    "Shipping in production — 9 App Store / Play Store releases, ~24K LOC TypeScript across 159 files",
  problem:
    "The default path was one mobile project per station — each with its own engineers, quirks, and debt. I argued for a single codebase that re-skins itself per station at build time. Every feature ships to nine apps at once, every fix lands everywhere, and onboarding a new station becomes a JSON entry instead of a multi-quarter rebuild.",
  highlights: [
    {
      title: "One codebase, nine App Store releases",
      body: "The lever sits in `app.config.js`. A single map turns the build pipeline into nine distinct App Store / Play Store submissions. Bundle ID, deep-link scheme, push credentials, branded assets — every per-station fact resolves from one source of truth.",
      code: `const stationConfigs = {
  "KIRO-AM": {
    name: "Seattle Sports",
    scheme: "kiroam",
    bundleIdentifier: "com.bonneville.kiroam",
    package: "com.jacobsmedia.KIROAM",
    androidApiKey: "c5a45659-...",
    iosApiKey: "5e0bcdc2-...",
    firebaseCloudMessagingSenderId: "994584908647",
    assetsFolder: "kiroam",
  },
  // ... eight more stations
};`,
    },
    {
      title: "Custom Expo modules where the SDK ecosystem stopped",
      body: "Off-the-shelf React Native ad SDKs couldn't coordinate preroll with our custom audio/video state machine, so I scoped a custom Expo module — `expo-ima` — wrapping Google's IMA SDK in Swift on iOS and Kotlin on Android, dispatching the full ad lifecycle back into JS.\n\nPaired with `expo-carplay` (standalone CarPlay audio without the phone app), these modules unlocked monetization and in-car listening that would otherwise have been blocking.",
      code: `func adsLoader(_ loader: IMAAdsLoader, adsLoadedWith adsLoadedData: IMAAdsLoadedData) {
  adsManager = adsLoadedData.adsManager
  adsManager?.delegate = self

  let renderingSettings = IMAAdsRenderingSettings()
  renderingSettings.linkOpenerPresentingController = findViewController()

  adsManager?.initialize(with: renderingSettings)
}`,
    },
    {
      title: "Engineering discipline that scales with users, not feature creep",
      body: "User data syncs through AWS API Gateway → DynamoDB, which bills writes in **1 KB increments** — a 1.1 KB write costs 2 WCUs. With podcast progress auto-saving every 120 s and loyalty events firing on every share, listen, and login, sloppy payloads compound fast. I wrote the standard into `AGENTS.md` and held the team to it: every write payload should fit in ~1 KB, split hot-path data from cold-path metadata, shard collections into per-item lists, smart-write to skip writes when nothing changed, debounce repeated mutations.\n\nSteady state is an ~80 B progress write every 120 s with zero metadata writes — a cost curve that scales with users, not feature creep.",
    },
  ],
  learnings: [
    {
      lead: "Holding both bets at once changes the architecture.",
      body: "When the same person owns the product roadmap and the technical roadmap, decisions like *one codebase or nine* get made on the merits, not on org-chart politics.",
    },
    {
      lead: "Native modules are a product lever, not a fallback.",
      body: "Building `expo-ima` and `expo-carplay` from scratch was the difference between shipping monetization + CarPlay and shipping neither. The right time to write a native bridge is when no SDK matches the contract you actually need.",
    },
    {
      lead: "Cost discipline belongs in the codebase, not the spreadsheet.",
      body: "DynamoDB's per-KB billing made write-payload size a first-class concern. Writing the rule down (~1 KB target) gave reviewers something concrete to enforce, so the bill scaled with usage instead of with carelessness.",
    },
  ],
};
