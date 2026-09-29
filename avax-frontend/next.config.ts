import type { NextConfig } from "next";

const SIHU_URL = process.env.NEXT_PUBLIC_SIHU_URL || "http://localhost:3000";
const OLOOLUA_URL = process.env.NEXT_PUBLIC_OLOOLUA_URL || "http://localhost:3002";

const nextConfig: NextConfig = {
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
