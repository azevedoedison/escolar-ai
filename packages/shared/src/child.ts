export interface ChildInput {
  nickname: string;
  birthYear: number;
  grade: string;
  avatar: string;
  pin: string;
}

export type ChildErrors = Partial<Record<keyof ChildInput, string>>;

export const AVATARS = ['raposa', 'coruja', 'gato', 'panda', 'dino', 'astronauta'] as const;

/** Mesmas regras do banco (create_child): idade de 5 a 17 anos e PIN de 4 a 6 dígitos. */
export function validateChild(input: ChildInput, currentYear = new Date().getFullYear()): ChildErrors {
  const errors: ChildErrors = {};
  if (input.nickname.trim().length === 0) errors.nickname = 'Informe o apelido.';
  const age = currentYear - input.birthYear;
  if (!Number.isInteger(input.birthYear) || age < 5 || age > 17) errors.birthYear = 'A idade deve ficar entre 5 e 17 anos.';
  if (!/^[0-9]{4,6}$/.test(input.pin)) errors.pin = 'O PIN precisa ter de 4 a 6 números.';
  return errors;
}
