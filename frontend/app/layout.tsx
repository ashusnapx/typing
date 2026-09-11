import type { Metadata, Viewport } from "next";
import { Figtree, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { APP } from "@/lib/config";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { Reveal } from "@/components/layout/reveal";
import { SiteStructuredData } from "@/components/seo/structured-data";

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

/* The title carries the words people search with.
 *
 * "Typing Mania — SSC Typing Test Simulator" led with a brand nobody is
 * looking for and spent the rest on "simulator", which nobody types either.
 * The exam is searched for by its name and its number — "ssc cgl typing test",
 * "ssc chsl typing test", "35 wpm" — so those come first, and the brand takes
 * the end of the line where it still reads as ours. */
const TITLE = "SSC Typing Test — Free CGL & CHSL DEST Practice | Typing Mania";

export const metadata: Metadata = {
  metadataBase: new URL(APP.url),
  title: {
    default: TITLE,
    template: "%s · SSC Typing Test | Typing Mania",
  },
  description: APP.description,
  keywords: APP.keywords,
  applicationName: APP.name,
  authors: [{ name: 'Maths Mania' }],
  creator: 'Maths Mania',
  publisher: 'Maths Mania',
  alternates: { canonical: '/' },
  category: 'education',
  icons: { icon: APP.logo, apple: APP.logo },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    title: TITLE,
    description: APP.description,
    type: "website",
    url: APP.url,
    siteName: APP.fullName,
    locale: 'en_IN',
    images: [{ url: APP.logo, width: 900, height: 900, alt: APP.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: APP.description,
    images: [APP.logo],
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
      <body className="flex min-h-screen flex-col bg-bg text-ink antialiased grainy">
        <SiteStructuredData />
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
