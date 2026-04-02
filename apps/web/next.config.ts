import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (useMocks || !apiUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
