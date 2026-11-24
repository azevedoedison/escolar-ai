import { describe, expect, it } from 'vitest';
import { validateForgot, validateNewPassword } from './recovery';

describe('validateForgot', () => {
  it('aceita e-mail válido e recusa o resto', () => {
    expect(validateForgot(' a@b.co ')).toEqual({});
    expect(validateForgot('a')).toEqual({ email: 'E-mail inválido.' });
    expect(validateForgot('')).toEqual({ email: 'E-mail inválido.' });
  });
});

describe('validateNewPassword', () => {
  it('aceita senha com 8 caracteres e confirmação igual', () => {
    expect(validateNewPassword('12345678', '12345678')).toEqual({});
  });
  it('recusa senha curta', () => {
    expect(validateNewPassword('1234567', '1234567').password).toBeDefined();
  });
  it('recusa confirmação diferente', () => {
    expect(validateNewPassword('12345678', '12345679').confirmation).toBeDefined();
  });
});
