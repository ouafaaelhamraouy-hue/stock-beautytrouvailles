import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@phosphor-icons/react',
    ],
  },
};

const config = withNextIntl(nextConfig) as NextConfig & {
  experimental?: {
    turbo?: {
      resolveAlias?: Record<string, string>;
    };
  };
};

// next-intl currently sets experimental.turbo; move it to turbopack to avoid the deprecation warning.
if (config.experimental?.turbo) {
  const { turbo, ...restExperimental } = config.experimental;
  config.experimental = Object.keys(restExperimental).length > 0 ? restExperimental : undefined;
  config.turbopack = {
    ...config.turbopack,
    ...turbo,
    resolveAlias: {
      ...(config.turbopack?.resolveAlias || {}),
      ...(turbo.resolveAlias || {}),
    },
  };
}

export default config;
