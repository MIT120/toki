/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'standalone', // TEMPORARILY REMOVE THIS
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    productionBrowserSourceMaps: false,
    images: {
        unoptimized: true
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    outputFileTracingExcludes: {
        '*': [
            'node_modules/@swc/core-linux-x64-gnu',
            'node_modules/@swc/core-linux-x64-musl',
            'node_modules/@esbuild/linux-x64',
        ],
    },
    outputFileTracingIncludes: {
        '/api/translations/[locale]/[namespace]': ['./data/translations/**/*'],
    },
    async rewrites() {
        return [
            {
                source: "/ingest/static/:path*",
                destination: "https://us-assets.i.posthog.com/static/:path*"
            },
            {
                source: "/ingest/:path*",
                destination: "https://us.i.posthog.com/:path*"
            },
            {
                source: "/ingest/decide",
                destination: "https://us.i.posthog.com/decide"
            }
        ]
    }
}

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
    nextConfig,
    {
        // For all available options, see:
        // https://www.npmjs.com/package/@sentry/webpack-plugin#options

        org: "devpowerbg-ltd",
        project: "toki",

        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
        // This can increase your server load as well as your hosting bill.
        // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
        // side errors will fail.
        // tunnelRoute: "/monitoring",

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true,

        // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
        // See the following for more information:
        // https://docs.sentry.io/product/crons/
        // https://vercel.com/docs/cron-jobs
        automaticVercelMonitors: true,
    }
);
