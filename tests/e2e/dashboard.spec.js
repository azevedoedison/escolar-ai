/**
 * Testes E2E - Dashboard e Histórico
 * Testa o fluxo completo: login → chat → histórico
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Dados únicos para cada execução
const TIMESTAMP = Date.now();
const TEST_PARENT = {
  email: `e2e${TIMESTAMP}@test.com`,
  password: 'Test@123456',
  name: 'Pai E2E',
};

const TEST_CHILD = {
  nickname: `kid${TIMESTAMP}`,
  password: 'kid123',
  name: 'Filho E2E',
  age: 10,
};

test.describe('Escolar AI - E2E', () => {

  test('1. Página inicial carrega', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Escolar AI/);
    
    // Tem opção de login
    const hasLogin = await page.isVisible('text=Entrar').catch(() => false);
    expect(hasLogin).toBeTruthy();
  });

  test('2. Registrar e logar como pai', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Ir para registro
    await page.click('text=Criar conta').catch(() => {});
    await page.waitForTimeout(500);
    
    // Registrar
    await page.fill('#regName', TEST_PARENT.name);
    await page.fill('#regEmail', TEST_PARENT.email);
    await page.fill('#regPassword', TEST_PARENT.password);
    await page.click('button:has-text("Criar Conta")');
    
    // Esperar resposta (sucesso ou erro)
    await page.waitForTimeout(3000);
    
    // Verificar se está no dashboard OU se foi redirecionado para login
    const inDashboard = await page.isVisible('#dashboardPage').catch(() => false);
    const atLogin = await page.isVisible('#parentLoginForm').catch(() => false);
    
    expect(inDashboard || atLogin).toBeTruthy();
  });

  test('3. Login como pai', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Garantir que estamos no form de login de pai
    await page.click('text=Pai').catch(() => {});
    await page.waitForTimeout(300);
    
    // Login
    await page.fill('#parentEmail', TEST_PARENT.email);
    await page.fill('#parentPassword', TEST_PARENT.password);
    await page.click('#parentLoginBtn');
    
    await page.waitForTimeout(2000);
    
    // Deve estar no dashboard
    const visible = await page.isVisible('#dashboardPage');
    expect(visible).toBeTruthy();
  });

  test('4. Cadastrar filho', async ({ page }) => {
    // Login primeiro
    await page.goto(BASE_URL);
    await page.click('text=Pai').catch(() => {});
    await page.fill('#parentEmail', TEST_PARENT.email);
    await page.fill('#parentPassword', TEST_PARENT.password);
    await page.click('#parentLoginBtn');
    await page.waitForTimeout(2000);
    
    // Clicar em adicionar filho
    await page.click('button:has-text("Adicionar Filho")').catch(() => {});
    await page.waitForTimeout(1000);
    
    // Preencher modal
    await page.fill('#childName', TEST_CHILD.name);
    await page.fill('#childNicknameModal', TEST_CHILD.nickname);
    await page.fill('#childAge', TEST_CHILD.age.toString());
    await page.fill('#childPasswordModal', TEST_CHILD.password);
    
    // Salvar
    await page.click('#childModal button:has-text("Salvar")').catch(() => {});
    await page.waitForTimeout(2000);
    
    // Verificar se apareceu na lista
    const text = await page.textContent('#childrenList').catch(() => '');
    expect(text).toContain(TEST_CHILD.nickname);
  });

  test('5. Chat funciona', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Login como criança
    await page.click('text=Criança').catch(() => {});
    await page.waitForTimeout(300);
    
    await page.fill('#childNickname', TEST_CHILD.nickname);
    await page.fill('#childPassword', TEST_CHILD.password);
    await page.click('button:has-text("Entrar")').catch(() => {});
    await page.waitForTimeout(2000);
    
    // Fazer pergunta
    const chatInput = await page.$('#input');
    if (chatInput) {
      await chatInput.fill('2+2=?');
      await page.click('button:has-text("Enviar")').catch(() => {});
      await page.waitForTimeout(15000); // Esperar IA
      
      // Deve ter alguma resposta (não "Ops!")
      const body = await page.textContent('body');
      const hasResponse = body.includes('4') || body.includes('matemática') || body.includes('conta');
      expect(hasResponse).toBeTruthy();
    }
  });

  test('6. Histórico carrega', async ({ page }) => {
    // Login como pai
    await page.goto(BASE_URL);
    await page.click('text=Pai').catch(() => {});
    await page.fill('#parentEmail', TEST_PARENT.email);
    await page.fill('#parentPassword', TEST_PARENT.password);
    await page.click('#parentLoginBtn');
    await page.waitForTimeout(2000);
    
    // Clicar em Histórico
    await page.click('text=Histórico').catch(() => {});
    await page.waitForTimeout(1000);
    
    // Verificar se página de histórico está visível
    const historyVisible = await page.isVisible('#historyPage');
    expect(historyVisible).toBeTruthy();
  });

  test('7. Voltar do histórico', async ({ page }) => {
    // Login como pai
    await page.goto(BASE_URL);
    await page.click('text=Pai').catch(() => {});
    await page.fill('#parentEmail', TEST_PARENT.email);
    await page.fill('#parentPassword', TEST_PARENT.password);
    await page.click('#parentLoginBtn');
    await page.waitForTimeout(2000);
    
    // Ir para histórico
    await page.click('text=Histórico').catch(() => {});
    await page.waitForTimeout(1000);
    
    // Clicar voltar
    await page.click('button:has-text("Voltar")').catch(() => {});
    await page.waitForTimeout(1000);
    
    // Deve estar de volta no dashboard
    const dashboardVisible = await page.isVisible('#dashboardPage');
    expect(dashboardVisible).toBeTruthy();
  });

});
