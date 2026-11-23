import type { ChildInput } from '@tata/shared';
import { supabase } from './supabase';

export async function createChild(input: ChildInput): Promise<string | null> {
  const { error } = await supabase.rpc('create_child', {
    p_nickname: input.nickname,
    p_birth_year: input.birthYear,
    p_grade: input.grade,
    p_avatar: input.avatar,
    p_pin: input.pin,
  });
  return error ? 'Não foi possível cadastrar. Confira os dados e tente de novo.' : null;
}

export async function listChildren() {
  const { data } = await supabase.from('child').select('id, nickname, grade, avatar, active').order('nickname');
  return data ?? [];
}

/** Exclui só os dados deste filho. Exige o login do responsável (RPC autenticado). */
export async function deleteChild(id: string): Promise<string | null> {
  const { error } = await supabase.rpc('delete_child', { p_child_id: id, p_confirm: true });
  return error ? 'Não foi possível excluir. Tente de novo.' : null;
}
