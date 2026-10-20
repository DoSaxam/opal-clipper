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
  // Every image in Opal is served as-is (the gem art, proxied thumbnails).
  // No runtime image optimiser needed → sharp never has to be traced in.
  images: {
    unoptimized: true,
  },
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/sharp/**",
      "./node_modules/@img/sharp-*/**",
      "./node_modules/@img/sharp-libvips-*/**",
    ],
  },
};

export default nextConfig;
