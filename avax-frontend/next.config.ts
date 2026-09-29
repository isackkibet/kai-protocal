import type { NextConfig } from "next";

const SIHU_URL = process.env.NEXT_PUBLIC_SIHU_URL || "http://localhost:3000";
const OLOOLUA_URL = process.env.NEXT_PUBLIC_OLOOLUA_URL || "http://localhost:3002";

const nextConfig: NextConfig = {
  // Do not advertise the framework — it tells vulnerability scanners exactly
  // which Next.js advisories to try against us.
  poweredByHeader: false,

  // Every server function was shipping ~55 MB of Prisma WebAssembly engines
  // for databases/runtimes this app never uses (CockroachDB, MySQL, SQL
  // Server, SQLite, edge). The generated client uses the native "library"
  // engine (runtime/library.js + libquery_engine-*.so.node), which stays.
  outputFileTracingExcludes: {
    "/**": [
      "node_modules/@prisma/client/runtime/*.wasm-base64.{js,mjs}",
      "node_modules/.prisma/client/*.wasm",
    ],
  },
  /*
   * Security headers are declared here as a fallback for any response that
   * does not pass through src/proxy.ts (e.g. a static asset, or a future
   * route excluded by its matcher).
   *
   * NOTE: Content-Security-Policy is deliberately NOT set here. proxy.ts owns
   * it because it needs to generate a per-request nonce. Sending two CSP
   * headers makes the browser enforce the INTERSECTION of both policies, so
   * duplicating it would silently tighten the nonce-based policy and break
   * Privy login and wallet-connect. One owner, one header.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), autoplay=(), camera=(self), display-capture=(), " +
              "encrypted-media=(), geolocation=(self), gyroscope=(), magnetometer=(), " +
              "microphone=(self), payment=(self), usb=()",
          },
        ],
      },
      {
        // Payment responses must never be cached by a proxy or the browser.
        source: "/api/paystack/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
        ],
      },
      {
        source: "/api/mpesa/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/sihu",
        destination: SIHU_URL,
        permanent: false,
      },
      {
        source: "/oloolua",
        destination: OLOOLUA_URL,
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/sihu/:path*",
        destination: `${SIHU_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
