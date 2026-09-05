import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";

import { PwaRegister } from "@/components/pwa-register";
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
  applicationName: copy.app.shortName,
  title: {
    default: `${copy.app.name} — ${copy.app.tagline}`,
    template: `%s · ${copy.app.name}`,
  },
  description: copy.app.description,
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: copy.app.shortName,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#faf5ef" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
