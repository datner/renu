const plugin = require("tailwindcss/plugin");
const defaultTheme = require("tailwindcss/defaultTheme");

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
        ocre: {
          50: "#FFFCF3",
          100: "#FFF5DE",
          200: "#FEEABE",
          300: "#FEE09D",
          400: "#FDD57D",
          500: "#FDCB5C",
          600: "#BE9845",
          700: "#7F662E",
          800: "#3F3317",
        },
        ginger: {
          50: "#FEF6F2",
          100: "#FBE0D3",
          200: "#F7C1A7",
          300: "#F3A37B",
          400: "#EF844F",
          500: "#EB6523",
          600: "#B04C1A",
          700: "#763312",
          800: "#3B1909",
        },
        coral: {
          50: "#FFF5F6",
          100: "#FEDCE0",
          200: "#FDB9C1",
          300: "#FB96A1",
          400: "#FA7382",
          500: "#F95063",
          600: "#BB3C4A",
          700: "#7D2832",
          800: "#3E1419",
        },
        blush: {
          50: "#FDF6FA",
          100: "#FAE5EF",
          200: "#F5CBDF",
          300: "#F0B2D0",
          400: "#EB98C0",
          500: "#E67EB0",
          600: "#AD5F84",
          700: "#733F58",
          800: "#39202C",
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

          neutral: "#dcdbdd",

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
    require("@tailwindcss/forms")({ strategy: "class" }),
    require("@headlessui/tailwindcss"),
    require("daisyui"),
    require("@tailwindcss/line-clamp"),
    plugin(function({ addVariant, matchVariant }) {
      addVariant("error", ["&[aria-invalid=true]", "&:invalid"]);
      addVariant("error", ["&[aria-invalid=true]", "&:invalid"]);
      matchVariant(
        "5nth",
        (value) => {
          return `&:nth-child(5n+${value})`;
        },
        {
          values: {
            1: "1",
            2: "2",
            3: "3",
            4: "4",
            5: "5",
          },
        },
      );
      matchVariant(
        "nth",
        (value) => {
          return `&:nth-child(${value})`;
        },
        {
          values: {
            1: "1",
            2: "2",
            3: "3",
            4: "4",
            5: "5",
          },
        },
      );
      matchVariant(
        "group-5nth",
        (value) => {
          return `:merge(.group):nth-child(5n+${value}) &`;
        },
        {
          values: {
            1: "1",
            2: "2",
            3: "3",
            4: "4",
            5: "5",
          },
        },
      );
    }),
  ],
};
