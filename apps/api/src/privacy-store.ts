import type pg from 'pg';

export type Outcome = 'ok' | 'not_found';

/** Direitos do titular e retenção (B-02). Toda regra mora no banco (funções api_*); a família vem do responsável, nunca do cliente. */
export interface PrivacyStore {
  getRetention(guardianId: string): Promise<number | null>;
  setRetention(guardianId: string, days: number): Promise<void>;
  exportFamily(guardianId: string): Promise<unknown>;
  deleteConversation(guardianId: string, conversationId: string): Promise<Outcome>;
  /** Devolve quantas conversas foram apagadas, ou null se o filho não é da família. */
  deleteChildConversations(guardianId: string, childId: string): Promise<number | null>;
  deleteChild(guardianId: string, childId: string): Promise<Outcome>;
}

/** O banco recusa com errcode 42501 e estas mensagens quando o alvo não é da família do responsável. */
const NOT_FOUND = /conversation_not_found|child_not_found/;
const isNotFound = (e: unknown) => e instanceof Error && NOT_FOUND.test(e.message);

export function createPrivacyStore(pool: Pick<pg.Pool, 'query'>): PrivacyStore {
  const q = async (sql: string, args: unknown[]) => (await pool.query(sql, args)).rows;
  return {
    async getRetention(guardianId) {
      const [r] = await q('select public.api_get_retention($1) as d', [guardianId]);
      return r?.d ?? null;
    },
    async setRetention(guardianId, days) {
      await q('select public.api_set_retention($1,$2)', [guardianId, days]);
    },
    async exportFamily(guardianId) {
      const [r] = await q('select public.api_export_family($1) as d', [guardianId]);
      return r.d;
    },
    async deleteConversation(guardianId, conversationId) {
      try {
        await q('select public.api_delete_conversation($1,$2)', [guardianId, conversationId]);
        return 'ok';
      } catch (e) {
        if (isNotFound(e)) return 'not_found';
        throw e;
      }
    },
    async deleteChildConversations(guardianId, childId) {
      try {
        const [r] = await q('select public.api_delete_child_conversations($1,$2) as n', [guardianId, childId]);
        return Number(r.n);
      } catch (e) {
        if (isNotFound(e)) return null;
        throw e;
      }
    },
    async deleteChild(guardianId, childId) {
      try {
        await q('select public.api_delete_child($1,$2,true)', [guardianId, childId]);
        return 'ok';
      } catch (e) {
        if (isNotFound(e)) return 'not_found';
        throw e;
      }
    },
  };
}
