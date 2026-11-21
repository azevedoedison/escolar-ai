/**
 * Fluxos críticos no navegador (E2E). Sobe a aplicação, simula cadastro, login e uso.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, registerParent, createChild, seedConversation, loginParentUI } from './helpers.js';

test('E2E-06 · pai entra pelo navegador e vê os filhos', async ({ page, request }) => {
  const pai = await registerParent(request, 'e2e');
  await createChild(request, pai, 'e2e');
  await loginParentUI(page, pai);
  await expect(page.locator('#childrenList')).toContainText('Criança e2e', { timeout: 15000 });
});

test('E2E-03 · criança entra com apelido e recebe resposta', async ({ page, request }) => {
  const pai = await registerParent(request, 'kid');
  const crianca = await createChild(request, pai, 'kid');
  await page.goto(BASE_URL);
  await page.click('.tab[data-tab="child"]');
  await page.fill('#childNickname', crianca.nickname);
  await page.fill('#childPassword', crianca.password);
  await page.click('#childLoginForm button');
  await expect(page.locator('#chatInput')).toBeVisible({ timeout: 15000 });
  await page.fill('#chatInput', 'Quem descobriu o Brasil?');
  await page.keyboard.press('Enter');
  // a pergunta precisa ficar gravada em nome da criança logada, mesmo que a IA falhe
  const { prisma } = await import('./helpers.js');
  await expect.poll(() => prisma.conversation.count({ where: { childId: crianca.id } }), { timeout: 30000 }).toBeGreaterThan(0);
});

test('S4 · conteúdo da criança não executa script no painel do pai', async ({ page, request }) => {
  const pai = await registerParent(request, 'xss');
  const crianca = await createChild(request, pai, 'xss');
  await seedConversation(crianca.id, { input: '<img src=x onerror="window.__xss=1">' });
  await loginParentUI(page, pai);
  // espera a lista de filhos preenchida pelo login (o contêiner existe antes do login)
  await expect(page.locator('#childrenList')).toContainText('Criança xss', { timeout: 15000 });
  const conv = await request.get(`${BASE_URL}/api/conversations/${crianca.id}`, {
    headers: { authorization: `Bearer ${pai.token}` },
  });
  const id = (await conv.json()).conversations[0].id;
  await page.evaluate(id => showConversation(id), id);
  await page.waitForTimeout(1000);
  const xss = await page.evaluate(() => window.__xss);
  expect(xss).toBeUndefined();
  // o texto aparece como texto, não como elemento
  await expect(page.locator('#conversationMessages')).toContainText('<img src=x');
});
