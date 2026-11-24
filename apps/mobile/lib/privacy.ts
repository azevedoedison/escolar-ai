import { RETENTION_CHOICES } from '@tata/shared';
import { getGuardianToken } from './api';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export { RETENTION_CHOICES };
export type PrivacyResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function call<T>(method: string, path: string, body?: unknown, raw = false): Promise<PrivacyResult<T>> {
  const token = await getGuardianToken();
  if (!token) return { ok: false, message: 'Entre como responsável para continuar.' };
  try {
    const res = await fetch(`${BASE}/guardian/privacy${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 401) return { ok: false, message: 'Sessão expirada. Entre de novo como responsável.' };
    if (!res.ok) return { ok: false, message: 'Não foi possível concluir. Tente de novo.' };
    if (res.status === 204) return { ok: true, data: undefined as T };
    return { ok: true, data: (raw ? await res.text() : await res.json()) as T };
  } catch {
    return { ok: false, message: 'Sem conexão. Tente de novo.' };
  }
}

export const getRetention = () => call<{ days: number }>('GET', '/retention');
export const setRetention = (days: number) => call<{ days: number }>('PUT', '/retention', { days });
/** O arquivo de exportação, como texto JSON. */
export const exportData = () => call<string>('GET', '/export', undefined, true);
export const deleteChildConversations = (childId: string) => call<{ deleted: number }>('DELETE', `/children/${childId}/conversations`);
export const deleteChild = (childId: string) => call<void>('DELETE', `/children/${childId}`, { confirm: true });
