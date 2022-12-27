const plugin = require("tailwindcss/plugin")
const defaultTheme = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["{pages,src,app}/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "370px",
      },
      colors: {
        emerald: {
          50: "#F7FBF9",
          100: "#CFE4DD",
          200: "#BDDFD5",
          300: "#A0C9BB",
          400: "#70AD99",
          500: "#419277",
          600: "#117755",
          700: "#0D5940",
          800: "#093C2B",
          900: "#041E15",
        },
      },
      fontFamily: {
        title: ["var(--font-secular-one)", ...defaultTheme.fontFamily.sans],
        sans: ["var(--font-noto-sans)", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  daisyui: {
    themes: [
      {
        renu: {
          primary: "#BDDFD5",

          secondary: "#FEEABE",

          accent: "#FDB9C1",

          neutral: "#FAE5EF",

          "base-100": "#FDFBF9",

          info: "#E67EB0",

          success: "#419277",

          warning: "#FDCB5C",

          error: "#F95063",
        },
      },
    ],
  },
  plugins: [
    require("daisyui"),
    require("@tailwindcss/forms")({ strategy: "class" }),
    require("@headlessui/tailwindcss"),
    require("@tailwindcss/line-clamp"),
    plugin(function ({ addVariant }) {
      addVariant("error", ["&[aria-invalid=true]", "&:invalid"])
    }),
  ],
}
