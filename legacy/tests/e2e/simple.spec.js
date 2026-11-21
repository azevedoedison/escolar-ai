/**
 * Testes E2E - Escolar AI
 * Seletores baseados no HTML REAL de ~/projects/escolar-ai
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Limpar storage antes de cada teste
test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
});

test.describe('📋 E2E - Escolar AI', () => {

  test.describe('1. Tela Principal', () => {
    test('deve carregar a página', async ({ page }) => {
      await expect(page).toHaveTitle(/Escolar AI/);
    });

    test('deve mostrar botão Histórico', async ({ page }) => {
      await expect(page.locator('button:has-text("Histórico")')).toBeVisible({ timeout: 10000 });
    });

    test('deve mostrar botão Limpar', async ({ page }) => {
      await expect(page.locator('button:has-text("Limpar")')).toBeVisible({ timeout: 10000 });
    });

    test('deve mostrar input de mensagem', async ({ page }) => {
      await expect(page.locator('textarea, input[placeholder*="dúvida"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('2. Sugestões', () => {
    test('deve mostrar sugestões de perguntas', async ({ page }) => {
      await expect(page.locator('text=Ciências')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Matemática')).toBeVisible();
      await expect(page.locator('text=História')).toBeVisible();
      await expect(page.locator('text=Português')).toBeVisible();
    });
  });

  test.describe('3. Chat', () => {
    test('deve ter input de texto', async ({ page }) => {
      const input = page.locator('textarea').first();
      await expect(input).toBeVisible({ timeout: 10000 });
    });

    test('deve ter botão enviar', async ({ page }) => {
      const btn = page.locator('button').filter({ hasNot: page.locator('button:has-text("Histórico"), button:has-text("Limpar"), button:has-text("Voltar")') }).last();
      await expect(btn).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('4. Responsividade', () => {
    test('mobile 375px', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page).toHaveTitle(/Escolar AI/);
    });

    test('tablet 768px', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page).toHaveTitle(/Escolar AI/);
    });
  });

  test.describe('5. Navegação', () => {
    test('deve ter link Voltar', async ({ page }) => {
      await expect(page.locator('a:has-text("Voltar")')).toBeVisible({ timeout: 10000 });
    });
  });

});
