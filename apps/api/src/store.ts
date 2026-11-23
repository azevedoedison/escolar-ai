// Acesso ao histórico. O app nunca fala com o banco: tudo passa por aqui.

import type pg from 'pg';

export interface ChildContext {
  id: string;
  familyId: string;
  age: number;
  grade: string | null;
  homeworkMode: boolean;
}

export interface StoredMessage {
  id: string;
  role: 'child' | 'tata';
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  startedAt: string;
}

export interface SafetyEventInput {
  messageId: string;
  layer: 'prefilter' | 'input' | 'output';
  category: string;
  decision: 'allow' | 'care' | 'redirect' | 'block' | 'crisis';
  intent?: string | null;
  risk?: string | null;
  model?: string | null;
  latencyMs?: number;
}

export interface ChatStore {
  /** Criança ativa; null se não existir. */
  getChild(childId: string): Promise<ChildContext | null>;
  createConversation(childId: string, title: string): Promise<string>;
  /** true se a conversa existe e é da criança. */
  ownsConversation(childId: string, conversationId: string): Promise<boolean>;
  addMessage(conversationId: string, role: 'child' | 'tata', content: string): Promise<string>;
  addSafetyEvent(e: SafetyEventInput): Promise<void>;
  history(conversationId: string, limit: number): Promise<StoredMessage[]>;
  /** Mais recente primeiro. */
  listConversations(childId: string): Promise<ConversationSummary[]>;
}

const iso = (d: Date | string) => new Date(d).toISOString();

export function createPgStore(pool: pg.Pool): ChatStore {
  return {
    async getChild(childId) {
      const { rows } = await pool.query(
        `select c.id, c.family_id, c.birth_year, c.grade, coalesce(s.homework_mode, true) as homework_mode
           from public.child c
           left join public.family_settings s on s.family_id = c.family_id
          where c.id = $1 and c.active`,
        [childId],
      );
      const r = rows[0];
      if (!r) return null;
      return {
        id: r.id,
        familyId: r.family_id,
        age: new Date().getFullYear() - r.birth_year,
        grade: r.grade,
        homeworkMode: r.homework_mode,
      };
    },
    async createConversation(childId, title) {
      const { rows } = await pool.query(
        `insert into public.conversation(child_id, title) values ($1, $2) returning id`,
        [childId, title],
      );
      return rows[0].id;
    },
    async ownsConversation(childId, conversationId) {
      const { rowCount } = await pool.query(
        `select 1 from public.conversation where id = $1 and child_id = $2`,
        [conversationId, childId],
      );
      return (rowCount ?? 0) > 0;
    },
    async addMessage(conversationId, role, content) {
      const { rows } = await pool.query(
        `insert into public.message(conversation_id, role, content) values ($1, $2, $3) returning id`,
        [conversationId, role, content],
      );
      return rows[0].id;
    },
    async addSafetyEvent(e) {
      await pool.query(
        `insert into public.safety_event(message_id, layer, category, intent, risk, decision, model, latency_ms)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [e.messageId, e.layer, e.category, e.intent ?? null, e.risk ?? null, e.decision, e.model ?? null, e.latencyMs ?? null],
      );
    },
    async history(conversationId, limit) {
      const { rows } = await pool.query(
        `select id, role, content, created_at from (
           select id, role, content, created_at from public.message
            where conversation_id = $1 order by created_at desc, id desc limit $2
         ) t order by created_at asc, id asc`,
        [conversationId, limit],
      );
      return rows.map((r) => ({ id: r.id, role: r.role, content: r.content, createdAt: iso(r.created_at) }));
    },
    async listConversations(childId) {
      const { rows } = await pool.query(
        `select id, title, started_at from public.conversation
          where child_id = $1 order by started_at desc, id desc`,
        [childId],
      );
      return rows.map((r) => ({ id: r.id, title: r.title, startedAt: iso(r.started_at) }));
    },
  };
}
