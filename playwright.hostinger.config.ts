import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests for the Hostinger web hosting package (pages plus the PHP form handler),
 * run against a server you start yourself: HOSTINGER_URL=http://127.0.0.1:18600 npx playwright test -c playwright.hostinger.config.ts
 * See docs/14_DEPLOY_HOSTINGER.md, "Testing the web hosting package".
 */
const baseURL = process.env.HOSTINGER_URL ?? 'http://127.0.0.1:18600';
export default defineConfig({
  testDir: 'tests/e2e-hostinger',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL, trace: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
