import type { Metadata } from 'next';
import { Kalam, Patrick_Hand } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

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
  title: 'Maths Mania - SSC Typing Test Simulator',
  description:
    "India's Most Accurate SSC Typing Exam Simulator. Practice SSC CHSL, CGL DEST with exact evaluation logic and TCS iON replica experience.",
  keywords:
    'SSC Typing Test, SSC CHSL Typing Practice, SSC CGL DEST Practice, SSC Hindi Typing Test, Free SSC Typing Test',
  icons: {
    icon: '/images/logo.jpg',
    apple: '/images/logo.jpg',
  },
  openGraph: {
    title: 'Maths Mania - SSC Typing Test Simulator',
    description:
      "India's Most Accurate SSC Typing Exam Simulator",
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
    <html lang="en" className={`${kalam.variable} ${patrickHand.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
