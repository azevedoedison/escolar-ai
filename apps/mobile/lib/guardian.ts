import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TimelineFilters, TimelinePage } from '@tata/shared';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const KEY = 'tata.guardianModeToken';
/** Login direto do responsável (guardado por lib/api.ts). Vale mais que o do modo Responsável. */
const LOGIN_KEY = 'tata.guardianToken';

export interface GuardianChild {
  id: string;
  nickname: string;
  grade: string | null;
  avatar: string | null;
}

export type GuardianResult<T> = { ok: true; data: T } | { ok: false; expired: boolean; message: string };

/** Guardado só enquanto o modo Responsável estiver aberto (15 minutos no servidor). */
export const saveGuardianModeToken = (token: string) => AsyncStorage.setItem(KEY, token);
export const clearGuardianModeToken = () => AsyncStorage.removeItem(KEY);

async function get<T>(path: string): Promise<GuardianResult<T>> {
  const token = (await AsyncStorage.getItem(LOGIN_KEY)) ?? (await AsyncStorage.getItem(KEY));
  if (!token) return { ok: false, expired: true, message: 'Entre no modo Responsável de novo.' };
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      await clearGuardianModeToken();
      await AsyncStorage.removeItem(LOGIN_KEY);
      return { ok: false, expired: true, message: 'A sessão do modo Responsável acabou. Entre de novo.' };
    }
    if (!res.ok) return { ok: false, expired: false, message: 'Não foi possível carregar. Tente de novo.' };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, expired: false, message: 'Sem conexão. Tente de novo.' };
  }
}

export const listGuardianChildren = () => get<{ children: GuardianChild[] }>('/guardian/children');

export function loadTimeline(childId: string, filters: TimelineFilters, cursor: string | null) {
  const p = new URLSearchParams();
  if (filters.from) p.set('from', filters.from);
  if (filters.to) p.set('to', filters.to);
  if (filters.blocked) p.set('blocked', '1');
  if (filters.alerts) p.set('alerts', '1');
  if (filters.q) p.set('q', filters.q);
  if (cursor) p.set('cursor', cursor);
  return get<TimelinePage>(`/guardian/children/${encodeURIComponent(childId)}/timeline?${p}`);
}
