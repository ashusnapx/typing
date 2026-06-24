const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_ORIGINS = API_URL ? ` ${new URL(API_URL).origin}` : '';

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https:;
  font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com;
  connect-src 'self'${API_ORIGINS} https://awfqpmgshuicrfiwyvhy.supabase.co;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    localPatterns: [
      { pathname: '/images/**' },
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
