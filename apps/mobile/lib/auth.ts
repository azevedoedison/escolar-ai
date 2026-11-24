import { CONSENT_VERSION, type SignupInput } from '@tata/shared';
import { supabase } from './supabase';
import { resendConfirmation } from './api';

/** Mensagem devolvida quando o cadastro deu certo e falta confirmar o e-mail. */
export const CONFIRM_SENT = 'Enviamos um link para o seu e-mail. Abra-o para confirmar o cadastro e depois entre.';

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? 'E-mail ou senha incorretos.' : null;
}

/** Cria a conta no Supabase Auth e, em seguida, a família com o consentimento registrado. */
export async function signUp(input: SignupInput): Promise<string | null> {
  const { data, error } = await supabase.auth.signUp({ email: input.email.trim(), password: input.password });
  if (error) return 'Não foi possível criar a conta. Verifique os dados.';
  if (!data.session) return 'Confirme seu e-mail para concluir o cadastro e depois entre.';
  const { error: regError } = await supabase.rpc('register_guardian', {
    p_name: input.name,
    p_consent: input.consent,
    p_consent_version: CONSENT_VERSION,
  });
  if (regError) return 'Conta criada, mas o cadastro da família falhou. Tente entrar novamente.';
  // O painel só abre depois de confirmar o e-mail: o link vai para a caixa de entrada (simulado no console da API por enquanto).
  await resendConfirmation(input.email);
  await supabase.auth.signOut();
  return CONFIRM_SENT;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
