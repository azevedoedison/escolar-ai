const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mesma regra da senha do cadastro (mínimo de 8 caracteres). O banco confere de novo. */
export const MIN_PASSWORD_LENGTH = 8;

export function validateForgot(email: string): { email?: string } {
  return EMAIL.test(email.trim()) ? {} : { email: 'E-mail inválido.' };
}

export function validateNewPassword(password: string, confirmation: string): { password?: string; confirmation?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) return { password: `A senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  if (password !== confirmation) return { confirmation: 'As senhas não são iguais.' };
  return {};
}
