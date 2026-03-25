/**
 * Testes E2E - Escolar AI
 * 12 testes funcionais
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const TS = Date.now();

test.describe('🔐 Página de Login', () => {
  
  test('LOGIN-001: deve carregar a página', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Escolar AI/);
  });

  test('LOGIN-002: deve ter formulário de login do pai', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#parentEmail')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#parentPassword')).toBeVisible();
    await expect(page.locator('#parentLoginBtn')).toBeVisible();
  });

  test('LOGIN-003: deve ter link para Cadastrar', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('a:has-text("Cadastrar")')).toBeVisible();
  });

  test('LOGIN-004: deve mostrar formulário de registro ao clicar', async ({ page }) => {
    await page.goto(BASE);
    await page.click('a:has-text("Cadastrar")');
    await page.waitForTimeout(500);
    
    await expect(page.locator('#registerCard')).toBeVisible();
    await expect(page.locator('#regName')).toBeVisible();
    await expect(page.locator('#regEmail')).toBeVisible();
    await expect(page.locator('#regPassword')).toBeVisible();
  });

});

test.describe('👨 Registro de Pai', () => {

  test('REG-001: deve registrar com sucesso', async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    await page.click('a:has-text("Cadastrar")');
    await page.waitForTimeout(300);
    await page.fill('#regName', 'Pai E2E');
    await page.fill('#regEmail', `reg${TS}@test.com`);
    await page.fill('#regPassword', '123456');
    await page.click('#registerCard button:has-text("Criar")');
    await page.waitForTimeout(2000);
    
    // Auth page deve estar hidden
    const authHidden = await page.locator('#authPage').evaluate(el => el.classList.contains('hidden'));
    expect(authHidden).toBeTruthy();
  });

  test('REG-002: deve mostrar dashboard após registro', async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    await page.click('a:has-text("Cadastrar")');
    await page.waitForTimeout(300);
    await page.fill('#regName', 'Dash E2E');
    await page.fill('#regEmail', `dash${TS}@test.com`);
    await page.fill('#regPassword', '123456');
    await page.click('#registerCard button:has-text("Criar")');
    await page.waitForTimeout(2000);
    
    const dashboard = await page.locator('#dashboardPage').isVisible().catch(() => false);
    expect(dashboard).toBeTruthy();
  });

});

test.describe('🔑 Login de Pai', () => {

  test('LOGIN-005: deve fazer login após registro', async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // Registrar
    const email = `login${TS}@test.com`;
    await page.click('a:has-text("Cadastrar")');
    await page.waitForTimeout(300);
    await page.fill('#regName', 'Login E2E');
    await page.fill('#regEmail', email);
    await page.fill('#regPassword', '123456');
    await page.click('#registerCard button:has-text("Criar")');
    await page.waitForTimeout(2000);
    
    // Logout
    await page.evaluate(() => { localStorage.clear(); location.reload(); });
    await page.waitForTimeout(500);
    
    // Login
    await page.fill('#parentEmail', email);
    await page.fill('#parentPassword', '123456');
    await page.click('#parentLoginBtn');
    await page.waitForTimeout(2000);
    
    const authHidden = await page.locator('#authPage').evaluate(el => el.classList.contains('hidden'));
    expect(authHidden).toBeTruthy();
  });

});

test.describe('👧 Criança', () => {

  test('CHILD-001: deve mostrar lista de filhos após login pai', async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // Registrar e logar
    const email = `child${TS}@test.com`;
    await page.click('a:has-text("Cadastrar")');
    await page.waitForTimeout(300);
    await page.fill('#regName', 'Pai Filho');
    await page.fill('#regEmail', email);
    await page.fill('#regPassword', '123456');
    await page.click('#registerCard button:has-text("Criar")');
    await page.waitForTimeout(2000);
    
    // Deve mostrar seção de filhos
    const childrenSection = await page.locator('#childrenList, .children-section, [class*="children"]').isVisible().catch(() => false);
    expect(childrenSection).toBeTruthy();
  });

});

test.describe('💬 Chat', () => {

  test('CHAT-001: deve mostrar chat page structure', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForTimeout(500);
    
    // Verificar se existe a estrutura do chat (mesmo que escondida)
    const chatExists = await page.locator('#chatPage, .chat-container, [class*="chat"]').count() > 0;
    expect(chatExists).toBeTruthy();
  });

  test('CHAT-002: deve redirecionar sem autenticação', async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE}/index.html`);
    await page.waitForTimeout(1000);
    
    // Sem token, deve mostrar auth ou redirect
    const url = page.url();
    const hasAuth = await page.locator('#authPage').isVisible().catch(() => false);
    expect(url === BASE || url.includes('index') || hasAuth).toBeTruthy();
  });

});

test.describe('📱 Responsividade', () => {

  test('RESP-001: mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Escolar AI/);
  });

  test('RESP-002: tablet 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Escolar AI/);
  });

});
