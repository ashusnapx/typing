const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_ORIGINS = API_URL ? ` ${new URL(API_URL).origin}` : '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ORIGINS = SUPABASE_URL ? ` ${new URL(SUPABASE_URL).origin}` : '';

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https:;
  font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com;
  connect-src 'self'${API_ORIGINS}${SUPABASE_ORIGINS};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* This app is the workspace root, and it has to say so.
  
     Next walks up from here looking for a lockfile to infer the root, and
     finds one in the home directory — `~/package.json` exists because `vercel`
     was installed there with npm rather than globally. So it inferred `~` as
     the root, warned that this project's own lockfile was an "additional" one,
     and would have traced files from the wrong directory. Pinning it is the
     fix; the stray lockfile upstairs is harmless once we stop looking at it.
  
     `outputFileTracingRoot` was set here too and had to come out: it made the
     build succeed and then fail while deploying its own output, looking for
     `.next/package.json` at a path that is not a package. The warning only
     ever asked for the turbopack root. */
  turbopack: {
    root: __dirname,
  },
  /**
   * /dashboard/analytics was a second view of the same `useDashboard()` data
   * the dashboard already renders — the same four figures, the same history,
   * plus a "qualification prediction" whose 20%/30% were floor values a
   * formula returns when it has no data at all. It also still wore the old
   * sketched visual language. One page that answers the question well beats
   * two that disagree about how to look, so it is gone and its URL points at
   * the survivor.
   */
  async redirects() {
    return [
      {
        source: '/dashboard/analytics',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  output: 'standalone',
  transpilePackages: ['react-hot-toast'],

  images: {
    localPatterns: [
      { pathname: '/images/**' },
      // The captures of the product's own screens behind the hero carousel.
      { pathname: '/showcase/**' },
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'mathsmania.com' },
      { protocol: 'https', hostname: 'r2.mathsmania.com' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ' ').trim(),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
