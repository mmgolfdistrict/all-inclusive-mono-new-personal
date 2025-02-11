/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,

  experimental: {
    serverComponentsExternalPackages: ["bcrypt"],
    instrumentationHook: true,
    serverSourceMaps: true,
    esmExternals: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dev-assets.golfdistrict.in",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.google.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.golfdistrict.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d1vt16457i7yu.cloudfront.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d13gaac8iye040.cloudfront.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d1ejy30rp9vioy.cloudfront.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d3oay9b1er2tcs.cloudfront.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.weather.gov",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d3oay9b1er2tcs.cloudfront.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d3aqhblezti4.cloudfront.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "demo-cdn.golfdistrict.in",
        port: "",
        pathname: "/**",
      },
    ],
  },
  transpilePackages: ["@juspay-tech/hyper-js", "@juspay-tech/react-hyper-js"],
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      "aws-crt": false,
    };
    config.experiments = { ...config.experiments, topLevelAwait: true };
    config.externals.push({
      "@aws-sdk/signature-v4-multi-region":
        "commonjs @aws-sdk/signature-v4-multi-region",
    });
    return config;
  },
};

export default bundleAnalyzer(config);
// export default config;
