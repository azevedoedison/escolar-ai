/** Versão do termo de consentimento parental exibido no cadastro. Muda quando o texto mudar. */
export const CONSENT_VERSION = 'termos-2026-11';

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  consent: boolean;
}

export type SignupErrors = Partial<Record<keyof SignupInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(input: SignupInput): SignupErrors {
  const errors: SignupErrors = {};
  if (input.name.trim().length < 2) errors.name = 'Informe seu nome.';
  if (!EMAIL.test(input.email.trim())) errors.email = 'E-mail inválido.';
  if (input.password.length < 8) errors.password = 'A senha precisa ter ao menos 8 caracteres.';
  if (!input.consent) errors.consent = 'É preciso aceitar o termo de consentimento.';
  return errors;
}

export function validateLogin(email: string, password: string): Pick<SignupErrors, 'email' | 'password'> {
  const errors: Pick<SignupErrors, 'email' | 'password'> = {};
  if (!EMAIL.test(email.trim())) errors.email = 'E-mail inválido.';
  if (password.length === 0) errors.password = 'Informe a senha.';
  return errors;
}
