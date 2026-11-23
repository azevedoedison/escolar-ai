import { CONSENT_VERSION, type SignupInput } from '@tata/shared';
import { supabase } from './supabase';

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
  return regError ? 'Conta criada, mas o cadastro da família falhou. Tente entrar novamente.' : null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pede o link de recuperação. A resposta é a mesma com ou sem conta (não revela quais e-mails existem). */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const value = email.trim();
  if (!EMAIL_RE.test(value)) return 'E-mail inválido.';
  await supabase.auth.resetPasswordForEmail(value);
  return null;
}
