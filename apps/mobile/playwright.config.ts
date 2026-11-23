import { defineConfig } from '@playwright/test';

// O app web precisa estar rodando em E2E_BASE_URL (padrão http://localhost:8081).
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8081', screenshot: 'on', trace: 'off' },
});
