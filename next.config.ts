import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
      {
        source: '/staff',
        destination: '/admin-login',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
