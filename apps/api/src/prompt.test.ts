import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from './prompt';

const base = { age: 11, grade: '6º ano', homeworkMode: false, inputCategory: 'nenhuma' };

describe('buildSystemPrompt', () => {
  it('criança de 8 anos pede linguagem simples', () => {
    const p = buildSystemPrompt({ ...base, age: 8, grade: null });
    expect(p).toContain('8 anos');
    expect(p).toContain('frases curtas');
  });
  it('inclui série e idade', () => {
    expect(buildSystemPrompt(base)).toContain('11 anos e cursa 6º ano');
  });
  it('modo Lição de Casa não entrega resposta pronta', () => {
    expect(buildSystemPrompt({ ...base, homeworkMode: true })).toContain('MODO LIÇÃO DE CASA');
    expect(buildSystemPrompt(base)).not.toContain('MODO LIÇÃO DE CASA');
  });
  it('responder com cuidado recebe o aviso mesmo sem categoria sensível', () => {
    expect(buildSystemPrompt({ ...base, careful: true })).toContain('trate com cuidado');
  });
  it('tema sensível recebe aviso de cuidado', () => {
    expect(buildSystemPrompt({ ...base, inputCategory: 'morte_doenca_guerra' })).toContain('morte doenca guerra');
  });
});
