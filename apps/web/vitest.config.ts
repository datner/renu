/// <reference types="vitest" />

import react from "@vitejs/plugin-react";
import { join } from "path";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      integrations: join(__dirname, "./integrations"),
      src: join(__dirname, "/src"),
      pages: join(__dirname, "./pages"),
    },
  },
  test: {
    environment: "jsdom",
    deps: {
      interopDefault: false,
    },
  },
});
