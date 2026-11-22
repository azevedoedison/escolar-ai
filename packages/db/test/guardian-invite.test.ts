import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type pg from 'pg';
import { createTestDb, type TestDb } from './helpers';

// B-03: convite de segundo responsável por e-mail.

let db: TestDb;
const uA = '00000000-0000-0000-0000-0000000000a1'; // dono da família A
const uB = '00000000-0000-0000-0000-0000000000b1'; // dono da família B
const uC = '00000000-0000-0000-0000-0000000000c1'; // convidado (e-mail c@exemplo.com)
const uD = '00000000-0000-0000-0000-0000000000d1'; // outro adulto sem convite
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

const invite = async (u: string, email: string) =>
  (await asUserCommit(u, (c) => c.query(`select public.create_guardian_invite($1) as id`, [email]))).rows[0].id as string;
const accept = (u: string, token: string, consent = true) =>
  asUserCommit(u, (c) => c.query(`select public.accept_guardian_invite($1, 'Convidado', $2, 'v1') as id`, [token, consent]));
/** O token vai só para o e-mail: aqui lemos da fila, como a API faria. */
const tokenOf = async (inviteId: string) =>
  (await q(`select payload->>'token' as t from email_outbox where payload->>'invite_id' = $1`, [inviteId])).rows[0]?.t as string;
const actions = async (family: string) =>
  (await q(`select action from audit_log where family_id = $1 order by created_at, id`, [family])).rows.map((r) => r.action as string);

beforeAll(async () => {
  db = await createTestDb();
  await q(
    `insert into auth.users(id, email) values ($1,'a@exemplo.com'), ($2,'b@exemplo.com'), ($3,'C@Exemplo.com'), ($4,'d@exemplo.com')`,
    [uA, uB, uC, uD],
  );
  for (const [k, u] of [['A', uA], ['B', uB]] as const) {
    fam[k] = (await asUserCommit(u, (c) => c.query(`select public.register_guardian($1, true, 'v1') as id`, [`Resp ${k}`]))).rows[0].id;
    child[k] = (await asUserCommit(u, (c) => c.query(`select public.create_child('Filho',$1,'6º ano','raposa','1234') as id`, [year - 11]))).rows[0].id;
  }
});
afterAll(async () => {
  await db.close();
});

describe('convite de segundo responsável', () => {
  it('cria o convite, enfileira o e-mail com o token e guarda só o hash', async () => {
    const id = await invite(uA, '  C@Exemplo.com ');
    const row = (await q(`select * from guardian_invite where id = $1`, [id])).rows[0];
    expect(row.email).toBe('c@exemplo.com');
    expect(row.family_id).toBe(fam.A);
    const token = await tokenOf(id);
    expect(token).toMatch(/^[0-9a-f]{48}$/);
    expect(row.token_hash).not.toContain(token);
    const mail = (await q(`select to_email, kind, payload from email_outbox where payload->>'invite_id' = $1`, [id])).rows[0];
    expect(mail.to_email).toBe('c@exemplo.com');
    expect(mail.kind).toBe('guardian_invite');
    expect(mail.payload.inviter_name).toBe('Resp A');
    expect(await actions(fam.A)).toContain('invite_created');
    // 7 dias de validade
    const days = Number((await q(`select extract(epoch from expires_at - created_at)/86400 as d from guardian_invite where id = $1`, [id])).rows[0].d);
    expect(Math.round(days)).toBe(7);
  });

  it('convite pendente do mesmo e-mail é recusado', async () => {
    await expect(invite(uA, 'c@exemplo.com')).rejects.toThrow(/invite_pending/);
  });

  it('o convidado aceita e entra na MESMA família como member, sem criar outra', async () => {
    const id = (await q(`select id from guardian_invite where family_id = $1`, [fam.A])).rows[0].id;
    const familiesBefore = Number((await q(`select count(*) from family`)).rows[0].count);
    const r = await accept(uC, await tokenOf(id));
    expect(r.rows[0].id).toBe(fam.A);
    expect(Number((await q(`select count(*) from family`)).rows[0].count)).toBe(familiesBefore);
    const g = (await q(`select family_id, role, email, consent_version from guardian where auth_user_id = $1`, [uC])).rows[0];
    expect(g).toMatchObject({ family_id: fam.A, role: 'member', email: 'c@exemplo.com', consent_version: 'v1' });
    expect(await actions(fam.A)).toEqual(expect.arrayContaining(['invite_accepted', 'consent_accepted']));
  });

  it('o convidado vê os dados da família A e nenhum da família B', async () => {
    const { famIds, kids, guardians, audit } = await db.asUser(uC, async (c) => ({
      famIds: (await c.query(`select id from family`)).rows.map((r) => r.id),
      kids: (await c.query(`select id from child`)).rows.map((r) => r.id),
      guardians: (await c.query(`select auth_user_id from guardian`)).rows.length,
      audit: (await c.query(`select family_id from audit_log`)).rows.map((r) => r.family_id),
    }));
    expect(famIds).toEqual([fam.A]);
    expect(kids).toEqual([child.A]);
    expect(guardians).toBe(2);
    expect(new Set(audit)).toEqual(new Set([fam.A]));
  });

  it('o convite aceito não pode ser usado de novo', async () => {
    const id = (await q(`select id from guardian_invite where family_id = $1`, [fam.A])).rows[0].id;
    await expect(accept(uC, await tokenOf(id))).rejects.toThrow(/invite_used|already_registered/);
  });

  it('o member não convida, não revoga e não lista convites', async () => {
    await expect(invite(uC, 'x@exemplo.com')).rejects.toThrow(/owner_required/);
    await expect(asUserCommit(uC, (c) => c.query(`select * from public.list_guardian_invites()`))).rejects.toThrow(/owner_required/);
    await expect(asUserCommit(uC, (c) => c.query(`select public.revoke_guardian_invite(gen_random_uuid())`))).rejects.toThrow(/owner_required/);
  });

  it('o member não exclui a conta da família', async () => {
    await expect(asUserCommit(uC, (c) => c.query(`select public.delete_account(true)`))).rejects.toThrow(/owner_required/);
  });

  it('a família tem no máximo 2 responsáveis', async () => {
    await expect(invite(uA, 'd@exemplo.com')).rejects.toThrow(/family_full/);
  });

  it('e-mail de quem já é responsável da família é recusado', async () => {
    await expect(invite(uA, 'A@exemplo.com')).rejects.toThrow(/already_guardian/);
  });

  it('e-mail inválido é recusado', async () => {
    for (const e of ['', 'sem-arroba', 'a@b', 'a b@c.com']) {
      await expect(invite(uB, e)).rejects.toThrow(/invalid_email/);
    }
  });

  it('ninguém acessa as tabelas de convite e fila direto', async () => {
    await expect(asUserCommit(uB, (c) => c.query(`select * from guardian_invite`))).rejects.toThrow(/permission denied/);
    await expect(asUserCommit(uB, (c) => c.query(`select * from email_outbox`))).rejects.toThrow(/permission denied/);
    await expect(db.asAnon((c) => c.query(`select public.create_guardian_invite('x@exemplo.com')`))).rejects.toThrow();
  });
});

