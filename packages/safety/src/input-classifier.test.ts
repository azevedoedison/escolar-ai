import { describe, expect, it } from 'vitest';
import { classifyInput, parseInputVerdict } from './input-classifier';
import type { ModelClient, ModelRequest } from './model';
import { INPUT_CATEGORIES, POLICY } from './policy';

const j = (decisao: string, categoria: string, intencao = 'escolar', risco = 'nenhum') =>
  JSON.stringify({ decisao, categoria, intencao, sinal_de_risco: risco });
const fake = (out: string | Error, seen?: ModelRequest[]): ModelClient => ({
  complete: async (req) => {
    seen?.push(req);
    if (out instanceof Error) throw out;
    return out;
  },
});
const q = { question: 'o que é fotossíntese?', childAge: 11 };

describe('classifyInput', () => {
  it('responde pergunta escolar', async () => {
    const r = await classifyInput(q, fake(j('responder', 'nenhuma')));
    expect(r).toEqual({ decision: 'allow', category: 'nenhuma', intent: 'escolar', risk: 'nenhum', careful: false });
  });
  it('tema difícil em contexto escolar continua liberado', async () => {
    const r = await classifyInput(q, fake(j('responder', 'morte_doenca_guerra')));
    expect(r.decision).toBe('allow');
  });
  it('responder com cuidado segue como allow, marcado', async () => {
    const r = await classifyInput(q, fake(j('responder_com_cuidado', 'sexualidade', 'curiosidade', 'baixo')));
    expect(r).toMatchObject({ decision: 'allow', careful: true, category: 'sexualidade', risk: 'baixo' });
  });
  it('redireciona, bloqueia e trata crise', async () => {
    expect((await classifyInput(q, fake(j('redirecionar', 'drogas', 'pessoal', 'baixo')))).decision).toBe('redirect');
    expect((await classifyInput(q, fake(j('bloquear', 'violencia_armas', 'busca_de_dano', 'alto')))).decision).toBe('block');
    const crise = await classifyInput(q, fake(j('crise', 'suicidio_autolesao', 'pessoal', 'crise')));
    expect(crise).toMatchObject({ decision: 'crisis', risk: 'crise' });
  });
  it('envia a conversa recente ao modelo e limita o tamanho', async () => {
    const seen: ModelRequest[] = [];
    const recent = Array.from({ length: 10 }, (_, i) => ({ role: 'child' as const, content: `msg ${i} ${'x'.repeat(500)}` }));
    await classifyInput({ ...q, recent }, fake(j('responder', 'nenhuma'), seen));
    const user = seen[0]!.user;
    expect(user).toContain('<conversa>');
    expect(user).toContain('msg 9');
    expect(user).not.toContain('msg 3 ');
    expect(user.length).toBeLessThan(3000);
  });
  it('escalada: mesma pergunta, decisão do modelo muda com o contexto', async () => {
    const r = await classifyInput(
      { question: 'e como eu faço isso?', childAge: 11, recent: [{ role: 'child', content: 'o que é uma bomba atômica?' }] },
      fake(j('bloquear', 'violencia_armas', 'busca_de_dano', 'alto')),
    );
    expect(r.decision).toBe('block');
  });
  it('saída malformada bloqueia', async () => {
    expect((await classifyInput(q, fake('talvez'))).decision).toBe('block');
    expect((await classifyInput(q, fake('{"decisao":"responder","categoria":"nenhuma"}'))).category).toBe('classificador_indisponivel');
  });
  it('modelo indisponível bloqueia', async () => {
    const r = await classifyInput(q, fake(new Error('fora')));
    expect(r).toMatchObject({ decision: 'block', category: 'classificador_indisponivel', intent: null, risk: null });
  });
});

describe('parseInputVerdict', () => {
  it('responder com categoria de risco é contraditório', () => {
    expect(parseInputVerdict(j('responder', 'drogas'))).toBeNull();
  });
  it('responder com risco alto é contraditório', () => {
    expect(parseInputVerdict(j('responder_com_cuidado', 'drogas', 'curiosidade', 'alto'))).toBeNull();
  });
  it('crise sem sinal de risco é contraditória', () => {
    expect(parseInputVerdict(j('crise', 'suicidio_autolesao', 'pessoal', 'nenhum'))).toBeNull();
  });
  it('valores fora da lista são rejeitados', () => {
    expect(parseInputVerdict(j('responder', 'nenhuma', 'outra'))).toBeNull();
    expect(parseInputVerdict(j('liberar', 'nenhuma'))).toBeNull();
  });
});

describe('política', () => {
  it('toda categoria tem política', () => {
    for (const c of INPUT_CATEGORIES) expect(POLICY[c].rule.length).toBeGreaterThan(10);
  });
  it('suicídio nunca é liberado sem cuidado e sinal pessoal é crise', () => {
    expect(POLICY.suicidio_autolesao.legitimate).not.toBe('responder');
    expect(POLICY.suicidio_autolesao.personal).toBe('crise');
    expect(POLICY.suicidio_autolesao.parentAdjustable).toBe(false);
  });
});
