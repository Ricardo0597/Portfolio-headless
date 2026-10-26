import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/headless',
  output: 'standalone',
  // This app is its own repo; when checked out inside the Drupal project (as
  // the nextjs/ submodule) Next.js would otherwise pick the parent's lockfile.
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  turbopack: {},
  allowedDevOrigins: ['portfolio.ddev.site', '*.ngrok-free.dev', '*.ngrok-free.app'],

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      'onnxruntime-node$': false,
    };
    return config;
  },
};

export default nextConfig;
