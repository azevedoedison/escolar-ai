import { describe, expect, it } from 'vitest';
import { isUuid, parseRetentionDays, RETENTION_CHOICES, RETENTION_DEFAULT_DAYS } from './privacy';

describe('parseRetentionDays', () => {
  it('aceita inteiros de 30 a 365', () => {
    for (const d of [30, 90, 365]) expect(parseRetentionDays(d)).toBe(d);
  });
  it('recusa fora da faixa, decimal e texto', () => {
    for (const d of [29, 366, 0, -5, 90.5, '90', null, undefined, NaN, Infinity]) expect(parseRetentionDays(d)).toBeNull();
  });
  it('o padrão e as opções do painel estão na faixa', () => {
    expect(parseRetentionDays(RETENTION_DEFAULT_DAYS)).toBe(90);
    for (const d of RETENTION_CHOICES) expect(parseRetentionDays(d)).toBe(d);
  });
});

describe('isUuid', () => {
  it('reconhece uuid e recusa o resto', () => {
    expect(isUuid('00000000-0000-0000-0000-0000000000f1')).toBe(true);
    for (const v of ['x', '', null, 12, '00000000-0000-0000-0000-0000000000f1; drop']) expect(isUuid(v)).toBe(false);
  });
});
