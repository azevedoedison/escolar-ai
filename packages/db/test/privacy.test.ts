import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type pg from 'pg';
import { createTestDb, type TestDb } from './helpers';

// B-02: retenção por família, exportação, exclusão e trilha de auditoria.

let db: TestDb;
const uA = '00000000-0000-0000-0000-0000000000f1';
const uB = '00000000-0000-0000-0000-0000000000f2';
const year = new Date().getFullYear();
const fam = { A: '', B: '' };
const child = { A: '', B: '' };
const q = (s: string, p?: unknown[]) => db.admin.query(s, p);

async function asUserCommit<T>(u: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  await db.admin.query('begin');
  try {
    await db.admin.query(`set local role authenticated`);
    await db.admin.query(`select set_config('request.jwt.claim.sub', $1, true)`, [u]);
    const r = await fn(db.admin);
    await db.admin.query('commit');
    return r;
  } catch (e) {
    await db.admin.query('rollback');
    throw e;
  }
}

/** Conversa com uma mensagem da criança, `daysAgo` dias atrás. Devolve ids. */
async function seed(k: 'A' | 'B', daysAgo: number, alert?: { severity: string; status: string }) {
  const ts = `now() - interval '${daysAgo} days'`;
  const conv = (await q(`insert into conversation(child_id, title, started_at) values ($1,'t',${ts}) returning id`, [child[k]])).rows[0].id;
  const msg = (await q(`insert into message(conversation_id, role, content, created_at) values ($1,'child','oi',${ts}) returning id`, [conv])).rows[0].id;
  const ev = (await q(`insert into safety_event(message_id, layer, category, decision) values ($1,'input','x','allow') returning id`, [msg])).rows[0].id;
  if (alert) {
    await q(`insert into alert(family_id, child_id, safety_event_id, severity, status, created_at) values ($1,$2,$3,$4,$5,${ts})`, [fam[k], child[k], ev, alert.severity, alert.status]);
  }
  return { conv, msg, ev };
}
const count = async (table: string, where = 'true') => Number((await q(`select count(*) from ${table} where ${where}`)).rows[0].count);
const convs = async (k: 'A' | 'B') => Number((await q(`select count(*) from conversation where child_id = $1`, [child[k]])).rows[0].count);

beforeAll(async () => {
  db = await createTestDb();
  await q(`insert into auth.users(id, email) values ($1,'a@exemplo.com'), ($2,'b@exemplo.com')`, [uA, uB]);
  for (const [k, u] of [['A', uA], ['B', uB]] as const) {
    fam[k] = (await asUserCommit(u, (c) => c.query(`select public.register_guardian($1, true, 'v1') as id`, [`Resp ${k}`]))).rows[0].id;
    child[k] = (await asUserCommit(u, (c) => c.query(`select public.create_child('Filho',$1,'6º ano','raposa','1234') as id`, [year - 11]))).rows[0].id;
  }
});
afterAll(async () => {
  await db.close();
});

