import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";

import { copy } from "@/lib/copy";

import "./globals.css";

/** Soft, rounded sans — intimate without looking corporate. */
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

/** A warm, slightly old-fashioned serif for headings — soft, not corporate. */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: {
    default: `${copy.app.name} — ${copy.app.tagline}`,
    template: `%s · ${copy.app.name}`,
  },
  description: copy.app.description,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#faf5ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
