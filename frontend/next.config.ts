import type { NextConfig } from "next";

const acmeApi = process.env.ACME_API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  output: "standalone",
  agentRules: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${acmeApi}/:path*`,
      },
    ];
  },
};

export default nextConfig;
