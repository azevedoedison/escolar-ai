/** Validações do pareamento e do login da criança. Mesmas regras do banco (migração 20261122000002). */
export const PAIRING_CODE = /^[0-9]{6}$/;
export const PIN = /^[0-9]{4,6}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Platform = 'android' | 'ios' | 'web';
export const PLATFORMS: readonly Platform[] = ['android', 'ios', 'web'];

export type ChildLoginBody = { pin: string } | { email: string; password: string };

export function isPairingCode(v: unknown): v is string {
  return typeof v === 'string' && PAIRING_CODE.test(v);
}

/** Devolve o corpo válido do login da criança (PIN, ou e-mail + senha) ou null. */
export function parseChildLogin(body: unknown): ChildLoginBody | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.pin === 'string') return PIN.test(b.pin) ? { pin: b.pin } : null;
  if (typeof b.email === 'string' && typeof b.password === 'string' && EMAIL.test(b.email.trim()) && b.password.length > 0) {
    return { email: b.email.trim(), password: b.password };
  }
  return null;
}

export function validateChildCredentials(email: string, password: string): { email?: string; password?: string } {
  const errors: { email?: string; password?: string } = {};
  if (!EMAIL.test(email.trim())) errors.email = 'E-mail inválido.';
  if (password.length < 8) errors.password = 'A senha precisa ter ao menos 8 caracteres.';
  return errors;
}
