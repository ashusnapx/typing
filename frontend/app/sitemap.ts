import type { MetadataRoute } from 'next';
import { APP, EXAM_MODES } from '@/lib/config';
import { getFlatLessons } from '@/lib/typing-curriculum';

/** Only pages a signed-out visitor can actually reach. Dashboards, analysis,
 *  admin and auth screens are behind a login and are excluded here and in
 *  robots.ts — an indexed page that redirects to a login is a dead result. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) => `${APP.url}${path}`;

  const marketing = [
    { path: '/', priority: 1 },
    { path: '/exam', priority: 0.9 },
    { path: '/learn', priority: 0.9 },
    { path: '/faq', priority: 0.8 },
    { path: '/leaderboard', priority: 0.6 },
    { path: '/coach', priority: 0.6 },
    { path: '/about', priority: 0.5 },
    { path: '/contact', priority: 0.5 },
    { path: '/privacy', priority: 0.3 },
    { path: '/terms', priority: 0.3 },
    { path: '/refunds', priority: 0.3 },
  ];

  return [
    ...marketing.map((p) => ({
      url: url(p.path),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: p.priority,
    })),
    ...EXAM_MODES.map((mode) => ({
      url: url(mode.href),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...getFlatLessons().map((lesson) => ({
      url: url(`/exam/lesson/${lesson.id}`),
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    })),
  ];
}
