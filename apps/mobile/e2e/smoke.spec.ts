// Fumaça: não precisa de API nem de conta. Cobre navegação, rótulos e erro de login com dados falsos.
import { expect, test } from '@playwright/test';

test('home tem links para as telas principais', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Entrar (responsável)', 'Criar conta de responsável', 'Cadastrar filho(a)', 'Parear aparelho da criança', 'Aparelhos conectados', 'Conversar com a Tatá']) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
});

test('cadastro tem rótulos visíveis e valida campos vazios', async ({ page }) => {
  await page.goto('/signup');
  for (const label of ['Seu nome', 'E-mail', 'Senha']) await expect(page.getByText(label, { exact: true })).toBeVisible();
  await page.getByText('Criar conta', { exact: true }).last().click();
  await expect(page.getByRole('alert').first()).toBeVisible();
});

test('login com dados falsos mostra erro e navega entre telas', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('inexistente@example.com');
  await page.getByLabel('Senha').fill('senha-falsa-123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible();
  await page.getByText('Criar conta', { exact: true }).click();
  await expect(page).toHaveURL(/signup/);
  await page.locator('a:visible', { hasText: 'Voltar ao início' }).click();
  await expect(page).toHaveURL(/\/$/);
});
