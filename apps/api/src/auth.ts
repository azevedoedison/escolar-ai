// Token de curta duração assinado com HMAC. O pareamento e o login por PIN
// (change pareamento-e-login-crianca) vão emitir estes tokens; aqui só verificamos.

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface TokenClaims {
  role: 'child' | 'guardian';
  /** Id da criança (role child) ou do responsável (role guardian). */
  sub: string;
  /** Id da família. */
  fam: string;
  /** Expiração, em segundos desde 1970. */
  exp: number;
}

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');
const sign = (body: string, secret: string) => createHmac('sha256', secret).update(body).digest();

export function signToken(claims: TokenClaims, secret: string): string {
  const body = b64(JSON.stringify(claims));
  return `${body}.${b64(sign(body, secret))}`;
}

export function verifyToken(token: string, secret: string, nowMs = Date.now()): TokenClaims | null {
  const [body, mac, extra] = token.split('.');
  if (!body || !mac || extra !== undefined) return null;
  const expected = sign(body, secret);
  const given = Buffer.from(mac, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  let c: unknown;
  try {
    c = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof c !== 'object' || c === null) return null;
  const { role, sub, fam, exp } = c as Record<string, unknown>;
  if (role !== 'child' && role !== 'guardian') return null;
  if (typeof sub !== 'string' || typeof fam !== 'string' || typeof exp !== 'number') return null;
  if (exp * 1000 <= nowMs) return null;
  return { role, sub, fam, exp };
}
