import { describe, expect, it } from 'vitest';
import { safeResponse } from './responses';

const ALARM = /!!|perigo|proibid|errad[oa] (de|em)|castigo|punid|vou (contar|avisar)|alerta/i;
const decisions = ['redirect', 'block', 'crisis'] as const;
const categories = [undefined, 'dado_pessoal', 'vazio', 'tamanho', 'limite_uso', 'injecao', 'drogas', 'suicidio_autolesao', 'abuso', 'violencia'];

describe('safeResponse (M-24)', () => {
  it('crise sempre indica ajuda humana: adulto de confiança e CVV 188', () => {
    for (const category of categories) {
      const r = safeResponse({ decision: 'crisis', category });
      expect(r).toContain('188');
      expect(r).toMatch(/adulto de confiança/);
    }
  });

  it('crise com violência ou abuso inclui o Disque 100', () => {
    for (const category of ['abuso', 'violencia', 'aliciamento', 'bullying']) {
      expect(safeResponse({ decision: 'crisis', category })).toContain('Disque 100');
    }
    expect(safeResponse({ decision: 'crisis', category: 'suicidio_autolesao' })).not.toContain('100');
  });

  it('nenhuma resposta tem tom de alarme ou de punição', () => {
    for (const decision of decisions) {
      for (const category of categories) {
        expect(safeResponse({ decision, category })).not.toMatch(ALARM);
      }
    }
  });

  it('redirecionamento e bloqueio apontam para um adulto e oferecem alternativa', () => {
    expect(safeResponse({ decision: 'redirect', category: 'drogas' })).toMatch(/pais/);
    expect(safeResponse({ decision: 'block', category: 'drogas' })).toMatch(/pais/);
    expect(safeResponse({ decision: 'block', category: 'injecao' })).toMatch(/outra pergunta/);
  });

  it('dado pessoal tem texto próprio, sem culpar a criança', () => {
    const r = safeResponse({ decision: 'redirect', category: 'dado_pessoal' });
    expect(r).toMatch(/dados pessoais/);
    expect(r).not.toMatch(/pais/);
  });

  it('categoria desconhecida usa o texto padrão e nunca devolve vazio', () => {
    for (const decision of decisions) {
      expect(safeResponse({ decision, category: 'xyz' }).length).toBeGreaterThan(40);
    }
  });

  it('não expõe a categoria interna nem o motivo à criança', () => {
    expect(safeResponse({ decision: 'block', category: 'injecao' })).not.toMatch(/injecao|injeção/i);
  });
});
