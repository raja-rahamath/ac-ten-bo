/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@agentcare/ui'],
};

module.exports = nextConfig;
