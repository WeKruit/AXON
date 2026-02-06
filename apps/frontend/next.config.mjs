// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyTimeout: 90_000,
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [{
        key: "Document-Policy",
        value: "js-profiling",
      }, ],
    }, ];
  },
  reactStrictMode: false,
  transpilePackages: ['crypto-hash'],
  productionBrowserSourceMaps: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders }) => {
    if (!dev) {
      config.devtool = isServer ? 'source-map' : 'hidden-source-map';
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/api/uploads/:path*',
        destination:
          process.env.STORAGE_PROVIDER === 'local' ? '/uploads/:path*' : '/404',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination:
          process.env.STORAGE_PROVIDER === 'local'
            ? '/api/uploads/:path*'
            : '/404',
      },
    ];
  },
};

let finalConfig = nextConfig;

// Only wrap with Sentry when auth token is available
if (process.env.SENTRY_AUTH_TOKEN) {
  const { withSentryConfig } = await import('@sentry/nextjs');
  finalConfig = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    sourcemaps: {
      disable: false,
      assets: [
        ".next/static/**/*.js",
        ".next/static/**/*.js.map",
        ".next/server/**/*.js",
        ".next/server/**/*.js.map",
      ],
      ignore: [
        "**/node_modules/**",
        "**/*hot-update*",
        "**/_buildManifest.js",
        "**/_ssgManifest.js",
        "**/*.test.js",
        "**/*.spec.js",
      ],
      deleteSourcemapsAfterUpload: true,
    },
    release: {
      create: true,
      finalize: true,
      name: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || undefined,
    },
    widenClientFileUpload: true,
    telemetry: false,
    silent: process.env.NODE_ENV === 'production',
    debug: process.env.NODE_ENV === 'development',
    errorHandler: (error) => {
      console.warn("Sentry build error occurred:", error.message);
      return;
    },
  });
}

// Safeguard: strip any injected "target" property (breaks Next.js 13+)
if (finalConfig.target) {
  delete finalConfig.target;
}

export default finalConfig;
