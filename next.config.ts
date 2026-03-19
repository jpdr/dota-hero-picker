import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/dota-hero-picker' : '',
  assetPrefix: isProd ? '/dota-hero-picker/' : '',
};

export default nextConfig;
