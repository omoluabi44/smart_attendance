import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    'framer-motion', 'lucide-react', 'recharts', 'pdfjs-dist', 'react-pdf', 
    'katex', 'react-icons', 'react-spinners', 'rehype-katex', 'remark-math', 
    'zustand', 'jose','path-to-regexp','next-auth'
  ],
  serverExternalPackages: ['import-in-the-middle', 'require-in-the-middle'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    ppr: 'incremental',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

// --- Sentry Configuration ---
export default withSentryConfig(nextConfig, {
  org: "coursepass",
  project: "coursepass-frontend",

  // 1. Correct property for hiding source maps
  sourcemaps: {
    disable: false,
    // This replaces 'hideSourceMaps': it removes the sourceMappingURL 
    // comment so browsers don't try to download them.
    deleteSourcemapsAfterUpload: true, 
  },

  // 2. These are now top-level options (NOT inside a webpack key)
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  
  // 3. Replacement for automaticVercelMonitors
  automaticVercelMonitors: true,

  // 4. Bundle size optimizations
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});