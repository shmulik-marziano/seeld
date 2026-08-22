import { defineConfig, devices } from "@playwright/test";

// The previous config imported `lovable-agent-playwright-config`, a package that
// is neither installed nor declared in package.json — so `playwright test` could
// not even load it, and there were no specs behind it anyway. This one is
// self-contained and runs against a real production build.
//
// Requires the browser once:  npx playwright install chromium

const PORT = 4173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "he-IL",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Built, not dev-served: these tests exist to catch what only shows up in a
    // production bundle — a stale chunk reference, a chunk that white-screens.
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
