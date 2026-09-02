import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i3.ytimg.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
