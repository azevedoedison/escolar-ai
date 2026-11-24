// Envio de e-mail desacoplado. Nenhum provedor real está definido: o provedor transacional previsto
// no plano (Resend) entra depois, implementando esta interface (change recuperacao-de-senha-e-confirmacao).

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/** Versão simulada: imprime a mensagem (com o link) no console e não envia nada. Só para desenvolvimento. */
export function createConsoleMailer(log: (line: string) => void = console.log): Mailer {
  return {
    async send({ to, subject, text }) {
      log(`[e-mail simulado] para: ${to}\nassunto: ${subject}\n${text}\n`);
    },
  };
}

export type EmailKind = 'confirm' | 'reset';

/** Monta o e-mail com o link de uso único. `baseUrl` é o endereço do app ou da página web (APP_BASE_URL). */
export function buildEmail(kind: EmailKind, baseUrl: string, token: string, name: string): Omit<MailMessage, 'to'> {
  const base = baseUrl.replace(/\/+$/, '');
  const first = name.trim().split(/\s+/)[0] || '';
  const hello = first ? `Olá, ${first}!` : 'Olá!';
  if (kind === 'confirm') {
    return {
      subject: 'Confirme seu e-mail na Tatá IA',
      text: `${hello}\n\nPara concluir seu cadastro, abra o link abaixo (vale por 24 horas e só funciona uma vez):\n${base}/confirm-email?token=${token}\n\nSe você não criou esta conta, ignore esta mensagem.`,
    };
  }
  return {
    subject: 'Redefina sua senha na Tatá IA',
    text: `${hello}\n\nPara escolher uma nova senha, abra o link abaixo (vale por 1 hora e só funciona uma vez):\n${base}/reset-password?token=${token}\n\nSe você não pediu isso, ignore esta mensagem: sua senha continua a mesma.`,
  };
}
