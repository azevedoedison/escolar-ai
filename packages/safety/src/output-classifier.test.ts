import { describe, expect, it } from 'vitest';
import type { ModelClient } from './model';
import { classifyOutput, parseOutputVerdict } from './output-classifier';

const fake = (reply: string | Error): ModelClient & { calls: number; last?: string } => {
  const c = {
    calls: 0,
    last: undefined as string | undefined,
    async complete(req: { user: string }) {
      c.calls += 1;
      c.last = req.user;
      if (reply instanceof Error) throw reply;
      return reply;
    },
  };
  return c;
};
const input = { question: 'o que é fotossíntese?', answer: 'É como as plantas fazem comida.', childAge: 11 };

describe('classifyOutput (M-23)', () => {
  it('libera resposta adequada', async () => {
    const c = fake('{"decisao":"allow","categoria":"nenhuma","motivo":"ok"}');
    expect(await classifyOutput(input, c)).toEqual({ decision: 'allow', category: 'nenhuma', reason: 'ok' });
  });

  it('aceita JSON cercado de texto ou de cercas de código', async () => {
    const c = fake('```json\n{"decisao":"block","categoria":"drogas"}\n```');
    expect(await classifyOutput(input, c)).toEqual({ decision: 'block', category: 'drogas' });
  });

  it('redireciona quando o classificador manda', async () => {
    const c = fake('{"decisao":"redirect","categoria":"sexualidade","motivo":"detalhe demais"}');
    expect((await classifyOutput(input, c)).decision).toBe('redirect');
  });

  it('bloqueia se o modelo falhar (fail-closed)', async () => {
    const r = await classifyOutput(input, fake(new Error('timeout')));
    expect(r).toMatchObject({ decision: 'block', category: 'classificador_indisponivel' });
  });

  it.each(['não sei', '{"decisao":"talvez","categoria":"nenhuma"}', '{"decisao":"allow"}', '{"decisao":"allow","categoria":"inventada"}', '{quebrado'])(
    'bloqueia saída inválida: %s',
    async (raw) => {
      expect(await classifyOutput(input, fake(raw))).toMatchObject({ decision: 'block', category: 'classificador_invalido' });
    },
  );

  it('não aceita allow contraditório com categoria de risco', () => {
    expect(parseOutputVerdict('{"decisao":"allow","categoria":"suicidio_autolesao"}')).toBeNull();
  });

  it('bloqueia resposta vazia ou gigante sem chamar o modelo', async () => {
    const c = fake('{"decisao":"allow","categoria":"nenhuma"}');
    expect((await classifyOutput({ ...input, answer: '  ' }, c)).category).toBe('resposta_vazia');
    expect((await classifyOutput({ ...input, answer: 'a'.repeat(7000) }, c)).category).toBe('resposta_longa_demais');
    expect(c.calls).toBe(0);
  });

  it('envia pergunta, resposta e idade ao modelo', async () => {
    const c = fake('{"decisao":"allow","categoria":"nenhuma"}');
    await classifyOutput(input, c);
    expect(c.last).toContain('11 anos');
    expect(c.last).toContain('<resposta>É como as plantas fazem comida.</resposta>');
  });
});
