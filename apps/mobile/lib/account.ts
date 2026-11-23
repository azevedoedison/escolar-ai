import { supabase } from './supabase';
import { signOut } from './auth';

/** Exclui a conta do responsável. O banco recusa enquanto houver filhos cadastrados. */
export async function deleteAccount(): Promise<string | null> {
  const { error } = await supabase.rpc('delete_account', { p_confirm: true });
  if (error) {
    return error.message.includes('children_linked')
      ? 'Exclua primeiro as contas dos filhos.'
      : 'Não foi possível excluir. Tente de novo.';
  }
  await signOut();
  return null;
}
