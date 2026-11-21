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
