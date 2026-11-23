import pg from 'pg';

export type Status = 'ok' | 'invalid' | 'locked' | 'revoked' | 'unauthorized';

export interface AuthStore {
  redeemPairingCode(code: string, platform: string, origin: string, label: string | null): Promise<{ status: Status; deviceId?: string; childId?: string; deviceToken?: string }>;
  childLogin(deviceToken: string, identifier: string | null, secret: string): Promise<{ status: Status; sessionToken?: string; expiresAt?: string }>;
  childLoginGoogle(deviceToken: string, sub: string, email: string): Promise<{ status: Status; sessionToken?: string; expiresAt?: string }>;
  verifyChildSession(token: string): Promise<{ sessionId: string; childId: string; familyId: string; deviceId: string; age: number } | null>;
  childLogout(token: string): Promise<void>;
  guardianModeEnter(sessionToken: string, email: string, password: string): Promise<{ status: Status; modeToken?: string; expiresAt?: string }>;
  verifyGuardianMode(token: string): Promise<{ guardianId: string; familyId: string } | null>;
  guardianModeExit(token: string): Promise<void>;
  /** Login direto do responsável (e-mail e senha), sem aparelho da criança. */
  guardianLogin(email: string, password: string): Promise<{ status: Status; token?: string; expiresAt?: string }>;
  /** Responsável por login direto OU por modo Responsável: o painel aceita os dois. */
  verifyGuardian(token: string): Promise<{ guardianId: string; familyId: string } | null>;
  guardianLogout(token: string): Promise<void>;
}

/** Implementação sobre as funções SQL da migração de pareamento. Toda regra e todo contador ficam no banco. */
export function createPairingStore(pool: pg.Pool): AuthStore {
  const q = async (sql: string, args: unknown[]) => (await pool.query(sql, args)).rows;
  const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : (d as string | undefined));
  return {
    async redeemPairingCode(code, platform, origin, label) {
      const [r] = await q('select * from public.redeem_pairing_code($1,$2,$3,$4)', [code, platform, origin, label]);
      return { status: r.status, deviceId: r.device_id ?? undefined, childId: r.child_id ?? undefined, deviceToken: r.device_token ?? undefined };
    },
    async childLogin(deviceToken, identifier, secret) {
      const [r] = await q('select * from public.child_login($1,$2,$3)', [deviceToken, identifier, secret]);
      return { status: r.status, sessionToken: r.session_token ?? undefined, expiresAt: iso(r.expires_at) };
    },
    async childLoginGoogle(deviceToken, sub, email) {
      const [r] = await q('select * from public.child_login_google($1,$2,$3)', [deviceToken, sub, email]);
      return { status: r.status, sessionToken: r.session_token ?? undefined, expiresAt: iso(r.expires_at) };
    },
    async verifyChildSession(token) {
      const [r] = await q('select * from public.verify_child_session($1)', [token]);
      return r ? { sessionId: r.session_id, childId: r.child_id, familyId: r.family_id, deviceId: r.device_id, age: r.age } : null;
    },
    async childLogout(token) {
      await q('select public.child_logout($1)', [token]);
    },
    async guardianModeEnter(sessionToken, email, password) {
      const [r] = await q('select * from public.guardian_mode_enter($1,$2,$3)', [sessionToken, email, password]);
      return { status: r.status, modeToken: r.mode_token ?? undefined, expiresAt: iso(r.expires_at) };
    },
    async verifyGuardianMode(token) {
      const [r] = await q('select * from public.verify_guardian_mode($1)', [token]);
      return r ? { guardianId: r.guardian_id, familyId: r.family_id } : null;
    },
    async guardianModeExit(token) {
      await q('select public.guardian_mode_exit($1)', [token]);
    },
    async guardianLogin(email, password) {
      const [r] = await q('select * from public.guardian_login($1,$2)', [email, password]);
      return { status: r.status, token: r.token ?? undefined, expiresAt: iso(r.expires_at) };
    },
    async verifyGuardian(token) {
      const [r] = await q('select * from public.verify_guardian($1)', [token]);
      return r ? { guardianId: r.guardian_id, familyId: r.family_id } : null;
    },
    async guardianLogout(token) {
      await q('select public.guardian_logout($1)', [token]);
    },
  };
}