describe('retenção', () => {
  it('padrão de 90 dias para família nova', async () => {
    expect((await q(`select retention_days from family_settings where family_id = $1`, [fam.A])).rows[0].retention_days).toBe(90);
  });

  it('responsável escolhe de 30 a 365 e o valor persiste', async () => {
    await asUserCommit(uA, (c) => c.query(`select public.set_retention_days(30)`));
    expect((await q(`select retention_days from family_settings where family_id = $1`, [fam.A])).rows[0].retention_days).toBe(30);
    await asUserCommit(uA, (c) => c.query(`select public.set_retention_days(365)`));
    expect((await q(`select retention_days from family_settings where family_id = $1`, [fam.A])).rows[0].retention_days).toBe(365);
    await asUserCommit(uA, (c) => c.query(`select public.set_retention_days(90)`));
    expect((await q(`select 1 from audit_log where family_id = $1 and action = 'retention_changed'`, [fam.A])).rowCount).toBe(3);
  });

  it('rejeita valores fora da faixa, no RPC e no banco', async () => {
    for (const d of [29, 366, 0, -1]) {
      await expect(asUserCommit(uA, (c) => c.query(`select public.set_retention_days($1)`, [d]))).rejects.toThrow(/invalid_retention/);
    }
    await expect(q(`update family_settings set retention_days = 10 where family_id = $1`, [fam.A])).rejects.toThrow();
  });

  it('responsável não altera a retenção por update direto', async () => {
    await expect(asUserCommit(uA, (c) => c.query(`update family_settings set retention_days = 30 where family_id = $1`, [fam.A]))).rejects.toThrow(/permission denied/);
  });

  it('só um responsável de outra família não muda a retenção alheia', async () => {
    await asUserCommit(uB, (c) => c.query(`select public.set_retention_days(60)`));
    expect((await q(`select retention_days from family_settings where family_id = $1`, [fam.A])).rows[0].retention_days).toBe(90);
    await asUserCommit(uB, (c) => c.query(`select public.set_retention_days(90)`));
  });

  it('apaga conversa com mais de 90 dias e mantém a recente', async () => {
    const old = await seed('A', 100);
    const recent = await seed('A', 10);
    const n = (await q(`select public.purge_expired_conversations($1) as n`, [fam.A])).rows[0].n;
    expect(n).toBe(1);
    expect(await count('conversation', `id = '${old.conv}'`)).toBe(0);
    expect(await count('message', `id = '${old.msg}'`)).toBe(0);
    expect(await count('safety_event', `id = '${old.ev}'`)).toBe(0);
    expect(await count('conversation', `id = '${recent.conv}'`)).toBe(1);
    await q(`delete from conversation where child_id = $1`, [child.A]);
  });

  it('conversa antiga com mensagem recente continua', async () => {
    const s = await seed('A', 100);
    await q(`insert into message(conversation_id, role, content) values ($1,'child','de novo')`, [s.conv]);
    expect((await q(`select public.purge_expired_conversations($1) as n`, [fam.A])).rows[0].n).toBe(0);
    await q(`delete from conversation where child_id = $1`, [child.A]);
  });

  it('respeita a retenção escolhida pela família', async () => {
    await asUserCommit(uA, (c) => c.query(`select public.set_retention_days(30)`));
    await seed('A', 45);
    expect((await q(`select public.purge_expired_conversations($1) as n`, [fam.A])).rows[0].n).toBe(1);
    await asUserCommit(uA, (c) => c.query(`select public.set_retention_days(90)`));
  });

  it('a limpeza da família A não toca a família B, mesmo com B vencida', async () => {
    await seed('A', 200);
    const b = await seed('B', 200);
    await q(`select public.purge_expired_conversations($1)`, [fam.A]);
    expect(await convs('A')).toBe(0);
    expect(await count('conversation', `id = '${b.conv}'`)).toBe(1);
    await q(`delete from conversation where child_id = $1`, [child.B]);
  });

  it('a rotina geral usa a retenção de cada família', async () => {
    await asUserCommit(uB, (c) => c.query(`select public.set_retention_days(365)`));
    await seed('A', 100); // vencida (90)
    await seed('B', 100); // dentro (365)
    expect((await q(`select public.purge_expired_all() as n`)).rows[0].n).toBe(1);
    expect(await convs('A')).toBe(0);
    expect(await convs('B')).toBe(1);
    await q(`delete from conversation where child_id = $1`, [child.B]);
    await asUserCommit(uB, (c) => c.query(`select public.set_retention_days(90)`));
  });

  it('mantém conversa com alerta de crise não resolvido e apaga quando resolvido', async () => {
    const s = await seed('A', 200, { severity: 'crisis', status: 'seen' });
    expect((await q(`select public.purge_expired_conversations($1) as n`, [fam.A])).rows[0].n).toBe(0);
    expect(await count('conversation', `id = '${s.conv}'`)).toBe(1);
    expect(await count('alert', `family_id = '${fam.A}'`)).toBe(1);
    await q(`update alert set status = 'resolved' where family_id = $1`, [fam.A]);
    expect((await q(`select public.purge_expired_conversations($1) as n`, [fam.A])).rows[0].n).toBe(1);
    expect(await count('alert', `family_id = '${fam.A}'`)).toBe(0); // resolvido e vencido
  });

  it('alerta de gravidade menor não segura a conversa', async () => {
    await seed('A', 200, { severity: 'high', status: 'new' });
    expect((await q(`select public.purge_expired_conversations($1) as n`, [fam.A])).rows[0].n).toBe(1);
    await q(`delete from alert where family_id = $1`, [fam.A]);
  });

  it('registra a limpeza na auditoria', async () => {
    expect(await count('audit_log', `family_id = '${fam.A}' and action = 'retention_purge'`)).toBeGreaterThan(0);
  });

  it('responsável não executa a limpeza', async () => {
    await expect(asUserCommit(uA, (c) => c.query(`select public.purge_expired_conversations($1)`, [fam.A]))).rejects.toThrow(/permission denied/);
    await expect(asUserCommit(uA, (c) => c.query(`select public.purge_expired_all()`))).rejects.toThrow(/permission denied/);
  });
});

