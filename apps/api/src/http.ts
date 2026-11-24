// Camada HTTP comum: CORS restrito, cabeçalhos de segurança e log sem conteúdo.
// Regras em openspec/changes/seguranca-da-aplicacao.

import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';

/** Evento de log: só ids, rota, status, decisão, categoria e latência. Nunca texto de mensagem. */
export type LogEvent = Record<string, string | number | boolean | null>;
export type Logger = (event: LogEvent) => void;

export const jsonLogger: Logger = (event) => console.log(JSON.stringify(event));

export interface HttpOptions {
  /** Origens de navegador aceitas. Vazio: nenhuma. Apps nativos não enviam Origin e não dependem disto. */
  corsOrigins?: string[];
  /** Liga Strict-Transport-Security (produção atrás de HTTPS). */
  hsts?: boolean;
  log?: Logger;
  /** Tamanho máximo do corpo, em bytes. */
  maxBodyBytes?: number;
}

export const MAX_BODY_BYTES = 64 * 1024;

export const securityHeaders = (hsts: boolean): MiddlewareHandler => async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Cross-Origin-Resource-Policy', 'same-site');
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  c.header('Cache-Control', 'no-store');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (hsts) c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
};

/** Uma linha por requisição: método, rota (com `:id`, não o valor), status e latência. */
export const requestLog = (log: Logger): MiddlewareHandler => async (c, next) => {
  const t0 = Date.now();
  await next();
  log({ evento: 'requisicao', metodo: c.req.method, rota: c.req.routePath, status: c.res.status, ms: Date.now() - t0 });
};

export function applyHttp(app: import('hono').Hono, opts: HttpOptions = {}) {
  const allowed = new Set(opts.corsOrigins ?? []);
  const log = opts.log ?? jsonLogger;
  app.use(requestLog(log));
  app.use(securityHeaders(opts.hsts ?? false));
  app.use(cors({ origin: (o) => (allowed.has(o) ? o : null), allowHeaders: ['authorization', 'content-type'], maxAge: 600 }));
  app.use(
    bodyLimit({
      maxSize: opts.maxBodyBytes ?? MAX_BODY_BYTES,
      onError: (c) => c.json({ error: 'corpo_grande_demais' }, 413),
    }),
  );
  // Erro inesperado: registra só o tipo e a rota. A mensagem do erro pode carregar texto da conversa.
  app.onError((err, c) => {
    log({ evento: 'erro', metodo: c.req.method, rota: c.req.routePath, tipo: err instanceof Error ? err.name : 'desconhecido' });
    return c.json({ error: 'erro_interno' }, 500);
  });
}
