import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // force tracing root to THIS package — prevents broken standalone output
  // when the app folder is nested inside another Node project on the server
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["undici", "archiver"],
  devIndicators: false,
};

export default nextConfig;
