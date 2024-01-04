import { withBlitz } from "@blitzjs/next";
import { Locale } from "database";

/**
 * @type {import('@blitzjs/next').BlitzConfig}
 */
const config = {
  reactStrictMode: true,
  webpack: {
    ignored: /node_modules/,
  },
  transpilePackages: ["ui", "@integrations/*", "shared"],
  i18n: {
    locales: Object.values(Locale),
    defaultLocale: Locale.en,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "renu.imgix.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    loader: "custom",
    loaderFile: "./imgix-loader.js",
    deviceSizes: [640, 750, 828, 1080],
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/home",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/t/:path",
          destination: "/tiny/:path",
        },
        {
          source: "/kiosk/:identifier",
          destination: "/menu/:identifier",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default withBlitz(config);
