import { defineConfig } from 'vitest/config';

// Os papéis (anon, authenticated) são do cluster inteiro, não do banco temporário.
// Rodar os arquivos em série evita corrida ao criá-los.
export default defineConfig({ test: { fileParallelism: false } });
