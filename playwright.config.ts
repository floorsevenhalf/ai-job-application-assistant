import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: { trace: "retain-on-failure" },
  webServer: {
    command: "corepack pnpm dev --host 127.0.0.1",
    url: "http://127.0.0.1:5173/examples/react-test/",
    reuseExistingServer: true,
    timeout: 30_000
  }
});