describe('convite: revogar, expirar e proteger', () => {
  it('revogado não é aceito, some da fila e fica na auditoria', async () => {
    const id = await invite(uB, 'c@exemplo.com'); // uC já é responsável de A; só o aceite falharia
    const token = await tokenOf(id);
    await asUserCommit(uB, (c) => c.query(`select public.revoke_guardian_invite($1)`, [id]));
    expect(await tokenOf(id)).toBeUndefined(); // e-mail não enviado deixa a fila
    await expect(accept(uC, token)).rejects.toThrow(/invite_revoked/);
    expect(await actions(fam.B)).toEqual(expect.arrayContaining(['invite_created', 'invite_revoked']));
    const list = await asUserCommit(uB, (c) => c.query(`select * from public.list_guardian_invites()`));
    expect(list.rows[0]).toMatchObject({ id, status: 'revoked' });
  });

  it('revogar convite de outra família é recusado', async () => {
    const id = await invite(uB, 'd@exemplo.com');
    await expect(asUserCommit(uA, (c) => c.query(`select public.revoke_guardian_invite($1)`, [id]))).rejects.toThrow(/invite_not_found/);
    await asUserCommit(uB, (c) => c.query(`select public.revoke_guardian_invite($1)`, [id]));
  });

  it('expirado não é aceito e aparece como expired', async () => {
    const id = await invite(uB, 'd@exemplo.com');
    const token = await tokenOf(id);
    await q(`update guardian_invite set expires_at = now() - interval '1 minute' where id = $1`, [id]);
    await expect(accept(uD, token)).rejects.toThrow(/invite_expired/);
    const list = await asUserCommit(uB, (c) => c.query(`select * from public.list_guardian_invites() where id = $1`, [id]));
    expect(list.rows[0].status).toBe('expired');
    // convite vencido não prende o e-mail nem a vaga: dá para convidar de novo
    const again = await invite(uB, 'd@exemplo.com');
    expect(again).not.toBe(id);
  });

  it('só o dono do e-mail aceita: outro usuário com o token recebe invite_invalid', async () => {
    const id = (await q(`select id from guardian_invite where family_id = $1 and accepted_at is null and revoked_at is null and expires_at > now()`, [fam.B])).rows[0].id;
    const token = await tokenOf(id);
    await q(`insert into auth.users(id, email) values ('00000000-0000-0000-0000-0000000000e1', 'e@exemplo.com')`);
    await expect(accept('00000000-0000-0000-0000-0000000000e1', token)).rejects.toThrow(/invite_invalid/);
  });

  it('token errado é recusado e exige consentimento', async () => {
    await expect(accept(uD, 'ffff')).rejects.toThrow(/invite_invalid/);
    const id = (await q(`select id from guardian_invite where family_id = $1 and accepted_at is null and revoked_at is null and expires_at > now()`, [fam.B])).rows[0].id;
    await expect(accept(uD, await tokenOf(id), false)).rejects.toThrow(/consent_required/);
  });

  it('quem já é responsável de outra família não entra em segunda família', async () => {
    const id = await invite(uB, 'a@exemplo.com').catch(() => null); // família B está cheia (convite pendente de d@)
    expect(id).toBeNull();
    await q(`update guardian_invite set revoked_at = now() where family_id = $1 and accepted_at is null`, [fam.B]);
    const id2 = await invite(uB, 'a@exemplo.com');
    await expect(accept(uA, await tokenOf(id2))).rejects.toThrow(/already_registered/);
  });

  it('aceite de convite da família B não dá acesso aos dados da A', async () => {
    await q(`update guardian_invite set revoked_at = now() where family_id = $1 and accepted_at is null`, [fam.B]);
    const id = await invite(uB, 'd@exemplo.com');
    await accept(uD, await tokenOf(id));
    const seen = await db.asUser(uD, async (c) => (await c.query(`select id from child`)).rows.map((r) => r.id));
    expect(seen).toEqual([child.B]);
  });
});
