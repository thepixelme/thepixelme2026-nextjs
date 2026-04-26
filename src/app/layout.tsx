import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
  title: "Nhat Nguyen — Portfolio",
  description:
    "Portfolio of Nhat Nguyen, presented as a macOS desktop. Click around — it's all real.",
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
      <body className="h-full">{children}</body>
    </html>
  );
}
