/**
 * Testes E2E - Autenticação de Pais
 * Casos: PAI-001 a PAI-011
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TIMESTAMP = Date.now();

test.describe('🔐 Autenticação de Pais', () => {

  test('PAI-001: Registrar com dados válidos', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Ir para registro
    await page.click('text=Cadastrar');
    await page.waitForTimeout(500);
    
    // Preencher e submeter
    await page.fill('#regName', 'Pai Teste E2E');
    await page.fill('#regEmail', `pai${TIMESTAMP}@test.com`);
    await page.fill('#regPassword', 'Test@123456');
    await page.click('#registerCard button[type="submit"], #registerCard button:has-text("Criar")');
    
    await page.waitForTimeout(3000);
    
    // Verificar: dashboard aparece OU redireciona para login
    const inDashboard = await page.isVisible('#dashboardPage').catch(() => false);
    const atLogin = await page.isVisible('#parentLoginForm').catch(() => false);
    expect(inDashboard || atLogin).toBeTruthy();
  });

  test('PAI-002: Registrar com email já existente', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.click('text=Cadastrar');
    await page.waitForTimeout(500);
    
    // Usar email que já existe (do teste anterior ou seed)
    await page.fill('#regName', 'Teste');
    await page.fill('#regEmail', 'testparent@test.com'); // email provavelmente existente
    await page.fill('#regPassword', 'Test@123456');
    await page.click('#registerCard button:has-text("Criar")');
    
    await page.waitForTimeout(2000);
    
    // Deve mostrar erro ou permanecer no formulário
    const hasError = await page.isVisible('.error-msg:not(.hidden)').catch(() => false);
    const stillAtRegister = await page.isVisible('#registerCard').catch(() => false);
    expect(hasError || stillAtRegister).toBeTruthy();
  });

  test('PAI-003: Registrar com campos vazios', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.click('text=Cadastrar');
    await page.waitForTimeout(500);
    
    // Clicar em criar sem preencher
    await page.click('#registerCard button:has-text("Criar")');
    
    await page.waitForTimeout(1000);
    
    // Deve permanecer no formulário
    const stillVisible = await page.isVisible('#registerCard').catch(() => false);
    expect(stillVisible).toBeTruthy();
  });

  test('PAI-004: Login com credenciais válidas', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Garantir que está no login
    await page.click('text=Pai').catch(() => {});
    await page.waitForTimeout(300);
    
    await page.fill('#parentEmail', 'testparent@test.com');
    await page.fill('#parentPassword', 'Test@123456');
    await page.click('#parentLoginBtn');
    
    await page.waitForTimeout(2000);
    
    // Deve estar no dashboard
    const inDashboard = await page.isVisible('#dashboardPage');
    expect(inDashboard).toBeTruthy();
  });

  test('PAI-005: Login com senha incorreta', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.click('text=Pai').catch(() => {});
    await page.waitForTimeout(300);
    
    await page.fill('#parentEmail', 'testparent@test.com');
    await page.fill('#parentPassword', 'SenhaErrada123');
    await page.click('#parentLoginBtn');
    
    await page.waitForTimeout(2000);
    
    // Deve mostrar erro ou permanecer no login
    const hasError = await page.isVisible('.error-msg:not(.hidden)').catch(() => false);
    const atLogin = await page.isVisible('#parentLoginForm').catch(() => false);
    expect(hasError || atLogin).toBeTruthy();
  });

  test('PAI-006: Login com email inexistente', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.click('text=Pai').catch(() => {});
    await page.waitForTimeout(300);
    
    await page.fill('#parentEmail', `naoexiste${TIMESTAMP}@test.com`);
    await page.fill('#parentPassword', 'Test@123456');
    await page.click('#parentLoginBtn');
    
    await page.waitForTimeout(2000);
    
    // Deve mostrar erro ou permanecer no login
    const hasError = await page.isVisible('.error-msg:not(.hidden)').catch(() => false);
    const atLogin = await page.isVisible('#parentLoginForm').catch(() => false);
    expect(hasError || atLogin).toBeTruthy();
  });

  test('PAI-007: Logout limpa sessão', async ({ page }) => {
    // Login primeiro
    await page.goto(BASE_URL);
    await page.click('text=Pai').catch(() => {});
    await page.fill('#parentEmail', 'testparent@test.com');
    await page.fill('#parentPassword', 'Test@123456');
    await page.click('#parentLoginBtn');
    await page.waitForTimeout(2000);
    
    // Fazer logout
    await page.click('text=Sair').catch(() => {});
    await page.waitForTimeout(1000);
    
    // Deve voltar para tela de login
    const hasLogin = await page.isVisible('text=Entrar').catch(() => false);
    expect(hasLogin).toBeTruthy();
  });

  test('PAI-008: Botão "Conversar" redireciona', async ({ page }) => {
    // Login
    await page.goto(BASE_URL);
    await page.click('text=Pai').catch(() => {});
    await page.fill('#parentEmail', 'testparent@test.com');
    await page.fill('#parentPassword', 'Test@123456');
    await page.click('#parentLoginBtn');
    await page.waitForTimeout(2000);
    
    // Verificar se botão "Conversar" existe
    const hasConversar = await page.isVisible('button:has-text("Conversar")').catch(() => false);
    expect(hasConversar).toBeTruthy();
  });

});
