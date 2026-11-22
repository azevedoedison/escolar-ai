// Rotas da criança: /chat, /conversations. Regras em openspec/changes/chat-crianca.

import { Hono, type Context } from 'hono';
import {
  classifyInput,
  classifyOutput,
  createRateLimiter,
  preFilter,
  safeResponse,
  type ModelClient,
  type SafetyDecision,
} from '@tata/safety';
import { verifyToken } from './auth';
import type { Generator } from './anthropic';
import { buildSystemPrompt } from './prompt';
import type { ChatStore, ChildContext, SafetyEventInput } from './store';

export interface ChatDeps {
  store: ChatStore;
  generator: Generator;
  classifier: ModelClient;
  tokenSecret: string;
  now?: () => number;
}

const HISTORY_LIMIT = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const owns = (store: ChatStore, childId: string, id: string) => UUID.test(id) && store.ownsConversation(childId, id);

export function createChatRoutes(deps: ChatDeps) {
  const routes = new Hono();
  const limiter = createRateLimiter({ perMinute: 10, perDay: 200, now: deps.now });

  /** Só token de criança, de uma criança ativa da família do token. */
  async function authChild(c: Context): Promise<ChildContext | null> {
    const header = c.req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const claims = token ? verifyToken(token, deps.tokenSecret, deps.now?.()) : null;
    if (!claims || claims.role !== 'child') return null;
    const child = await deps.store.getChild(claims.sub);
    return child && child.familyId === claims.fam ? child : null;
  }

  routes.post('/chat', async (c) => {
    const child = await authChild(c);
    if (!child) return c.json({ error: 'nao_autorizado' }, 401);

    // O app envia só a mensagem nova e o id da conversa; qualquer outro campo é ignorado.
    const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
    const message = typeof body?.message === 'string' ? body.message : null;
    const requestedId = typeof body?.conversationId === 'string' ? body.conversationId : null;
    if (message === null) return c.json({ error: 'mensagem_invalida' }, 400);
    if (requestedId && !(await owns(deps.store, child.id, requestedId))) {
      return c.json({ error: 'conversa_nao_encontrada' }, 404);
    }

    const text = message.trim();
    const conversationId = requestedId ?? (await deps.store.createConversation(child.id, text.slice(0, 60) || 'Conversa'));
    const history = requestedId ? await deps.store.history(conversationId, HISTORY_LIMIT) : [];
    const childMessageId = await deps.store.addMessage(conversationId, 'child', text);

    const events: (Omit<SafetyEventInput, 'messageId'> & { target: 'child' | 'tata' })[] = [];
    const record = (target: 'child' | 'tata', layer: SafetyEventInput['layer'], category: string, decision: SafetyDecision, t0: number) =>
      events.push({ target, layer, category, decision, latencyMs: Date.now() - t0 });

    let answer: string;
    let decision: SafetyDecision = 'allow';
    run: {
      let t0 = Date.now();
      const pre = preFilter(text);
      if (pre.decision === 'allow') {
        const limited = limiter.check(child.id);
        if (limited) {
          record('child', 'prefilter', limited.category, limited.decision, t0);
          decision = limited.decision;
          answer = safeResponse({ decision: limited.decision as Exclude<SafetyDecision, 'allow'>, category: limited.category });
          break run;
        }
      }
      if (pre.decision !== 'allow') {
        record('child', 'prefilter', pre.category, pre.decision, t0);
        decision = pre.decision;
        answer = safeResponse({ decision: pre.decision, category: pre.category });
        break run;
      }

      t0 = Date.now();
      const input = await classifyInput({ question: text, childAge: child.age }, deps.classifier);
      record('child', 'input', input.category, input.decision, t0);
      if (input.decision !== 'allow') {
        decision = input.decision;
        answer = safeResponse({ decision: input.decision, category: input.category });
        break run;
      }

      let generated: string;
      try {
        generated = await deps.generator.generate(
          buildSystemPrompt({
            age: child.age,
            grade: child.grade,
            homeworkMode: child.homeworkMode,
            inputCategory: input.category,
          }),
          [
            ...history.map((m) => ({ role: m.role === 'child' ? ('user' as const) : ('assistant' as const), content: m.content })),
            { role: 'user', content: text },
          ],
        );
      } catch {
        decision = 'block';
        answer = safeResponse({ decision: 'block', category: 'classificador_indisponivel' });
        break run;
      }

      t0 = Date.now();
      const out = await classifyOutput({ question: text, answer: generated, childAge: child.age }, deps.classifier);
      record('tata', 'output', out.category, out.decision, t0);
      if (out.decision === 'allow') {
        answer = generated;
      } else {
        decision = out.decision;
        answer = safeResponse({ decision: out.decision, category: out.category });
      }
    }

    const tataMessageId = await deps.store.addMessage(conversationId, 'tata', answer);
    for (const { target, ...e } of events) {
      await deps.store.addSafetyEvent({ ...e, messageId: target === 'child' ? childMessageId : tataMessageId });
    }
    return c.json({ conversationId, message: { id: tataMessageId, role: 'tata', content: answer }, decision });
  });

  routes.get('/conversations', async (c) => {
    const child = await authChild(c);
    if (!child) return c.json({ error: 'nao_autorizado' }, 401);
    return c.json({ conversations: await deps.store.listConversations(child.id) });
  });

  routes.get('/conversations/:id', async (c) => {
    const child = await authChild(c);
    if (!child) return c.json({ error: 'nao_autorizado' }, 401);
    const id = c.req.param('id');
    if (!(await owns(deps.store, child.id, id))) return c.json({ error: 'conversa_nao_encontrada' }, 404);
    return c.json({ conversationId: id, messages: await deps.store.history(id, 500) });
  });

  return routes;
}
