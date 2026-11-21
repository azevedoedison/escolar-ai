import { describe, expect, it } from 'vitest';
import { validateLogin, validateSignup } from './signup';

const ok = { name: 'Maria', email: 'maria@exemplo.com', password: 'senha-longa', consent: true };

describe('validateSignup', () => {
  it('aceita dados válidos', () => {
    expect(validateSignup(ok)).toEqual({});
  });
  it('exige consentimento', () => {
    expect(validateSignup({ ...ok, consent: false }).consent).toBeDefined();
  });
  it('rejeita e-mail, senha curta e nome vazio', () => {
    const e = validateSignup({ name: ' ', email: 'x', password: '123', consent: true });
    expect(Object.keys(e).sort()).toEqual(['email', 'name', 'password']);
  });
});

describe('validateLogin', () => {
  it('valida e-mail e senha', () => {
    expect(validateLogin('a@b.co', 'x')).toEqual({});
    expect(Object.keys(validateLogin('a', ''))).toEqual(['email', 'password']);
  });
});
