/**
 * Leitura obrigatória de segredos.
 * O servidor não sobe sem o segredo; não existe valor padrão.
 */
export function requireSecret(name, minLength = 16) {
  const value = process.env[name];
  if (!value || value.trim().length < minLength) {
    throw new Error(
      `Variável ${name} ausente ou fraca (mínimo ${minLength} caracteres). Configure em .env antes de iniciar.`
    );
  }
  return value;
}
