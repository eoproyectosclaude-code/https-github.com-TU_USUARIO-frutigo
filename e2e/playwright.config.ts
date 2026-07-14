import { defineConfig, devices } from '@playwright/test';

/**
 * Sirve el dashboard admin estático (apps/admin) y corre las specs contra él.
 * El dashboard cae a "modo demo" sin backend, así que las pruebas no requieren API.
 */
const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Servidor estático con Python (preinstalado en los runners de CI, sin descargas).
    command: `python3 -m http.server ${PORT} --directory ../apps/admin`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
