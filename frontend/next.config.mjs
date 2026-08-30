/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // The project ships without an ESLint config; don't block builds on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
