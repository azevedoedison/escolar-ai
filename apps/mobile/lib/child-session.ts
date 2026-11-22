// Sessão da criança no aparelho. O pareamento e o login por PIN (change
// pareamento-e-login-crianca) vão chamar setChildSession; até lá ela fica vazia.

export interface ChildSession {
  token: string;
  age: number;
}

let session: ChildSession | null = null;

export const setChildSession = (s: ChildSession | null) => {
  session = s;
};
export const getChildSession = () => session;
