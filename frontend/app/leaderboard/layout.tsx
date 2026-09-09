import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SSC Typing Test Leaderboard',
  description:
    'Fastest attempts that actually cleared their bar, from candidates practising for the SSC CGL and CHSL typing tests.',
  alternates: { canonical: '/leaderboard' },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
