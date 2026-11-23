import { describe, expect, it } from 'vitest';
import { categoryLabel, isHighlighted, parseTimelineQuery, plainText } from './timeline';

const q = (o: Record<string, string | undefined>) => parseTimelineQuery((k) => o[k]);

describe('parseTimelineQuery', () => {
  it('sem parâmetros usa os padrões', () => {
    expect(q({})).toEqual({ filters: { from: undefined, to: undefined, blocked: false, alerts: false, q: undefined }, limit: 30, cursor: null });
  });
  it('lê filtros', () => {
    const r = q({ from: '2026-11-01', to: '2026-11-22', blocked: '1', alerts: 'true', q: ' vulcão ', limit: '10', cursor: 'abc' });
    expect(r).toEqual({ filters: { from: '2026-11-01', to: '2026-11-22', blocked: true, alerts: true, q: 'vulcão' }, limit: 10, cursor: 'abc' });
  });
  it('recusa data, intervalo, limite e busca inválidos', () => {
    for (const bad of <Record<string, string>[]>[
      { from: '2026-13-01' },
      { to: '22/11/2026' },
      { from: '2026-02-30' },
      { from: '2026-11-22', to: '2026-11-01' },
      { limit: '0' },
      { limit: '101' },
      { limit: 'x' },
      { q: 'a'.repeat(101) },
    ]) {
      expect(q(bad)).toBeNull();
    }
  });
});

describe('plainText', () => {
  it('mantém HTML como texto literal', () => {
    const html = '<img src=x onerror=alert(1)><script>alert(2)</script>';
    expect(plainText(html)).toBe(html);
  });
  it('tira controle e inversão de direção, mantém quebra de linha', () => {
    expect(plainText('a\u0000b‮c\nd\te')).toBe('abc\nd\te');
  });
});

describe('rótulos', () => {
  it('categoria conhecida tem nome amigável; desconhecida passa como texto', () => {
    expect(categoryLabel('drogas')).toBe('Drogas');
    expect(categoryLabel('<b>x</b>')).toBe('<b>x</b>');
  });
  it('só destaca o que não foi respondido normalmente', () => {
    expect(isHighlighted('allow')).toBe(false);
    for (const d of ['redirect', 'block', 'crisis'] as const) expect(isHighlighted(d)).toBe(true);
  });
});
