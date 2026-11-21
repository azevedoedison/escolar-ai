/**
 * Testes que reproduzem os defeitos da auditoria (docs/tata-ia/05-auditoria-e-reestruturacao.md).
 * Estado esperado: FALHAM no código atual; passam depois de cada correção.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, prisma, registerParent, createChild, seedConversation, loginParentUI } from './helpers.js';

test.describe('S1 · chat exige token da criança', () => {
  test('mensagem sem token não grava conversa de outra criança', async ({ request }) => {
    const pai = await registerParent(request, 'b');
    const crianca = await createChild(request, pai, 'b');
    const res = await request.post(`${BASE_URL}/api/chat`, {
      data: { message: 'oi', childId: crianca.id, mode: 'study' },
    });
    expect(res.status()).toBe(401);
    const count = await prisma.conversation.count({ where: { childId: crianca.id } });
    expect(count).toBe(0);
  });
});

test.describe('S2 · histórico do pai', () => {
  test('pai lê conversas do próprio filho (200)', async ({ request }) => {
    const pai = await registerParent(request, 'a');
    const crianca = await createChild(request, pai, 'a');
    await seedConversation(crianca.id, { input: 'Quem descobriu o Brasil?' });
    const res = await request.get(`${BASE_URL}/api/conversations/${crianca.id}`, {
      headers: { authorization: `Bearer ${pai.token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.conversations.length).toBe(1);
  });

  test('pai não lê conversas de filho de outra família (404)', async ({ request }) => {
    const paiA = await registerParent(request, 'a');
    const paiB = await registerParent(request, 'b');
    const criancaB = await createChild(request, paiB, 'b');
    await seedConversation(criancaB.id, { input: 'segredo da família B' });
    const res = await request.get(`${BASE_URL}/api/conversations/${criancaB.id}`, {
      headers: { authorization: `Bearer ${paiA.token}` },
    });
    expect(res.status()).toBe(404);
  });

  test('pai não abre detalhe de conversa de outra família (404)', async ({ request }) => {
    const paiA = await registerParent(request, 'a');
    const paiB = await registerParent(request, 'b');
    const criancaB = await createChild(request, paiB, 'b');
    const conv = await seedConversation(criancaB.id, { input: 'segredo da família B' });
    const res = await request.get(`${BASE_URL}/api/conversations/detail/${conv.id}`, {
      headers: { authorization: `Bearer ${paiA.token}` },
    });
    expect(res.status()).toBe(404);
  });
});

test.describe('S3 · limpeza só apaga dados da própria família', () => {
  test('cleanup do pai A não apaga conversa antiga do filho do pai B', async ({ request }) => {
    const paiA = await registerParent(request, 'a');
    const paiB = await registerParent(request, 'b');
    await createChild(request, paiA, 'a');
    const criancaB = await createChild(request, paiB, 'b');
    const antiga = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    const conv = await seedConversation(criancaB.id, { input: 'conversa antiga', createdAt: antiga });
    await request.delete(`${BASE_URL}/api/conversations/cleanup?days=30`, {
      headers: { authorization: `Bearer ${paiA.token}` },
    });
    const ainda = await prisma.conversation.findUnique({ where: { id: conv.id } });
    expect(ainda).not.toBeNull();
  });
});

test.describe('F1 · painel de histórico usa rotas que existem', () => {
  test('histórico carrega a lista e nenhuma chamada /api devolve HTML', async ({ page, request }) => {
    const pai = await registerParent(request, 'f1');
    const crianca = await createChild(request, pai, 'f1');
    await seedConversation(crianca.id, { input: 'Quanto é 7 vezes 8?', output: '56' });
    const respostasHtml = [];
    page.on('response', r => {
      if (r.url().includes('/api/') && (r.headers()['content-type'] || '').includes('text/html')) {
        respostasHtml.push(r.url());
      }
    });
    await loginParentUI(page, pai);
    await expect(page.locator('#childrenList')).toContainText('Criança f1', { timeout: 15000 });
    await page.click('button:has-text("Histórico")');
    await expect(page.locator('#historyList')).toContainText('mensagens', { timeout: 15000 });
    expect(respostasHtml).toEqual([]);
  });
});

test.describe('S5 · servidor não sobe sem segredos', () => {
  test('boot sem JWT_SECRET falha', async () => {
    const { spawnSync } = await import('node:child_process');
    const env = { ...process.env };
    delete env.JWT_SECRET;
    delete env.JWT_REFRESH_SECRET;
    env.PORT = '3999';
    // cwd fora do repositório para o dotenv não carregar o .env de teste
    const os = await import('node:os');
    const r = spawnSync('node', ['/home/user/escolar-ai/src/web/server.js'], {
      env, cwd: os.tmpdir(), timeout: 8000, encoding: 'utf8',
    });
    // se o servidor subir, o processo fica vivo até o timeout (signal) e o teste falha
    expect(r.signal).toBeNull();
    expect(r.status).not.toBe(0);
  });
});
