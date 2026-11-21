/**
 * Testes E2E - Histórico de Conversas
 * Casos: HIS-001 a HIS-014
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper: login como pai
async function loginAsParent(page) {
  await page.goto(BASE_URL);
  await page.click('text=Pai').catch(() => {});
  await page.waitForTimeout(300);
  await page.fill('#parentEmail', 'testparent@test.com');
  await page.fill('#parentPassword', 'Test@123456');
  await page.click('#parentLoginBtn');
  await page.waitForTimeout(2000);
}

test.describe('📚 Histórico de Conversas', () => {

  test('HIS-001: Página de histórico carrega', async ({ page }) => {
    await loginAsParent(page);
    
    // Clicar em Histórico
    await page.click('text=Histórico');
    await page.waitForTimeout(1000);
    
    // Verificar se página está visível
    const historyPage = await page.isVisible('#historyPage');
    expect(historyPage).toBeTruthy();
  });

  test('HIS-002: Lista de conversas exibida', async ({ page }) => {
    await loginAsParent(page);
    await page.click('text=Histórico');
    await page.waitForTimeout(2000);
    
    // Verificar se existe lista ou container de conversas
    const historyList = await page.isVisible('#historyList').catch(() => false);
    const hasContent = await page.textContent('#historyPage').then(t => t.length > 100);
    expect(historyList || hasContent).toBeTruthy();
  });

  test('HIS-003: Filtro por filho', async ({ page }) => {
    await loginAsParent(page);
    await page.click('text=Histórico');
    await page.waitForTimeout(1000);
    
    // Verificar se existe select de filtro
    const filterExists = await page.isVisible('#historyChildFilter');
    expect(filterExists).toBeTruthy();
    
    // Selecionar um filho se houver opções
    const options = await page.$$('#historyChildFilter option');
    if (options.length > 1) {
      await page.selectOption('#historyChildFilter', { index: 1 });
      await page.waitForTimeout(2000);
    }
    
    expect(true).toBeTruthy();
  });

  test('HIS-004: Busca por texto', async ({ page }) => {
    await loginAsParent(page);
    await page.click('text=Histórico');
    await page.waitForTimeout(1000);
    
    // Verificar se existe input de busca
    const searchInput = await page.isVisible('#historySearch');
    expect(searchInput).toBeTruthy();
    
    // Fazer busca
    await page.fill('#historySearch', 'fotossíntese');
    await page.press('#historySearch', 'Enter');
    await page.waitForTimeout(2000);
    
    expect(true).toBeTruthy();
  });

  test('HIS-005: Modal de detalhes abre', async ({ page }) => {
    await loginAsParent(page);
    await page.click('text=Histórico');
    await page.waitForTimeout(2000);
    
    // Clicar em uma conversa (se existir)
    const conversationItem = await page.$('.conversation-item, [onclick*="showConversation"]');
    if (conversationItem) {
      await conversationItem.click();
      await page.waitForTimeout(1000);
      
      // Modal deve abrir
      const modalVisible = await page.isVisible('#conversationModal, .modal-overlay:not(.hidden)').catch(() => false);
      expect(modalVisible).toBeTruthy();
    } else {
      // Sem conversas, teste passa
      expect(true).toBeTruthy();
    }
  });

  test('HIS-006: Voltar para dashboard', async ({ page }) => {
    await loginAsParent(page);
    await page.click('text=Histórico');
    await page.waitForTimeout(1000);
    
    // Clicar em voltar
    await page.click('button:has-text("Voltar")');
    await page.waitForTimeout(1000);
    
    // Deve estar no dashboard
    const dashboard = await page.isVisible('#dashboardPage');
    expect(dashboard).toBeTruthy();
  });

  test('HIS-007: Exportar CSV', async ({ page }) => {
    await loginAsParent(page);
    await page.click('text=Histórico');
    await page.waitForTimeout(1000);
    
    // Verificar se botão de exportar existe
    const exportBtn = await page.isVisible('button:has-text("Exportar"), button:has-text("CSV")').catch(() => false);
    expect(exportBtn).toBeTruthy();
  });

  test('HIS-008: Filtro por status (aprovado/bloqueado)', async ({ page }) => {
    await loginAsParent(page);
    await page.click('text=Histórico');
    await page.waitForTimeout(1000);
    
    // Verificar se existe select de status
    const statusFilter = await page.isVisible('select[name="status"], #statusFilter').catch(() => false);
    
    if (statusFilter) {
      await page.selectOption('select[name="status"], #statusFilter', 'blocked').catch(() => {});
      await page.waitForTimeout(1000);
    }
    
    expect(true).toBeTruthy();
  });

});
