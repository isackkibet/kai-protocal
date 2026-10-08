import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // This app lives nested inside a monorepo with multiple lockfiles above it.
  // Without pinning the root, Next/Turbopack infers the wrong workspace root
  // and pulls in a sibling app's middleware (avax-frontend/src/proxy.ts),
  // which then fails to resolve against this app's own path aliases.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
