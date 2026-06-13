import { defineConfig } from "vite";

export default defineConfig({
  build: { target: "es2022", chunkSizeWarningLimit: 1200 },
  server: { port: 3019 },
  preview: { port: 3019 },
});
