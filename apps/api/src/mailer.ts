// Envio de e-mail da API. Por ora o envio é SIMULADO: nenhum e-mail real sai.
// A fila vive no banco (public.email_outbox, preenchida por create_guardian_invite);
// ligar um provedor real depois é trocar a implementação de `Mailer`, sem mexer no resto.

import type pg from 'pg';

export interface OutboxMail {
  id: string;
  kind: string;
  to: string;
  payload: Record<string, unknown>;
}

export interface Mailer {
  send(mail: OutboxMail): Promise<void>;
}

export const OUTBOX_INTERVAL_MS = 15 * 1000;

/** Endereço base do app para o link do convite. A configuração real fica para depois (INVITE_BASE_URL). */
export const DEFAULT_INVITE_BASE_URL = 'https://tata.example/convite';

/** Link do convite. O token vai na query, nunca em log de produção. */
export const inviteLink = (token: string, base = DEFAULT_INVITE_BASE_URL) => `${base}?token=${encodeURIComponent(token)}`;

/**
 * Mailer simulado: não envia nada. Guarda o que seria enviado em `sent` (para testes) e,
 * com `echo`, imprime o convite no console para o desenvolvedor aceitar à mão. Só para desenvolvimento.
 */
export function createSimulatedMailer(opts: { echo?: (line: string) => void; baseUrl?: string } = {}) {
  const sent: OutboxMail[] = [];
  const mailer: Mailer & { sent: OutboxMail[] } = {
    sent,
    async send(mail) {
      sent.push(mail);
      if (mail.kind === 'guardian_invite' && typeof mail.payload.token === 'string') {
        opts.echo?.(`[e-mail simulado] convite para ${mail.to}: ${inviteLink(mail.payload.token, opts.baseUrl)}`);
      } else {
        opts.echo?.(`[e-mail simulado] ${mail.kind} para ${mail.to}`);
      }
    },
  };
  return mailer;
}

type Queryable = Pick<pg.Pool, 'query'>;

/**
 * Entrega os e-mails pendentes. Marca cada um como enviado e remove o token do banco depois do envio.
 * Falha de um e-mail o devolve à fila (tenta de novo na próxima rodada) e não impede os outros.
 * Devolve quantos foram enviados.
 */
export async function drainOutbox(db: Queryable, mailer: Mailer, limit = 20, log: (m: string) => void = console.error): Promise<number> {
  const { rows } = await db.query(
    `update public.email_outbox set sent_at = now()
      where id in (select id from public.email_outbox where sent_at is null order by created_at limit $1 for update skip locked)
      returning id, kind, to_email, payload`,
    [limit],
  );
  let ok = 0;
  for (const r of rows as { id: string; kind: string; to_email: string; payload: Record<string, unknown> }[]) {
    try {
      await mailer.send({ id: r.id, kind: r.kind, to: r.to_email, payload: r.payload });
      await db.query(`update public.email_outbox set payload = payload - 'token' where id = $1`, [r.id]);
      ok++;
    } catch (e) {
      log(`Falha ao enviar e-mail ${r.id} (${r.kind}): ${e instanceof Error ? e.message : String(e)}`);
      await db.query(`update public.email_outbox set sent_at = null where id = $1`, [r.id]);
    }
  }
  return ok;
}

/** Agenda a entrega. Erro numa rodada é registrado e não derruba a API. Devolve a função que para o agendamento. */
export function startOutboxJob(
  db: Queryable,
  mailer: Mailer,
  intervalMs = OUTBOX_INTERVAL_MS,
  log: (msg: string) => void = console.error,
): () => void {
  const tick = () => {
    drainOutbox(db, mailer, 20, log).catch((e) => log(`Falha na fila de e-mail: ${e instanceof Error ? e.message : String(e)}`));
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
