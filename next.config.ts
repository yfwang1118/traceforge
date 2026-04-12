import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

export default function createNextConfig(phase: string): NextConfig {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    reactStrictMode: true,
    // Keep dev/build artifacts isolated so a local `next build` won't
    // invalidate a running `next dev` server (missing chunk runtime errors).
    distDir: isDevServer ? '.next-dev' : '.next',
  };
}
