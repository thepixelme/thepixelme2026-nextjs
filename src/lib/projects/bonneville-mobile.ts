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
    "A shared React Native platform behind nine Bonneville radio apps across five U.S. markets: KIRO Newsradio, KSL Newsradio, KTAR News, Arizona Sports, Sactown Sports, KSL Sports, Seattle Red, Seattle Sports, and Denver Sports.",
  description:
    "I led product and engineering, set the architecture, and shipped the apps with a small developer team.",
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
    "Bonneville needed nine branded apps without nine separate products to maintain. The answer was a shared platform: station identity lives in config, while feeds, playback, accounts, loyalty, and messaging stay common. New features ship once and land everywhere.",
  highlights: [
    {
      title: "One codebase, nine store listings",
      body: "Station config defines the logo, colors, app icon, push credentials, stream IDs, and market-specific labels. The build turns that map into separate App Store and Google Play submissions. Listeners get an app that feels local; the team gets one product to improve.",
    },
    {
      title: "CarPlay, built native because React Native had no good path",
      body: "CarPlay was one of the hardest parts of the project. There was no React Native package that handled the experience well enough for a production radio app, so I built the missing layer in Swift and Kotlin. The result is a proper in-car listening experience tied into the same playback system as the phone app.",
    },
    {
      title: "Custom pre-roll ads tied into playback",
      body: "Pre-roll ads also needed more control than the available libraries could give us. I built a native module that handles the ad lifecycle and plugs directly into the shared audio/video player, which made monetized playback reliable across live streams, podcasts, and video.",
    },
    {
      title: "No dead air after the ad",
      body: "A pre-roll ad is tolerable; a spinner after the ad is not. While the ad plays, the native module tells the main player to fetch and buffer the real stream in parallel. When the ad ends, playback hands off immediately.",
    },
    {
      title: "Cloud writes kept deliberately small",
      body: "Progress, loyalty, saves, and preferences all touch the database, so tiny choices become real operating cost at listener scale. We set a clear rule: keep each save under one kilobyte, skip unchanged writes, and batch quick edits. Steady state is about 80 bytes every two minutes per listener.",
    },
  ],
  learnings: [
    {
      lead: "Product and architecture have to agree early.",
      body: "The biggest decision was not a screen or a framework. It was choosing one shared platform instead of nine parallel apps, and making the roadmap fit that shape from day one.",
    },
    {
      lead: "Sometimes the right abstraction is native.",
      body: "React Native carried most of the product, but revenue-critical playback and in-car listening needed platform code. Drawing that line clearly kept the app fast without fighting the framework.",
    },
    {
      lead: "Cost control belongs in code review.",
      body: "The cloud bill is shaped by everyday implementation details. A simple write-size rule gave reviewers something measurable to enforce before usage scaled.",
    },
  ],
};
