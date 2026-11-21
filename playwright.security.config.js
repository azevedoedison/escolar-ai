import { defineConfig } from '@playwright/test';

// Testes de defeitos e de fluxos críticos (ver docs/tata-ia/05 e 06).
// Rodar: npm run e2e:security  (exige servidor em BASE_URL e banco de teste em DATABASE_URL)
export default defineConfig({
  testDir: './tests/security',
  timeout: 60000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    // CHROMIUM_PATH só é definido em ambientes com navegador pré-instalado
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
    trace: 'off',
    screenshot: 'only-on-failure',
  },
});
