import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Kalam, Patrick_Hand } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { HealthIndicator } from '@/components/health-indicator';
import { APP, FOOTER, WOBBLY_RADII } from '@/lib/config';
import {
  Youtube,
  Instagram,
  Send,
  Github,
  ExternalLink,
} from 'lucide-react';

const kalam = Kalam({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-marker',
});

const patrickHand = Patrick_Hand({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-hand',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://typingmania.com'),
  title: 'Typing Mania by Maths Mania - SSC Typing Test Simulator',
  description:
    "India's Most Accurate SSC Typing Exam Simulator. Learn typing from scratch. Practice SSC CHSL, CGL DEST with exact evaluation logic and TCS iON replica experience.",
  keywords:
    'SSC Typing Test, SSC CHSL Typing Practice, SSC CGL DEST Practice, SSC Hindi Typing Test, Free SSC Typing Test, Learn Typing, Touch Typing',
  icons: {
    icon: '/images/logo.jpg',
    apple: '/images/logo.jpg',
  },
  openGraph: {
    title: 'Typing Mania by Maths Mania - SSC Typing Test Simulator',
    description:
      "India's Most Accurate SSC Typing Exam Simulator. Learn from scratch.",
    type: 'website',
    images: [{ url: '/images/logo.jpg', width: 900, height: 900 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${kalam.variable} ${patrickHand.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <div className="flex-1"><Providers>{children}</Providers></div>
        <footer className="border-t-2 border-pencil bg-white mt-auto">
          {/* Main Footer */}
          <div className="max-w-5xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="sm:col-span-2 md:col-span-1">
                <Link href="/" className="flex items-center space-x-2 -rotate-1 inline-block hover:rotate-0 transition-transform">
                  <Image
                    src="/images/logo.jpg"
                    alt="Typing Mania"
                    width={32}
                    height={32}
                    className="w-8 h-8 border border-pencil"
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  />
                  <div>
                    <span className="text-xl font-bold text-pencil font-marker">{APP.name}</span>
                    <span className="block text-xs font-hand text-pencil/50 font-normal">{APP.tagline}</span>
                  </div>
                </Link>
                <p className="mt-3 text-sm font-hand text-pencil/60 leading-relaxed">
                  {FOOTER.description}
                </p>
              </div>

              {/* Exam Links */}
              <div>
                <h3 className="text-base font-bold text-pencil font-marker mb-3">Exam Modes</h3>
                <ul className="space-y-2">
                  {FOOTER.examLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-hand text-pencil/60 hover:text-pencil transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links + Account */}
              <div>
                <h3 className="text-base font-bold text-pencil font-marker mb-3">Quick Links</h3>
                <ul className="space-y-2 mb-6">
                  {FOOTER.quickLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-hand text-pencil/60 hover:text-pencil transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <h3 className="text-base font-bold text-pencil font-marker mb-3">Account</h3>
                <ul className="space-y-2">
                  {FOOTER.accountLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-hand text-pencil/60 hover:text-pencil transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company + Social */}
              <div>
                <h3 className="text-base font-bold text-pencil font-marker mb-3">Company</h3>
                <ul className="space-y-2 mb-6">
                  {FOOTER.companyLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-hand text-pencil/60 hover:text-pencil transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <h3 className="text-base font-bold text-pencil font-marker mb-3">Follow Us</h3>
                <div className="flex space-x-3">
                  {FOOTER.socialLinks.map((link) => {
                    const Icon = { Youtube, Instagram, Send, Github }[link.icon] || ExternalLink;
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center border-2 border-pencil text-pencil/60 hover:text-pencil hover:bg-muted transition-all"
                        style={{ borderRadius: WOBBLY_RADII.sm }}
                        aria-label={link.label}
                      >
                        <Icon className="w-4 h-4" strokeWidth={3} />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t-2 border-pencil/20 py-4">
            <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-center sm:text-left">
                <p className="text-sm font-hand text-pencil/60">{FOOTER.legal.copyright}</p>
                <p className="text-xs font-hand text-pencil/40">{FOOTER.legal.disclaimer}</p>
              </div>
              <HealthIndicator />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
