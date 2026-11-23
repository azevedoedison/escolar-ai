import { describe, expect, it, vi } from 'vitest';
import { runRetention, startRetentionJob } from './retention';

const fakeDb = (n: number) => ({ query: vi.fn(async () => ({ rows: [{ n }] })) }) as never;

describe('retenção', () => {
  it('chama a rotina por família do banco e devolve a contagem', async () => {
    const db = fakeDb(3);
    expect(await runRetention(db)).toBe(3);
    expect((db as { query: ReturnType<typeof vi.fn> }).query).toHaveBeenCalledWith('select public.purge_expired_all() as n');
  });

  it('roda ao iniciar e a cada intervalo, e para quando pedido', async () => {
    vi.useFakeTimers();
    const db = fakeDb(0);
    const q = (db as { query: ReturnType<typeof vi.fn> }).query;
    const stop = startRetentionJob(db, 1000);
    expect(q).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(q).toHaveBeenCalledTimes(3);
    stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(q).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it('erro numa rodada é registrado e não derruba', async () => {
    const log = vi.fn();
    const db = { query: vi.fn(async () => { throw new Error('banco fora'); }) } as never;
    const stop = startRetentionJob(db, 1000, log);
    await new Promise((r) => setTimeout(r, 10));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('banco fora'));
    stop();
  });
});
