import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      template: "treemap", // or sunburst
      open: true,
      gzipSize: true,
    }),
  ],
  base:
    // eslint-disable-next-line
    process.env.NODE_ENV === "production"
      ? "/github-classroom-dashboard/"
      : "/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          chartjs: ["chart.js"],
        },
      },
    },
  },
});
