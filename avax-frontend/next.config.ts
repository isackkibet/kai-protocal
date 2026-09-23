import type { NextConfig } from "next";

const SIHU_URL = process.env.NEXT_PUBLIC_SIHU_URL || "http://localhost:3000";
const OLOOLUA_URL = process.env.NEXT_PUBLIC_OLOOLUA_URL || "http://localhost:3002";

const nextConfig: NextConfig = {
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
