import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin-dashboard',
        permanent: false,
      },
      {
        source: '/admin/dashboard',
        destination: '/admin-dashboard',
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
