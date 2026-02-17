/** @type {import('next').NextConfig} */

// Get hostname from environment variable (without protocol)
const getHostname = () => {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
};

const appHostname = getHostname();

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'images.unsplash.com', 'via.placeholder.com', appHostname, 'adasupply.com', 'www.adasupply.com'],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: appHostname,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: appHostname,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'adasupply.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.adasupply.com',
        pathname: '/uploads/**',
      },
      // SECURITY: Wildcard hostname removed to prevent SSRF
      // Add specific domains here if needed:
      // { protocol: 'https', hostname: 'cdn.example.com', pathname: '/uploads/**' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverComponentsExternalPackages: ['@elastic/elasticsearch', '@elastic/transport', 'undici'],
  },
  // Environment variables that should be available on the client side
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  // Rewrites - serve uploaded files through API route
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
  // Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // CSP is now set dynamically with nonce in middleware.ts
        ],
      },
    ];
  },
  // Webpack configuration for handling node modules in client-side code
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Skip parsing undici to avoid private class field issues
    config.module = config.module || {};
    config.module.noParse = config.module.noParse || [];
    if (Array.isArray(config.module.noParse)) {
      config.module.noParse.push(/node_modules[/\\]undici/);
    }

    return config;
  },
}

module.exports = nextConfig
