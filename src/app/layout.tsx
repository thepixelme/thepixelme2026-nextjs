import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import AnalyticsConsentServer from "@/components/analytics/AnalyticsConsentServer";
import { NotificationCenterProvider } from "@/lib/notification-center";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Nhat Nguyen - Bridging the Gap Between Business Vision and Technical Reality",
  description: "Nhat's little home on the web.",
  appleWebApp: {
    title: "ThePixelMe",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`glass-light h-full antialiased ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="h-full">
        <NotificationCenterProvider>
          {children}
          {/*
            Wrapped in Suspense so the `cookies()` read inside
            AnalyticsConsentServer stays isolated from the rest of the
            layout. If the route ends up fully dynamic anyway (no PPR /
            Cache Components configured), the cost is small — single page +
            /api/contact.
          */}
          <Suspense fallback={null}>
            <AnalyticsConsentServer />
          </Suspense>
        </NotificationCenterProvider>
      </body>
    </html>
  );
}
