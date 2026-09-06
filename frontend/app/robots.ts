import type { MetadataRoute } from 'next';
import { APP } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Signed-in surfaces and API routes. Nothing here is useful in a result
      // page, and a live exam screen must never be crawled mid-test.
      disallow: ['/api/', '/admin', '/dashboard', '/analysis', '/auth/'],
    },
    sitemap: `${APP.url}/sitemap.xml`,
    host: APP.url,
  };
}
