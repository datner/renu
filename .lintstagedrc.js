const path = require("path");

const buildEslintCommand = (filenames) =>
  `pnpm next lint --fix --file ${filenames.map((f) => path.relative(process.cwd(), f)).join(" --file ")}`;

module.exports = {
  "./apps/web/src/**/*.{ts,tsx}": [buildEslintCommand],
};
