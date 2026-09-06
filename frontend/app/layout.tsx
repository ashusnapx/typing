import type { Metadata, Viewport } from "next";
import {
  EB_Garamond,
  Figtree,
  JetBrains_Mono,
  Noto_Sans_Devanagari,
} from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { APP } from "@/lib/config";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { Reveal } from "@/components/layout/reveal";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP.url),
  title: {
    default: "Typing Mania — SSC Typing Test Simulator",
    template: "%s · Typing Mania",
  },
  description: APP.description,
  keywords: APP.keywords,
  icons: { icon: APP.logo, apple: APP.logo },
  openGraph: {
    title: "Typing Mania — SSC Typing Test Simulator",
    description: APP.description,
    type: "website",
    images: [{ url: APP.logo, width: 900, height: 900 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffeb",
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
    <html
      lang="en"
      className={`${garamond.variable} ${figtree.variable} ${jetbrainsMono.variable} ${devanagari.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-bg text-ink antialiased">
        <Reveal />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border-2 focus:border-vast focus:bg-lumen focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          <Providers>{children}</Providers>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
