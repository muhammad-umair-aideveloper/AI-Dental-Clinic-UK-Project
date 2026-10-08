import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env['E2E_URL'] ?? 'http://localhost:3000';

export default defineConfig({
  testDir:    './tests/e2e',
  timeout:    60_000,
  retries:    process.env['CI'] ? 2 : 0,
  workers:    process.env['CI'] ? 1 : undefined,
  reporter:   [
    ['list'],
    ['html', { outputFolder: 'tests/e2e/report', open: 'never' }],
    ['json', { outputFile: 'tests/e2e/results.json' }],
  ],

  use: {
    baseURL:    BASE_URL,
    headless:   true,
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
    trace:      'on-first-retry',
    locale:     'en-GB',
    timezoneId: 'Europe/London',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'iphone-14',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'pixel-7',
      use: { ...devices['Pixel 7'] },
    },
  ],

  // Record a video of each test run
  outputDir: 'tests/e2e/artifacts',
});
