// Leituras do painel dos pais. Tudo é filtrado pela família do responsável: quem chama já passou por
// `verifyGuardianMode`, e o `familyId` vem do banco, nunca do corpo ou da URL.

import type pg from 'pg';
import type { TimelineDecision, TimelineFilters, TimelineItem, TimelinePage } from '@tata/shared';

export interface GuardianChild {
  id: string;
  nickname: string;
  grade: string | null;
  avatar: string | null;
}

export interface GuardianStore {
  listChildren(familyId: string): Promise<GuardianChild[]>;
  /** null se o filho não existe ou é de outra família (a rota responde 404). */
  timeline(
    familyId: string,
    childId: string,
    opts: { filters: TimelineFilters; limit: number; cursor: string | null },
  ): Promise<TimelinePage | null>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CURSOR = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z)\|([0-9a-f-]{36})$/i;

export const isUuid = (s: string) => UUID.test(s);

export const encodeCursor = (ts: string, id: string) => Buffer.from(`${ts}|${id}`).toString('base64url');
export function decodeCursor(c: string): { ts: string; id: string } | null {
  const m = CURSOR.exec(Buffer.from(c, 'base64url').toString('utf8'));
  return m && UUID.test(m[2]!) ? { ts: m[1]!, id: m[2]! } : null;
}

/** Escapa % _ \ para o ILIKE tratar a busca como texto simples. */
export const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

// Um item = uma pergunta da criança + a resposta seguinte da Tatá (a primeira antes da próxima pergunta).
// Decisão e categoria vêm do evento de segurança mais grave do par; em empate, input antes de output.
const TIMELINE_SQL = `
with ex as (
  select q.id, q.conversation_id, cv.title, q.content as question, a.content as answer, q.created_at,
         to_char(q.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as ts,
         coalesce(ev.decision, 'allow') as decision, coalesce(ev.category, 'nenhuma') as category, al.status as alert
    from public.message q
    join public.conversation cv on cv.id = q.conversation_id
    left join lateral (
      select m.id, m.content from public.message m
       where m.conversation_id = q.conversation_id and m.role = 'tata'
         and (m.created_at, m.id) > (q.created_at, q.id)
         and not exists (
           select 1 from public.message c2
            where c2.conversation_id = q.conversation_id and c2.role = 'child'
              and (c2.created_at, c2.id) > (q.created_at, q.id) and (c2.created_at, c2.id) < (m.created_at, m.id))
       order by m.created_at, m.id limit 1
    ) a on true
    left join lateral (
      select se.decision, se.category from public.safety_event se
       where se.message_id in (q.id, a.id)
       order by case se.decision when 'crisis' then 3 when 'block' then 2 when 'redirect' then 1 else 0 end desc,
                case se.layer when 'input' then 0 when 'output' then 1 else 2 end, se.id
       limit 1
    ) ev on true
    left join lateral (
      select x.status from public.alert x join public.safety_event se2 on se2.id = x.safety_event_id
       where se2.message_id in (q.id, a.id)
       order by case x.status when 'new' then 0 when 'seen' then 1 else 2 end
       limit 1
    ) al on true
   where q.role = 'child' and cv.child_id = $1
)
select * from ex
 where ($2::date is null or created_at >= ($2::date)::timestamp at time zone 'America/Sao_Paulo')
   and ($3::date is null or created_at < (($3::date + 1)::timestamp at time zone 'America/Sao_Paulo'))
   and (not $4::boolean or decision <> 'allow')
   and (not $5::boolean or alert is not null)
   and ($6::text is null or question ilike $6 or coalesce(answer, '') ilike $6)
   and ($7::text is null or (created_at, id) < ($7::timestamptz, $8::uuid))
 order by created_at desc, id desc
 limit $9`;

export function createGuardianStore(pool: pg.Pool): GuardianStore {
  return {
    async listChildren(familyId) {
      const { rows } = await pool.query(
        `select id, nickname, grade, avatar from public.child where family_id = $1 and active order by nickname, id`,
        [familyId],
      );
      return rows.map((r) => ({ id: r.id, nickname: r.nickname, grade: r.grade, avatar: r.avatar }));
    },
    async timeline(familyId, childId, { filters, limit, cursor }) {
      if (!isUuid(childId)) return null;
      const own = await pool.query(`select 1 from public.child where id = $1 and family_id = $2`, [childId, familyId]);
      if (own.rowCount === 0) return null;
      const cur = cursor ? decodeCursor(cursor) : null;
      if (cursor && !cur) return { items: [], nextCursor: null };
      const { rows } = await pool.query(TIMELINE_SQL, [
        childId,
        filters.from ?? null,
        filters.to ?? null,
        filters.blocked ?? false,
        filters.alerts ?? false,
        filters.q ? likePattern(filters.q) : null,
        cur?.ts ?? null,
        cur?.id ?? null,
        limit + 1,
      ]);
      const page = rows.slice(0, limit);
      const items: TimelineItem[] = page.map((r) => ({
        id: r.id,
        conversationId: r.conversation_id,
        conversationTitle: r.title,
        question: r.question,
        answer: r.answer,
        createdAt: new Date(r.created_at).toISOString(),
        decision: r.decision as TimelineDecision,
        category: r.category,
        alert: r.alert,
      }));
      const last = page[page.length - 1];
      return { items, nextCursor: rows.length > limit && last ? encodeCursor(last.ts, last.id) : null };
    },
  };
}
