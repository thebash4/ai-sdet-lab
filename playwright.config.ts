import { defineConfig, devices } from '@playwright/test'

const CI = !!process.env.CI

// Dedicated e2e port that is never reused: a server already running (e.g.
// `npm run dev` in another worktree) must not silently serve another
// checkout's code. Set E2E_PORT to run several worktrees at once.
const RAW_PORT = process.env.E2E_PORT ?? '5180'
// Digits only, so values like '0x1F90' or '5e3' are rejected, not converted.
const PORT = /^\d{1,5}$/.test(RAW_PORT) ? Number(RAW_PORT) : NaN
if (!(PORT >= 1 && PORT <= 65535)) {
  throw new Error(
    `E2E_PORT must be an integer from 1 to 65535, got: '${RAW_PORT}'`,
  )
}
// 127.0.0.1 rather than localhost, so the server and the readiness check
// cannot end up on different address families (IPv4 vs IPv6).
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
