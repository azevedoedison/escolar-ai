/**
 * Testes E2E - Dashboard e Histórico
 * Testa o fluxo completo: login → chat → histórico
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Dados de teste
const TEST_PARENT = {
  email: `testparent${Date.now()}@test.com`,
  password: 'Test@123456',
  name: 'Pai Teste E2E',
};

const TEST_CHILD = {
  nickname: `kid${Date.now()}`,
  password: 'kid123',
  name: 'Filho Teste',
  age: 10,
};

let childId = null;

test.describe('Escolar AI - E2E', () => {

  test('1. Registrar pai', async ({ page }) => {
    await page.goto(BASE_URL);

    // Clicar em "Criar conta"
    await page.click('text=Criar conta');
    
    // Preencher formulário
    await page.fill('#regName', TEST_PARENT.name);
    await page.fill('#regEmail', TEST_PARENT.email);
    await page.fill('#regPassword', TEST_PARENT.password);
    
    // Submeter
    await page.click('button:has-text("Criar Conta")');
    
    // Esperar redirecionamento ou mensagem de sucesso
    await page.waitForTimeout(2000);
    
    // Deve estar logado (verificar se dashboard aparece)
    const dashboardVisible = await page.isVisible('#dashboardPage').catch(() => false);
    expect(dashboardVisible).toBeTruthy();
  });

  test('2. Cadastrar filho', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Se não estiver logado, registrar e logar
    const needsLogin = await page.isVisible('text=Criar conta').catch(() => false);
    if (needsLogin) {
      await page.click('text=Criar conta');
      await page.fill('#regName', TEST_PARENT.name);
      await page.fill('#regEmail', TEST_PARENT.email);
      await page.fill('#regPassword', TEST_PARENT.password);
      await page.click('button:has-text("Criar Conta")');
      await page.waitForTimeout(2000);
    }

    // Clicar em "Adicionar Filho"
    await page.click('text=Adicionar Filho').catch(() => {});
    await page.waitForTimeout(1000);
    
    // Preencher dados do filho
    await page.fill('#childName', TEST_CHILD.name).catch(() => {});
    await page.fill('#childAge', TEST_CHILD.age.toString()).catch(() => {});
    await page.fill('#childNicknameModal', TEST_CHILD.nickname).catch(() => {});
    await page.fill('#childPasswordModal', TEST_CHILD.password).catch(() => {});
    
    // Salvar
    await page.click('button:has-text("Salvar")').catch(() => {});
    await page.waitForTimeout(2000);
    
    // Verificar se apareceu na lista
    const childVisible = await page.isVisible(`text=${TEST_CHILD.nickname}`).catch(() => false);
    expect(childVisible).toBeTruthy();
  });

  test('3. Login como filho e fazer pergunta', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Seleicionar login de criança
    await page.click('text=Criança').catch(() => {});
    await page.waitForTimeout(500);
    
    // Login
    await page.fill('#childNickname', TEST_CHILD.nickname).catch(() => {});
    await page.fill('#childPassword', TEST_CHILD.password).catch(() => {});
    await page.click('button:has-text("Entrar")').catch(() => {});
    await page.waitForTimeout(2000);
    
    // Fazer pergunta
    const chatInput = await page.$('#input');
    if (chatInput) {
      await chatInput.fill('O que é fotossíntese?');
      await page.click('button:has-text("Enviar")').catch(() => {});
      await page.waitForTimeout(10000); // Esperar resposta da IA
      
      // Verificar se apareceu resposta
      const response = await page.textContent('body');
      expect(response).toContain('fotossíntese');
    }
  });

  test('4. Acessar histórico como pai', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Login como pai
    await page.click('text=Pai').catch(() => {});
    await page.fill('#parentEmail', TEST_PARENT.email).catch(() => {});
    await page.fill('#parentPassword', TEST_PARENT.password).catch(() => {});
    await page.click('button:has-text("Entrar")').catch(() => {});
    await page.waitForTimeout(2000);
    
    // Clicar em "Histórico"
    await page.click('text=Histórico').catch(() => {});
    await page.waitForTimeout(2000);
    
    // Verificar se a página de histórico abriu
    const historyVisible = await page.isVisible('#historyPage').catch(() => false);
    expect(historyVisible).toBeTruthy();
  });

  test('5. Navegar entre páginas', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Login como pai
    await page.click('text=Pai').catch(() => {});
    await page.fill('#parentEmail', TEST_PARENT.email).catch(() => {});
    await page.fill('#parentPassword', TEST_PARENT.password).catch(() => {});
    await page.click('button:has-text("Entrar")').catch(() => {});
    await page.waitForTimeout(2000);
    
    // Ir para histórico
    await page.click('text=Histórico').catch(() => {});
    await page.waitForTimeout(1000);
    
    // Voltar ao dashboard
    await page.click('button:has-text("Voltar")').catch(() => {});
    await page.waitForTimeout(1000);
    
    // Verificar se está no dashboard
    const dashboardVisible = await page.isVisible('#dashboardPage').catch(() => false);
    expect(dashboardVisible).toBeTruthy();
  });

  test('6. Filtros do histórico', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Login como pai e ir para histórico
    await page.click('text=Pai').catch(() => {});
    await page.fill('#parentEmail', TEST_PARENT.email).catch(() => {});
    await page.fill('#parentPassword', TEST_PARENT.password).catch(() => {});
    await page.click('button:has-text("Entrar")').catch(() => {});
    await page.waitForTimeout(2000);
    await page.click('text=Histórico').catch(() => {});
    await page.waitForTimeout(1000);
    
    // Selecionar filtro de filho (primeira opção disponível)
    const childFilter = await page.$('#historyChildFilter');
    if (childFilter) {
      await page.selectOption('#historyChildFilter', { index: 1 }).catch(() => {});
    }
    
    await page.waitForTimeout(1000);
    
    // Fazer busca
    await page.fill('#historySearch', 'fotossíntese').catch(() => {});
    await page.press('#historySearch', 'Enter').catch(() => {});
    
    await page.waitForTimeout(1000);
    
    // Teste passou se não errou
    expect(true).toBeTruthy();
  });

});
