import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  // Note: X-XSS-Protection header removed - it's deprecated and can introduce
  // security vulnerabilities in older browsers. Modern browsers ignore it.
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin'
  },
  // CSP is set dynamically per-request in src/proxy.ts with a nonce.
  // Do NOT add a static Content-Security-Policy header here.
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  // Keep the repo AGENTS.md as the source of truth. Next 16's `next dev`
  // otherwise appends a generated agent-rules block on every boot.
  agentRules: false,
  // Optimize barrel file imports - transforms lucide-react imports to direct imports at build time
  // This reduces bundle size by ~1MB and improves cold start by 200-800ms
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    // Run the React Compiler natively in Turbopack. The Node babel-loader worker
    // dies mid-compile on Windows (WSAECONNRESET) and takes /dashboard down with it.
    turbopackRustReactCompiler: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
  async rewrites() {
    return [
      // Proxy PostHog requests to avoid ad blockers
      // Note: Specific routes must come BEFORE wildcard routes to match correctly
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/api/generate-cards',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/api/generate-reviewer',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/api/share/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/api/share',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
    ];
  },
};

export default nextConfig;
