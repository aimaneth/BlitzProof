import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    PORT: '3002',
  },
  // Image configuration
  images: {
    unoptimized: true,
    domains: [],
    remotePatterns: [],
  },
  // Handle SSR issues with wallet libraries
  experimental: {
    esmExternals: 'loose',
  },
  // Handle browser-only APIs
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't attempt to load browser-only modules on the server
      config.externals.push({
        'indexeddb': 'commonjs indexeddb',
        'localforage': 'commonjs localforage',
      });
    }
    
    // Handle polyfills for browser APIs
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    return config;
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
