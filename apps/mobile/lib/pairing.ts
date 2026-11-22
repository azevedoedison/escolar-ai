import { supabase } from './supabase';

export async function createPairingCode(childId: string): Promise<{ code: string; expiresAt: string } | null> {
  const { data, error } = await supabase.rpc('create_pairing_code', { p_child_id: childId });
  const row = Array.isArray(data) ? data[0] : null;
  return error || !row ? null : { code: row.code, expiresAt: row.expires_at };
}

export interface DeviceRow {
  id: string;
  child_nickname: string;
  platform: string;
  label: string | null;
  paired_at: string;
  last_seen_at: string | null;
  revoked_at: string | null;
}

export async function listDevices(): Promise<DeviceRow[]> {
  const { data } = await supabase.rpc('list_devices');
  return (data as DeviceRow[] | null) ?? [];
}

export async function revokeDevice(id: string): Promise<boolean> {
  const { error } = await supabase.rpc('revoke_device', { p_device_id: id });
  return !error;
}

export async function setChildCredentials(childId: string, email: string, password: string): Promise<string | null> {
  const { error } = await supabase.rpc('set_child_credentials', { p_child_id: childId, p_email: email, p_password: password });
  if (!error) return null;
  return error.message.includes('email_in_use') ? 'Este e-mail já está em uso.' : 'Não foi possível salvar. Confira os dados.';
}
