import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from './config';

const ok = {
  ANTHROPIC_API_KEY: 'chave-falsa-de-teste',
  DATABASE_URL: 'postgres://u:p@localhost:5432/db',
  CHILD_TOKEN_SECRET: 'x'.repeat(32),
};

describe('loadConfig', () => {
  it('aceita o ambiente completo e aplica os padrões não sensíveis', () => {
    const c = loadConfig(ok);
    expect(c).toMatchObject({ port: 3000, corsOrigins: [], production: false });
  });

  it.each(['ANTHROPIC_API_KEY', 'DATABASE_URL', 'CHILD_TOKEN_SECRET'])('falta %s: recusa e cita o nome', (name) => {
    const env: Record<string, string | undefined> = { ...ok };
    delete env[name];
    expect(() => loadConfig(env)).toThrow(ConfigError);
    expect(() => loadConfig(env)).toThrow(name);
    expect(() => loadConfig({ ...env, [name]: '' })).toThrow(name);
  });

  it('segredo do token curto demais é recusado, sem repetir o valor', () => {
    const fraco = 'curto-123';
    try {
      loadConfig({ ...ok, CHILD_TOKEN_SECRET: fraco });
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).toContain('CHILD_TOKEN_SECRET');
      expect((e as Error).message).not.toContain(fraco);
    }
  });

  it('CORS: lista separada por vírgula, sem barra final, só http(s)', () => {
    expect(loadConfig({ ...ok, CORS_ORIGINS: 'https://a.com, http://localhost:8081' }).corsOrigins).toEqual(['https://a.com', 'http://localhost:8081']);
    for (const ruim of ['*', 'https://a.com/', 'a.com', 'javascript:alert(1)']) {
      expect(() => loadConfig({ ...ok, CORS_ORIGINS: ruim })).toThrow(/CORS_ORIGINS/);
    }
  });

  it('porta inválida é recusada; produção liga pelo NODE_ENV', () => {
    expect(() => loadConfig({ ...ok, PORT: 'abc' })).toThrow(/PORT/);
    expect(loadConfig({ ...ok, NODE_ENV: 'production' }).production).toBe(true);
  });
});

// ISO-08: o processo de verdade, sem o segredo, encerra antes de abrir a porta.
describe('ISO-08: servidor sem segredo não sobe', () => {
  const root = join(import.meta.dirname, '..');
  const boot = (env: Record<string, string>) =>
    spawnSync(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
      cwd: root,
      env: { PATH: process.env.PATH ?? '', ...env },
      encoding: 'utf8',
      timeout: 20_000,
    });

  it('sem CHILD_TOKEN_SECRET: código 1, erro claro e nenhuma porta aberta', () => {
    const semSegredo: Record<string, string> = { ...ok };
    delete semSegredo.CHILD_TOKEN_SECRET;
    const r = boot({ ...semSegredo, PORT: '0' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('CHILD_TOKEN_SECRET');
    expect(r.stdout).not.toContain('API ouvindo');
  });

  it('sem nenhuma variável: lista todas as que faltam', () => {
    const r = boot({});
    expect(r.status).toBe(1);
    for (const n of ['ANTHROPIC_API_KEY', 'DATABASE_URL', 'CHILD_TOKEN_SECRET']) expect(r.stderr).toContain(n);
  });
});
