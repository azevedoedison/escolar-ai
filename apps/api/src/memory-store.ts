// Armazenamento em memória, só para testes das rotas.

import { randomUUID } from 'node:crypto';
import type { ChatStore, ChildContext, ConversationSummary, SafetyEventInput, StoredMessage } from './store';

export function createMemoryStore(children: ChildContext[]) {
  const convs: (ConversationSummary & { childId: string })[] = [];
  const msgs: (StoredMessage & { conversationId: string })[] = [];
  const events: SafetyEventInput[] = [];
  let tick = 0;
  const stamp = () => new Date(Date.UTC(2026, 10, 22, 12, 0, tick++)).toISOString();

  const store: ChatStore = {
    async getChild(id) {
      return children.find((c) => c.id === id) ?? null;
    },
    async createConversation(childId, title) {
      const id = randomUUID();
      convs.push({ id, childId, title, startedAt: stamp() });
      return id;
    },
    async ownsConversation(childId, id) {
      return convs.some((c) => c.id === id && c.childId === childId);
    },
    async addMessage(conversationId, role, content) {
      const id = randomUUID();
      msgs.push({ id, conversationId, role, content, createdAt: stamp() });
      return id;
    },
    async addSafetyEvent(e) {
      events.push(e);
    },
    async history(conversationId, limit) {
      return msgs
        .filter((m) => m.conversationId === conversationId)
        .slice(-limit)
        .map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt }));
    },
    async listConversations(childId) {
      return convs
        .filter((c) => c.childId === childId)
        .map((c) => ({ id: c.id, title: c.title, startedAt: c.startedAt }))
        .reverse();
    },
  };
  return { store, convs, msgs, events };
}
