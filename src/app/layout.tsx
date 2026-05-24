import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import AnalyticsConsent from "@/components/analytics/AnalyticsConsent";
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
        {children}
        <AnalyticsConsent />
      </body>
    </html>
  );
}
