import { describe, expect, it } from 'vitest';
import { isPairingCode, parseChildLogin, validateChildCredentials } from './pairing';

describe('pareamento', () => {
  it('aceita só 6 dígitos', () => {
    expect(isPairingCode('012345')).toBe(true);
    for (const v of ['12345', '1234567', 'abcdef', '', null, 123456]) expect(isPairingCode(v)).toBe(false);
  });
  it('parseChildLogin aceita PIN de 4 a 6 dígitos ou e-mail e senha', () => {
    expect(parseChildLogin({ pin: '1234' })).toEqual({ pin: '1234' });
    expect(parseChildLogin({ pin: '12' })).toBeNull();
    expect(parseChildLogin({ email: ' a@b.com ', password: 'x' })).toEqual({ email: 'a@b.com', password: 'x' });
    expect(parseChildLogin({ email: 'a', password: 'x' })).toBeNull();
    expect(parseChildLogin({ email: 'a@b.com', password: '' })).toBeNull();
    expect(parseChildLogin(null)).toBeNull();
    expect(parseChildLogin('x')).toBeNull();
  });
  it('credenciais da criança', () => {
    expect(validateChildCredentials('a@b.com', '12345678')).toEqual({});
    expect(validateChildCredentials('a', '123')).toEqual({ email: 'E-mail inválido.', password: 'A senha precisa ter ao menos 8 caracteres.' });
  });
});
