import { describe, expect, it } from 'vitest';
import { classifyInput, parseInputVerdict } from './input-classifier';
import type { ModelClient } from './model';

const fake = (out: string | Error): ModelClient => ({
  complete: async () => {
    if (out instanceof Error) throw out;
    return out;
  },
});
const q = { question: 'o que é fotossíntese?', childAge: 11 };

describe('classifyInput', () => {
  it('libera pergunta escolar', async () => {
    const r = await classifyInput(q, fake('{"decisao":"allow","categoria":"nenhuma"}'));
    expect(r).toEqual({ decision: 'allow', category: 'nenhuma' });
  });
  it.each(['redirect', 'block', 'crisis'] as const)('repassa %s', async (d) => {
    const r = await classifyInput(q, fake(`{"decisao":"${d}","categoria":"suicidio_autolesao"}`));
    expect(r.decision).toBe(d);
  });
  it('saída malformada bloqueia', async () => {
    expect((await classifyInput(q, fake('talvez'))).decision).toBe('block');
  });
  it('modelo indisponível bloqueia', async () => {
    const r = await classifyInput(q, fake(new Error('fora')));
    expect(r).toEqual({ decision: 'block', category: 'classificador_indisponivel' });
  });
  it('allow com categoria de risco é contraditório', () => {
    expect(parseInputVerdict('{"decisao":"allow","categoria":"drogas"}')).toBeNull();
  });
});
