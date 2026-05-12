/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.clerk.com *.clerk.accounts.dev *.vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: *.clerk.com *.clerk.accounts.dev",
              "font-src 'self' data: fonts.gstatic.com",
              "connect-src 'self' *.clerk.com *.clerk.accounts.dev *.vercel.live https: http://localhost:*",
              "frame-src 'self' *.clerk.com *.clerk.accounts.dev",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
