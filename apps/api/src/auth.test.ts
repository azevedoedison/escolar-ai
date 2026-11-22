import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './auth';

const secret = 'segredo-de-teste';
const claims = { role: 'child' as const, sub: 'c1', fam: 'f1', exp: Math.floor(Date.now() / 1000) + 60 };

describe('token', () => {
  it('aceita token válido', () => {
    expect(verifyToken(signToken(claims, secret), secret)).toEqual(claims);
  });
  it('rejeita segredo errado, adulterado e expirado', () => {
    const t = signToken(claims, secret);
    expect(verifyToken(t, 'outro')).toBeNull();
    expect(verifyToken(`${t.slice(0, -2)}xx`, secret)).toBeNull();
    expect(verifyToken(t, secret, Date.now() + 120_000)).toBeNull();
    expect(verifyToken('lixo', secret)).toBeNull();
  });
});
