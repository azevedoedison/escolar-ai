import { defineConfig } from '@playwright/test';
import { e2eDatabaseUrl } from './e2e/support/db';

// Dois modos:
//  * Simulado (padrão do script "e2e"): sobe a API com o modelo simulado (TATA_MODEL_MOCK=1), banco Postgres local e o app exportado. Sem chave.
//  * Manual: sem E2E_MOCK_MODEL, o app precisa estar no ar em E2E_BASE_URL (padrão http://localhost:8081).
const mock = process.env.E2E_MOCK_MODEL === '1';
const databaseUrl = process.env.DATABASE_URL ?? e2eDatabaseUrl();

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  outputDir: 'e2e-results/artifacts',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8081',
    screenshot: 'on',
    trace: 'off',
    launchOptions: process.env.E2E_CHROMIUM_PATH ? { executablePath: process.env.E2E_CHROMIUM_PATH } : {},
  },
  webServer: mock
    ? [
        {
          command: 'pnpm --filter @tata/api exec tsx src/server.ts',
          url: 'http://localhost:3000/health',
          reuseExistingServer: false,
          timeout: 60_000,
          env: { TATA_MODEL_MOCK: '1', DATABASE_URL: databaseUrl, CHILD_TOKEN_SECRET: 'segredo-de-teste-e2e-nao-usar-em-producao', PORT: '3000', WEB_ORIGINS: 'http://localhost:8081' },
        },
        { command: 'node e2e/serve-web.mjs', url: 'http://localhost:8081', reuseExistingServer: false, timeout: 30_000 },
      ]
    : undefined,
});
