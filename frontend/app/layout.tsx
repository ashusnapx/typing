import type { Metadata, Viewport } from "next";
import { Figtree, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { APP } from "@/lib/config";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { Reveal } from "@/components/layout/reveal";

/* One typeface.
 *
 * There were four: a serif for headings, this for body, a monospace for
 * figures and passages, and Devanagari. Four voices on one page is noise to a
 * reader who is here to pass an exam, and it made the same number look like
 * two different numbers depending on which card it sat in.
 *
 * Every role now points at this one family. Figures stay aligned through
 * `font-variant-numeric: tabular-nums` rather than through a second face.
 * Devanagari remains only because no Latin font carries Devanagari glyphs —
 * it is a script fallback, not a second voice. */
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
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
  themeColor: "#ffffff",
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
      className={`${figtree.variable} ${devanagari.variable}`}
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
