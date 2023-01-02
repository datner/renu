import { withBlitz } from "@blitzjs/next"
import { withPlaiceholder } from "@plaiceholder/next"
import { Locale } from "database"

/**
 * @type {import('@blitzjs/next').BlitzConfig}
 **/
const config = {
  reactStrictMode: true,
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
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/home",
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/t/:path",
          destination: "/tiny/:path",
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default withPlaiceholder(withBlitz(config))
