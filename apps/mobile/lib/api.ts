import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const KEYS = { device: 'tata.deviceToken', session: 'tata.sessionToken' } as const;

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; message: string };

async function call<T>(path: string, body?: unknown, token?: string | null): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body ?? {}),
    });
    if (res.status === 204) return { ok: true, data: undefined as T };
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error ?? 'error', message: json.message ?? 'Algo deu errado.' };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: 'network', message: 'Sem conexão. Tente de novo.' };
  }
}

export const getDeviceToken = () => AsyncStorage.getItem(KEYS.device);
export const getSessionToken = () => AsyncStorage.getItem(KEYS.session);

/** Aparelho da criança: troca o código de 6 dígitos pelo token do aparelho. */
export async function pairDevice(code: string, platform: 'android' | 'ios' | 'web'): Promise<string | null> {
  const r = await call<{ deviceToken: string }>('/pairing/redeem', { code, platform });
  if (!r.ok) return r.message;
  await AsyncStorage.setItem(KEYS.device, r.data.deviceToken);
  return null;
}

/** Login da criança: PIN ou e-mail e senha definidos pelo responsável. */
export async function childLogin(body: { pin: string } | { email: string; password: string }): Promise<string | null> {
  const token = await getDeviceToken();
  if (!token) return 'Este aparelho ainda não foi pareado.';
  const r = await call<{ sessionToken: string }>('/child/login', body, token);
  if (!r.ok) {
    if (r.error === 'revoked') await AsyncStorage.removeItem(KEYS.device);
    return r.message;
  }
  await AsyncStorage.setItem(KEYS.session, r.data.sessionToken);
  return null;
}

export async function childLogout(): Promise<void> {
  const token = await getSessionToken();
  if (token) await call('/child/logout', {}, token);
  await AsyncStorage.removeItem(KEYS.session);
}

/** Modo Responsável no aparelho da criança: exige e-mail e senha do responsável. */
export async function enterGuardianMode(email: string, password: string): Promise<string | null> {
  const token = await getSessionToken();
  if (!token) return 'Entre primeiro com o seu PIN.';
  const r = await call<{ modeToken: string }>('/guardian-mode/enter', { email, password }, token);
  return r.ok ? null : r.message;
}
