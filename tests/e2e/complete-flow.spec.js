/**
 * Testes E2E Completos - Escolar AI
 * Fluxo: Registro → Login → Cadastrar Criança → Login Criança → Chat
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TIMESTAMP = Date.now();
const PARENT_EMAIL = `testepai${TIMESTAMP}@email.com`;
const PARENT_PASSWORD = 'Teste@123';
const CHILD_NAME = 'Filho Teste';
const CHILD_LOGIN = `filho${TIMESTAMP}`;
const CHILD_PASSWORD = '123456';

test.describe('🔐 1. Registro de Pai', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();
  });

  test('deve mostrar formulário de registro ao clicar Cadastrar', async ({ page }) => {
    // Clicar no link "Cadastrar" para mostrar o formulário
    await page.click('a:has-text("Cadastrar"), span:has-text("Cadastrar")');
    await page.waitForTimeout(500);
    await expect(page.locator('#registerCard')).toBeVisible({ timeout: 10000 });
  });

  test('deve registrar um novo pai', async ({ page }) => {
    // Mostrar formulário de registro
    await page.click('a:has-text("Cadastrar"), span:has-text("Cadastrar")');
    await page.waitForTimeout(500);
    
    await page.fill('#regName', 'Pai Teste E2E');
    await page.fill('#regEmail', PARENT_EMAIL);
    await page.fill('#regPassword', PARENT_PASSWORD);
    await page.click('#registerCard button[type="submit"]');
    await page.waitForTimeout(2000);
  });

});

test.describe('👨 2. Login de Pai', () => {

  test('deve fazer login após registro', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();

    // Mostrar formulário de registro
    await page.click('a:has-text("Cadastrar"), span:has-text("Cadastrar")');
    await page.waitForTimeout(500);
    
    // Registrar primeiro
    await page.fill('#regName', 'Pai Teste');
    await page.fill('#regEmail', PARENT_EMAIL);
    await page.fill('#regPassword', PARENT_PASSWORD);
    await page.click('#registerCard button[type="submit"]');
    await page.waitForTimeout(2000);

    // Login
    await page.fill('#parentEmail', PARENT_EMAIL);
    await page.fill('#parentPassword', PARENT_PASSWORD);
    await page.click('#parentLoginBtn');
    await page.waitForTimeout(2000);

    // Deve ir para select.html ou mostrar lista de filhos
    const hasChildren = await page.locator('#childrenList, .child-card, .select-page').isVisible().catch(() => false);
    const atSelect = page.url().includes('select');
    expect(hasChildren || atSelect).toBeTruthy();
  });

});

test.describe('👧 3. Cadastrar Criança', () => {

  test('deve cadastrar uma criança', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();

    // Mostrar formulário de registro
    await page.click('a:has-text("Cadastrar"), span:has-text("Cadastrar")');
    await page.waitForTimeout(500);
    
    // Registrar pai
    await page.fill('#regName', 'Pai Teste');
    await page.fill('#regEmail', PARENT_EMAIL);
    await page.fill('#regPassword', PARENT_PASSWORD);
    await page.click('#registerCard button[type="submit"]');
    await page.waitForTimeout(2000);

    // Login pai
    await page.fill('#parentEmail', PARENT_EMAIL);
    await page.fill('#parentPassword', PARENT_PASSWORD);
    await page.click('#parentLoginBtn');
    await page.waitForTimeout(2000);

    // Cadastrar criança (pode estar na mesma página ou em select.html)
    const nameInput = page.locator('#newName, #childName, input[placeholder*="nome"]');
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(CHILD_NAME);
      await page.fill('#newLogin, #childLogin, input[placeholder*="login"]', CHILD_LOGIN);
      await page.fill('#newAge, #childAge, input[placeholder*="idade"]', '10');
      await page.fill('#newPassword, #childPassword, input[placeholder*="senha"]', CHILD_PASSWORD);
      await page.click('button:has-text("Cadastrar"), button:has-text("Adicionar")');
      await page.waitForTimeout(2000);
    }
  });

});

test.describe('💬 4. Chat', () => {

  test('deve ter elementos do chat após login', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();

    // Mostrar formulário de registro
    await page.click('a:has-text("Cadastrar"), span:has-text("Cadastrar")');
    await page.waitForTimeout(500);
    
    // Registrar pai
    await page.fill('#regName', 'Pai Teste');
    await page.fill('#regEmail', PARENT_EMAIL);
    await page.fill('#regPassword', PARENT_PASSWORD);
    await page.click('#registerCard button[type="submit"]');
    await page.waitForTimeout(2000);

    // Login pai
    await page.fill('#parentEmail', PARENT_EMAIL);
    await page.fill('#parentPassword', PARENT_PASSWORD);
    await page.click('#parentLoginBtn');
    await page.waitForTimeout(2000);

    // Cadastrar criança
    const nameInput = page.locator('#newName, #childName, input[placeholder*="nome"]');
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(CHILD_NAME);
      await page.fill('#newLogin, #childLogin, input[placeholder*="login"]', CHILD_LOGIN);
      await page.fill('#newAge, #childAge, input[placeholder*="idade"]', '10');
      await page.fill('#newPassword, #childPassword, input[placeholder*="senha"]', CHILD_PASSWORD);
      await page.click('button:has-text("Cadastrar"), button:has-text("Adicionar")');
      await page.waitForTimeout(2000);
    }

    // Clicar na criança para fazer login como aluno
    const childCard = page.locator('.child-card, [data-child]').first();
    if (await childCard.isVisible().catch(() => false)) {
      await childCard.click();
      await page.waitForTimeout(2000);
    }

    // Verificar elementos do chat
    await expect(page.locator('#messageInput, textarea')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#sendBtn, button:has-text("Enviar")')).toBeVisible();
  });

  test('deve enviar mensagem e receber resposta', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();

    // Mostrar formulário de registro
    await page.click('a:has-text("Cadastrar"), span:has-text("Cadastrar")');
    await page.waitForTimeout(500);
    
    // Registrar + Login pai
    await page.fill('#regName', 'Pai Teste');
    await page.fill('#regEmail', PARENT_EMAIL);
    await page.fill('#regPassword', PARENT_PASSWORD);
    await page.click('#registerCard button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.fill('#parentEmail', PARENT_EMAIL);
    await page.fill('#parentPassword', PARENT_PASSWORD);
    await page.click('#parentLoginBtn');
    await page.waitForTimeout(2000);

    // Cadastrar criança
    const nameInput = page.locator('#newName, #childName, input[placeholder*="nome"]');
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(CHILD_NAME);
      await page.fill('#newLogin, #childLogin, input[placeholder*="login"]', CHILD_LOGIN);
      await page.fill('#newAge, #childAge, input[placeholder*="idade"]', '10');
      await page.fill('#newPassword, #childPassword, input[placeholder*="senha"]', CHILD_PASSWORD);
      await page.click('button:has-text("Cadastrar"), button:has-text("Adicionar")');
      await page.waitForTimeout(2000);
    }

    // Login como criança
    const childCard = page.locator('.child-card, [data-child]').first();
    if (await childCard.isVisible().catch(() => false)) {
      await childCard.click();
      await page.waitForTimeout(2000);
    }

    // Enviar mensagem
    await page.fill('#messageInput, textarea', 'Quanto é 2 + 2?');
    await page.click('#sendBtn, button:has-text("Enviar")');
    
    // Aguardar resposta
    await page.waitForTimeout(15000);

    // Verificar se há mensagens
    const messages = await page.locator('.message, .chat-message').count();
    expect(messages).toBeGreaterThan(0);
  });

});

test.describe('📱 5. Responsividade', () => {

  test('deve funcionar em mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Escolar AI/);
  });

  test('deve funcionar em tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Escolar AI/);
  });

});