describe('direitos do titular', () => {
  it('exporta só a própria família e audita', async () => {
    await seed('A', 1);
    await seed('B', 1);
    const out = (await asUserCommit(uA, (c) => c.query(`select public.export_family_data() as d`))).rows[0].d;
    expect(out.children).toHaveLength(1);
    expect(out.children[0].nickname).toBe('Filho');
    expect(out.conversations).toHaveLength(1);
    expect(out.conversations[0].messages[0].content).toBe('oi');
    expect(out.conversations[0].messages[0].safety_events).toHaveLength(1);
    expect(out.guardians[0].consent_version).toBe('v1');
    expect(JSON.stringify(out)).not.toContain('pin_hash');
    expect(JSON.stringify(out)).not.toContain(fam.B);
    expect(await count('audit_log', `family_id = '${fam.A}' and action = 'data_exported'`)).toBe(1);
  });

  it('apaga uma conversa e audita; a de outra família é recusada', async () => {
    const mine = await seed('A', 1);
    const other = await seed('B', 1);
    await asUserCommit(uA, (c) => c.query(`select public.delete_conversation($1)`, [mine.conv]));
    expect(await count('conversation', `id = '${mine.conv}'`)).toBe(0);
    expect(await count('audit_log', `family_id = '${fam.A}' and action = 'conversation_deleted' and target = '${mine.conv}'`)).toBe(1);
    await expect(asUserCommit(uA, (c) => c.query(`select public.delete_conversation($1)`, [other.conv]))).rejects.toThrow(/conversation_not_found/);
    expect(await count('conversation', `id = '${other.conv}'`)).toBe(1);
  });

  it('apaga todas as conversas de um filho e não as de outra família', async () => {
    await seed('A', 1);
    await seed('A', 2);
    const n = (await asUserCommit(uA, (c) => c.query(`select public.delete_child_conversations($1) as n`, [child.A]))).rows[0].n;
    expect(n).toBeGreaterThanOrEqual(2);
    expect(await convs('A')).toBe(0);
    expect(await convs('B')).toBeGreaterThan(0);
    await expect(asUserCommit(uA, (c) => c.query(`select public.delete_child_conversations($1)`, [child.B]))).rejects.toThrow(/child_not_found/);
  });

  it('audita ver o histórico', async () => {
    await asUserCommit(uA, (c) => c.query(`select public.audit_view($1)`, [child.A]));
    expect(await count('audit_log', `family_id = '${fam.A}' and action = 'history_viewed' and target = '${child.A}'`)).toBe(1);
    await expect(asUserCommit(uA, (c) => c.query(`select public.audit_view($1)`, [child.B]))).rejects.toThrow(/child_not_found/);
  });

  it('excluir conta exige confirmação', async () => {
    await expect(asUserCommit(uA, (c) => c.query(`select public.delete_account(false)`))).rejects.toThrow(/confirmation_required/);
    expect(await count('family', `id = '${fam.A}'`)).toBe(1);
  });

  async function fullChild(k: 'A' | 'B', c: string) {
    const dev = (await q(`insert into device(child_id, platform) values ($1,'android') returning id`, [c])).rows[0].id;
    await q(`insert into pairing_code(child_id, code_hash, expires_at) values ($1,'h', now() + interval '1 day')`, [c]);
    const sess = (await q(`insert into child_session(device_id, child_id, token_hash, expires_at) values ($1,$2,'t' || gen_random_uuid(), now() + interval '1 day') returning id`, [dev, c])).rows[0].id;
    await seed(k, 1, { severity: 'crisis', status: 'new' });
    return { dev, sess };
  }
  const childRows = (c: string) => Promise.all(
    ['device', 'pairing_code', 'child_session', 'conversation', 'alert'].map((t) => count(t, `child_id = '${c}'`)),
  );

  it('excluir um filho apaga só o filho e deixa a família e o irmão', async () => {
    const sib = (await asUserCommit(uA, (c) => c.query(`select public.create_child('Irmão',$1,'3º ano','gato','4321') as id`, [year - 9]))).rows[0].id;
    await fullChild('A', child.A);
    await q(`insert into conversation(child_id, title) values ($1,'do irmão')`, [sib]);
    await expect(asUserCommit(uA, (c) => c.query(`select public.delete_child($1, false)`, [child.A]))).rejects.toThrow(/confirmation_required/);
    await asUserCommit(uA, (c) => c.query(`select public.delete_child($1, true)`, [child.A]));
    expect(await count('child', `id = '${child.A}'`)).toBe(0);
    expect(await childRows(child.A)).toEqual([0, 0, 0, 0, 0]);
    expect(await count('message', `conversation_id not in (select id from conversation)`)).toBe(0);
    expect(await count('safety_event', `message_id not in (select id from message)`)).toBe(0);
    expect(await count('family', `id = '${fam.A}'`)).toBe(1);
    expect(await count('guardian', `family_id = '${fam.A}'`)).toBe(1);
    expect(await count('child', `id = '${sib}'`)).toBe(1);
    expect(await count('conversation', `child_id = '${sib}'`)).toBe(1);
    expect(await count('audit_log', `family_id = '${fam.A}' and action = 'child_deleted' and target = '${child.A}'`)).toBe(1);
    // a outra família não é tocada e não se apaga filho alheio
    await expect(asUserCommit(uA, (c) => c.query(`select public.delete_child($1, true)`, [child.B]))).rejects.toThrow(/child_not_found/);
    expect(await count('child', `id = '${child.B}'`)).toBe(1);
    await asUserCommit(uA, (c) => c.query(`select public.delete_child($1, true)`, [sib]));
  });

  it('excluir conta exige confirmação', async () => {
    await expect(asUserCommit(uA, (c) => c.query(`select public.delete_account(false)`))).rejects.toThrow(/confirmation_required/);
    expect(await count('family', `id = '${fam.A}'`)).toBe(1);
  });

  it('responsável com filho vinculado é recusado e nada é apagado', async () => {
    await expect(asUserCommit(uB, (c) => c.query(`select public.delete_account(true)`))).rejects.toThrow(/children_linked/);
    expect(await count('family', `id = '${fam.B}'`)).toBe(1);
    expect(await count('child', `id = '${child.B}'`)).toBe(1);
    expect(await count('auth.users', `id = '${uB}'`)).toBe(1);
  });

  it('responsável sem filhos apaga a família inteira e nada da outra', async () => {
    // A ficou sem filhos no teste anterior.
    await q(`insert into audit_log(family_id, actor, action) values ($1,'x','y')`, [fam.A]);
    await asUserCommit(uA, (c) => c.query(`select public.delete_account(true)`));
    for (const [t, col] of [['family', 'id'], ['guardian', 'family_id'], ['child', 'family_id'], ['family_settings', 'family_id'], ['alert', 'family_id'], ['audit_log', 'family_id']] as [string, string][]) {
      expect(await count(t, `${col} = '${fam.A}'`), t).toBe(0);
    }
    expect(await count('auth.users', `id = '${uA}'`)).toBe(0);
    expect(await count('family', `id = '${fam.B}'`)).toBe(1);
    expect(await count('child', `id = '${child.B}'`)).toBe(1);
    expect(await count('auth.users', `id = '${uB}'`)).toBe(1);
  });
});
