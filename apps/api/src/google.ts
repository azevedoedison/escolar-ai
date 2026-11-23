// Login com Google (fluxo OAuth 2.0 com código + PKCE). O app abre a tela do Google e entrega
// o código à API; a API troca o código pelo ID token no endpoint do Google (TLS direto, com o segredo
// do cliente) e confere as declarações. Nada de credencial fica em arquivo: tudo vem do ambiente.

export interface GoogleIdentity {
  /** Identificador estável da conta Google. */
  sub: string;
  email: string;
}

export interface GoogleAuth {
  clientId: string;
  /** Troca o código pela identidade verificada. Devolve null para qualquer falha. */
  exchange(code: string, codeVerifier: string, redirectUri: string): Promise<GoogleIdentity | null>;
}

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  /** Redirecionamentos permitidos (o do app e, se houver, o da web). */
  redirectUris: string[];
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/**
 * Lê GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URIS (lista separada por vírgula).
 * Faltando qualquer uma, devolve null e o botão fica desligado.
 */
export function googleConfigFromEnv(env: Record<string, string | undefined>): GoogleConfig | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUris = (env.GOOGLE_REDIRECT_URIS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!clientId || !clientSecret || redirectUris.length === 0) return null;
  return { clientId, clientSecret, redirectUris };
}

/** O ID token vem direto do endpoint do Google por TLS, então a assinatura não é reconferida; conferimos as declarações. */
export function identityFromIdToken(idToken: unknown, clientId: string, nowMs: number): GoogleIdentity | null {
  if (typeof idToken !== 'string') return null;
  const part = idToken.split('.')[1];
  if (!part) return null;
  let c: Record<string, unknown>;
  try {
    c = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof c !== 'object' || c === null) return null;
  if (!ISSUERS.includes(c.iss as string) || c.aud !== clientId) return null;
  if (typeof c.exp !== 'number' || c.exp * 1000 <= nowMs) return null;
  if (typeof c.sub !== 'string' || !c.sub || typeof c.email !== 'string' || !c.email) return null;
  if (c.email_verified !== true && c.email_verified !== 'true') return null;
  return { sub: c.sub, email: c.email };
}

export function createGoogleAuth(
  cfg: GoogleConfig,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): GoogleAuth {
  return {
    clientId: cfg.clientId,
    async exchange(code, codeVerifier, redirectUri) {
      if (!cfg.redirectUris.includes(redirectUri)) return null;
      try {
        const res = await fetchImpl(TOKEN_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            code_verifier: codeVerifier,
            redirect_uri: redirectUri,
            client_id: cfg.clientId,
            client_secret: cfg.clientSecret,
          }),
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { id_token?: unknown };
        return identityFromIdToken(json.id_token, cfg.clientId, now());
      } catch {
        return null;
      }
    },
  };
}
