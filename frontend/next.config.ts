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
    // Disable image optimization completely for static images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Handle SSR issues with wallet libraries
  experimental: {
    // Remove esmExternals as it's causing issues
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
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
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
  // Output configuration for static export
  output: 'standalone',
  // Disable static optimization for pages that need dynamic content
  trailingSlash: false,
};

export default nextConfig;
