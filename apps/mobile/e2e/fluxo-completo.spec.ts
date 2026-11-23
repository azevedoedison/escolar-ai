// Fluxo completo. Só roda com E2E_FULL=1 e exige API no ar, conta de teste combinada e e-mail confirmado.
// Variáveis: E2E_GUARDIAN_EMAIL, E2E_GUARDIAN_PASSWORD (conta de teste), E2E_SIGNUP=1 para criar a conta.
import { expect, test } from '@playwright/test';

const full = process.env.E2E_FULL === '1';
const email = process.env.E2E_GUARDIAN_EMAIL ?? '';
const password = process.env.E2E_GUARDIAN_PASSWORD ?? '';

test.describe.configure({ mode: 'serial' });
test.skip(!full || !email || !password, 'defina E2E_FULL=1, E2E_GUARDIAN_EMAIL e E2E_GUARDIAN_PASSWORD');

test('cadastro do responsável (opcional)', async ({ page }) => {
  test.skip(process.env.E2E_SIGNUP !== '1', 'conta já existe');
  await page.goto('/signup');
  await page.getByLabel('Seu nome').fill('Responsável de Teste');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('switch').click();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('alert').or(page.getByText('Tatá IA'))).toBeVisible();
});

test('login, cadastro de filho, código de pareamento e chat', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByText('Cadastrar filho(a)').click();
  await page.getByText('SALVAR', { exact: false }).click();

  await page.goto('/pairing/new');
  await expect(page.getByText(/\d{6}/)).toBeVisible();

  await page.goto('/chat');
  await page.getByPlaceholder('Escreva sua pergunta').fill('Como funciona a fotossíntese?');
  await page.getByText('ENVIAR', { exact: false }).click();
  await expect(page.getByText(/fotoss/i).nth(1)).toBeVisible({ timeout: 30_000 });
});
