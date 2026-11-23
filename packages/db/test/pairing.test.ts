import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Client } from 'pg';
import { createTestDb, type TestDb } from './helpers';

let db: TestDb;
const uA = '00000000-0000-0000-0000-0000000000e1';
const uB = '00000000-0000-0000-0000-0000000000e2';
const year = new Date().getFullYear();
let childA: string;
let childB: string;

async function commitAs<T>(u: string, fn: (c: Client) => Promise<T>): Promise<T> {
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

const newCode = async (u: string, child: string): Promise<string> =>
  commitAs(u, async (c) => (await c.query(`select code from public.create_pairing_code($1)`, [child])).rows[0].code);

const redeem = async (code: string, origin = 'ip-1') =>
  (await db.admin.query(`select * from public.redeem_pairing_code($1,'android',$2,'Tablet')`, [code, origin])).rows[0];

const login = async (devToken: string, id: string | null, secret: string) =>
  (await db.admin.query(`select * from public.child_login($1,$2,$3)`, [devToken, id, secret])).rows[0];

async function pairedDevice(u = uA, child = childA) {
  const r = await redeem(await newCode(u, child), `ip-${Math.random()}`);
  return r as { device_id: string; device_token: string; child_id: string };
}

beforeAll(async () => {
  db = await createTestDb();
  await db.admin.query(
    `insert into auth.users(id, email, encrypted_password) values
       ($1,'resp.a@exemplo.com', crypt('senhaDoPai123', gen_salt('bf'))),
       ($2,'resp.b@exemplo.com', crypt('senhaDaMae123', gen_salt('bf')))`,
    [uA, uB],
  );
  for (const u of [uA, uB]) await commitAs(u, (c) => c.query(`select public.register_guardian('Resp', true, 'v1')`));
  childA = await commitAs(uA, async (c) => (await c.query(`select public.create_child('Tati',$1,'6º ano','raposa','123456') as id`, [year - 11])).rows[0].id);
  childB = await commitAs(uB, async (c) => (await c.query(`select public.create_child('Beto',$1,'5º ano','gato','654321') as id`, [year - 10])).rows[0].id);
});
beforeEach(async () => {
  await db.admin.query('delete from attempt_counter');
});
afterAll(async () => {
  await db.close();
});

describe('pareamento', () => {
  it('gera código de 6 dígitos guardado só como hash e pareia o aparelho', async () => {
    const code = await newCode(uA, childA);
    expect(code).toMatch(/^[0-9]{6}$/);
    const stored = (await db.admin.query(`select code_hash from pairing_code where child_id=$1 and used_at is null`, [childA])).rows[0];
    expect(stored.code_hash).not.toContain(code);
    const r = await redeem(code);
    expect(r).toMatchObject({ status: 'ok', child_id: childA });
    const dev = (await db.admin.query(`select child_id, platform, token_hash from device where id=$1`, [r.device_id])).rows[0];
    expect(dev).toMatchObject({ child_id: childA, platform: 'android' });
    expect(dev.token_hash).not.toBe(r.device_token);
  });

  it('código vale uma vez só', async () => {
    const code = await newCode(uA, childA);
    expect((await redeem(code)).status).toBe('ok');
    expect((await redeem(code)).status).toBe('invalid');
  });

  it('código expirado é recusado', async () => {
    const code = await newCode(uA, childA);
    await db.admin.query(`update pairing_code set expires_at = now() - interval '1 second' where child_id=$1 and used_at is null`, [childA]);
    expect((await redeem(code)).status).toBe('invalid');
  });

  it('gerar novo código invalida o anterior do mesmo filho', async () => {
    const first = await newCode(uA, childA);
    await newCode(uA, childA);
    expect((await redeem(first)).status).toBe('invalid');
  });

  it('responsável não gera código para filho de outra família', async () => {
    await expect(newCode(uA, childB)).rejects.toThrow(/child_not_found/);
  });

  it('bloqueia a origem após 10 códigos errados, mesmo com o código certo depois', async () => {
    const code = await newCode(uA, childA);
    for (let i = 0; i < 10; i++) expect((await redeem('000000', 'ip-brute')).status).toBe('invalid');
    expect((await redeem(code, 'ip-brute')).status).toBe('locked');
    expect((await redeem(code, 'outro-ip')).status).toBe('ok');
  });
});

describe('login da criança', () => {
  it('entra com o PIN e a sessão é válida', async () => {
    const d = await pairedDevice();
    const r = await login(d.device_token, null, '123456');
    expect(r.status).toBe('ok');
    const v = await db.admin.query(`select * from public.verify_child_session($1)`, [r.session_token]);
    expect(v.rows[0]).toMatchObject({ child_id: childA, device_id: d.device_id });
  });

  it('PIN errado é recusado e não abre sessão', async () => {
    const d = await pairedDevice();
    expect((await login(d.device_token, null, '999999')).status).toBe('invalid');
  });

  it('entra com e-mail e senha definidos pelo responsável', async () => {
    await commitAs(uA, (c) => c.query(`select public.set_child_credentials($1,'Tati@Exemplo.com','minhasenha1')`, [childA]));
    const hash = (await db.admin.query(`select password_hash from child where id=$1`, [childA])).rows[0].password_hash;
    expect(hash).toMatch(/^\$2[aby]\$/);
    const d = await pairedDevice();
    expect((await login(d.device_token, 'tati@exemplo.com', 'minhasenha1')).status).toBe('ok');
    expect((await login(d.device_token, 'tati@exemplo.com', 'errada123')).status).toBe('invalid');
    expect((await login(d.device_token, 'outra@exemplo.com', 'minhasenha1')).status).toBe('invalid');
  });

  it('valida e-mail e senha ao definir credenciais; e-mail único', async () => {
    await expect(commitAs(uA, (c) => c.query(`select public.set_child_credentials($1,'x','minhasenha1')`, [childA]))).rejects.toThrow(/invalid_email/);
    await expect(commitAs(uA, (c) => c.query(`select public.set_child_credentials($1,'a@b.com','curta')`, [childA]))).rejects.toThrow(/invalid_password/);
    await expect(commitAs(uB, (c) => c.query(`select public.set_child_credentials($1,'tati@exemplo.com','minhasenha1')`, [childB]))).rejects.toThrow(/email_in_use/);
    await expect(commitAs(uB, (c) => c.query(`select public.set_child_credentials($1,'a@b.com','minhasenha1')`, [childA]))).rejects.toThrow(/child_not_found/);
  });

  it('6 erros em 5 minutos bloqueiam, inclusive com o PIN certo, e o bloqueio fica no banco', async () => {
    const d = await pairedDevice();
    for (let i = 0; i < 6; i++) expect((await login(d.device_token, null, '000000')).status).toBe('invalid');
    expect((await login(d.device_token, null, '123456')).status).toBe('locked');
    const row = (await db.admin.query(`select locked_until from attempt_counter where scope='child' and key=$1`, [childA])).rows[0];
    expect(new Date(row.locked_until).getTime()).toBeGreaterThan(Date.now());
    // passado o prazo, volta a funcionar
    await db.admin.query(`update attempt_counter set locked_until = now() - interval '1 second' where scope='child' and key=$1`, [childA]);
    expect((await login(d.device_token, null, '123456')).status).toBe('ok');
  });

  it('token de dispositivo inválido não entra', async () => {
    expect((await login('lixo', null, '123456')).status).toBe('revoked');
  });

  it('sessão vencida e logout deixam de valer', async () => {
    const d = await pairedDevice();
    const s = (await login(d.device_token, null, '123456')).session_token;
    await db.admin.query(`update child_session set expires_at = now() - interval '1 second' where device_id=$1`, [d.device_id]);
    expect((await db.admin.query(`select * from public.verify_child_session($1)`, [s])).rowCount).toBe(0);
    const s2 = (await login(d.device_token, null, '123456')).session_token;
    await db.admin.query(`select public.child_logout($1)`, [s2]);
    expect((await db.admin.query(`select * from public.verify_child_session($1)`, [s2])).rowCount).toBe(0);
  });
});

describe('modo Responsável', () => {
  it('exige e-mail e senha de um responsável da mesma família', async () => {
    const d = await pairedDevice();
    const s = (await login(d.device_token, null, '123456')).session_token;
    const enter = async (e: string, p: string) =>
      (await db.admin.query(`select * from public.guardian_mode_enter($1,$2,$3)`, [s, e, p])).rows[0];
    expect((await enter('resp.a@exemplo.com', 'errada')).status).toBe('invalid');
    expect((await enter('resp.b@exemplo.com', 'senhaDaMae123')).status).toBe('invalid'); // outra família
    const ok = await enter('RESP.A@exemplo.com', 'senhaDoPai123');
    expect(ok.status).toBe('ok');
    expect((await db.admin.query(`select * from public.verify_guardian_mode($1)`, [ok.mode_token])).rowCount).toBe(1);
    await db.admin.query(`select public.guardian_mode_exit($1)`, [ok.mode_token]);
    expect((await db.admin.query(`select * from public.verify_guardian_mode($1)`, [ok.mode_token])).rowCount).toBe(0);
  });

  it('5 senhas erradas bloqueiam o modo Responsável', async () => {
    const d = await pairedDevice();
    const s = (await login(d.device_token, null, '123456')).session_token;
    for (let i = 0; i < 5; i++) {
      expect((await db.admin.query(`select * from public.guardian_mode_enter($1,'resp.a@exemplo.com','x')`, [s])).rows[0].status).toBe('invalid');
    }
    expect((await db.admin.query(`select * from public.guardian_mode_enter($1,'resp.a@exemplo.com','senhaDoPai123')`, [s])).rows[0].status).toBe('locked');
  });

  it('sem sessão da criança válida não entra', async () => {
    expect((await db.admin.query(`select * from public.guardian_mode_enter('lixo','resp.a@exemplo.com','senhaDoPai123')`)).rows[0].status).toBe('unauthorized');
  });
});

describe('login direto do responsável', () => {
  const lg = async (e: string, p: string) =>
    (await db.admin.query(`select * from public.guardian_login($1,$2)`, [e, p])).rows[0];

  it('entra com e-mail e senha, guarda só o hash, e sair revoga', async () => {
    const ok = await lg('RESP.A@exemplo.com', 'senhaDoPai123');
    expect(ok.status).toBe('ok');
    const stored = (await db.admin.query(`select token_hash from guardian_session`)).rows.map((r) => r.token_hash);
    expect(stored).not.toContain(ok.token);
    const v = (await db.admin.query(`select * from public.verify_guardian_session($1)`, [ok.token])).rows[0];
    const fam = (await db.admin.query(`select family_id from guardian where auth_user_id = $1`, [uA])).rows[0].family_id;
    expect(v.family_id).toBe(fam);
    // o painel aceita o token do login direto
    expect((await db.admin.query(`select * from public.verify_guardian($1)`, [ok.token])).rowCount).toBe(1);
    await db.admin.query(`select public.guardian_logout($1)`, [ok.token]);
    expect((await db.admin.query(`select * from public.verify_guardian($1)`, [ok.token])).rowCount).toBe(0);
  });

  it('senha errada e e-mail desconhecido falham do mesmo jeito', async () => {
    expect((await lg('resp.a@exemplo.com', 'errada')).status).toBe('invalid');
    expect((await lg('ninguem@exemplo.com', 'senhaDoPai123')).status).toBe('invalid');
    expect((await lg('', 'x')).status).toBe('invalid');
  });

  it('sessão vencida não vale', async () => {
    const ok = await lg('resp.a@exemplo.com', 'senhaDoPai123');
    await db.admin.query(`update guardian_session set expires_at = now() - interval '1 second'`);
    expect((await db.admin.query(`select * from public.verify_guardian($1)`, [ok.token])).rowCount).toBe(0);
  });

  it('5 erros bloqueiam, mesmo com a senha certa; e-mail desconhecido também bloqueia', async () => {
    for (let i = 0; i < 5; i++) expect((await lg('resp.a@exemplo.com', 'x')).status).toBe('invalid');
    expect((await lg('resp.a@exemplo.com', 'senhaDoPai123')).status).toBe('locked');
    for (let i = 0; i < 5; i++) await lg('fantasma@exemplo.com', 'x');
    expect((await lg('fantasma@exemplo.com', 'x')).status).toBe('locked');
  });

  it('o token do modo Responsável também passa por verify_guardian', async () => {
    const d = await pairedDevice();
    const s = (await login(d.device_token, null, '123456')).session_token;
    const m = (await db.admin.query(`select * from public.guardian_mode_enter($1,'resp.a@exemplo.com','senhaDoPai123')`, [s])).rows[0];
    expect((await db.admin.query(`select * from public.verify_guardian($1)`, [m.mode_token])).rowCount).toBe(1);
  });

  it('registra o login na auditoria e não é acessível ao responsável autenticado', async () => {
    await lg('resp.a@exemplo.com', 'senhaDoPai123');
    expect((await db.admin.query(`select 1 from audit_log where action = 'guardian_login'`)).rowCount).toBeGreaterThan(0);
    await expect(commitAs(uA, (c) => c.query(`select * from public.guardian_session`))).rejects.toThrow(/permission denied/);
    await expect(commitAs(uA, (c) => c.query(`select * from public.guardian_login('resp.a@exemplo.com','senhaDoPai123')`))).rejects.toThrow(/permission denied/);
  });
});

describe('aparelhos', () => {
  it('lista só os aparelhos da própria família', async () => {
    const dA = await pairedDevice(uA, childA);
    const dB = await pairedDevice(uB, childB);
    const idsA = (await commitAs(uA, (c) => c.query(`select id from public.list_devices()`))).rows.map((r) => r.id);
    expect(idsA).toContain(dA.device_id);
    expect(idsA).not.toContain(dB.device_id);
  });

  it('desconectar revoga o aparelho e derruba as sessões na hora', async () => {
    const d = await pairedDevice();
    const s = (await login(d.device_token, null, '123456')).session_token;
    await commitAs(uA, (c) => c.query(`select public.revoke_device($1)`, [d.device_id]));
    expect((await db.admin.query(`select revoked_at from device where id=$1`, [d.device_id])).rows[0].revoked_at).not.toBeNull();
    expect((await db.admin.query(`select * from public.verify_child_session($1)`, [s])).rowCount).toBe(0);
    expect((await login(d.device_token, null, '123456')).status).toBe('revoked');
  });

  it('responsável não revoga aparelho de outra família', async () => {
    const dB = await pairedDevice(uB, childB);
    await expect(commitAs(uA, (c) => c.query(`select public.revoke_device($1)`, [dB.device_id]))).rejects.toThrow(/device_not_found/);
  });

  it('responsável não lê hashes do aparelho nem das credenciais da criança', async () => {
    await expect(commitAs(uA, (c) => c.query(`select token_hash from public.device`))).rejects.toThrow(/permission denied/);
    await expect(commitAs(uA, (c) => c.query(`select password_hash from public.child`))).rejects.toThrow(/permission denied/);
  });

  it('as tabelas de sessão e tentativas não são acessíveis ao responsável nem a anon', async () => {
    for (const t of ['pairing_code', 'child_session', 'guardian_mode_session', 'attempt_counter']) {
      await expect(commitAs(uA, (c) => c.query(`select * from public.${t}`))).rejects.toThrow(/permission denied/);
    }
  });

  it('funções da API não são chamáveis pelo responsável autenticado', async () => {
    await expect(commitAs(uA, (c) => c.query(`select * from public.child_login('x',null,'1')`))).rejects.toThrow(/permission denied/);
  });
});
