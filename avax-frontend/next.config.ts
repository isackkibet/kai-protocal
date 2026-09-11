import type { NextConfig } from "next";
import path from "path";

// This app lives in a subfolder of a larger repo (kai-protocal/) that has its
// own unrelated package-lock.json and node_modules (Hardhat/Python tooling).
// `turbopack.root` silences the "multiple lockfiles" dev warning, but on
// Vercel it also steers output file tracing — the step that decides which
// files get bundled into each serverless function. Left pointed at the outer
// repo, tracing can resolve against the WRONG node_modules and drop
// dependencies (Prisma engine, Privy server SDK, etc.) from the deployed
// function, crashing it in production regardless of which route is hit.
// Pinning outputFileTracingRoot to this folder guarantees tracing only ever
// looks inside avax-frontend's own node_modules.
const appRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
