import { defineConfig } from "@playwright/test";

const baseURL = process.env.SMOKE_URL ?? "http://localhost:3019";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      // Real-GPU flags (Iris Xe) for WebGL-heavy specs; harmless under SwiftShader fallback.
      args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=gl-egl"],
    },
  },
  webServer: process.env.SMOKE_URL
    ? undefined
    : {
        command: "npx vite preview --port 3019",
        port: 3019,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
