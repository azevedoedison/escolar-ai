import { describe, expect, it } from 'vitest';
import { validateChild } from './child';

const ok = { nickname: 'Tati', birthYear: 2015, grade: '6º ano', avatar: 'raposa', pin: '1234' };

describe('validateChild', () => {
  it('aceita dados válidos', () => {
    expect(validateChild(ok, 2026)).toEqual({});
  });
  it('limita a idade entre 5 e 17 anos', () => {
    expect(validateChild({ ...ok, birthYear: 2022 }, 2026).birthYear).toBeDefined();
    expect(validateChild({ ...ok, birthYear: 2008 }, 2026).birthYear).toBeDefined();
    expect(validateChild({ ...ok, birthYear: 2009 }, 2026)).toEqual({});
  });
  it('exige PIN numérico de 4 a 6 dígitos e apelido', () => {
    for (const pin of ['123', '1234567', 'abcd']) expect(validateChild({ ...ok, pin }, 2026).pin).toBeDefined();
    expect(validateChild({ ...ok, nickname: ' ' }, 2026).nickname).toBeDefined();
  });
});
