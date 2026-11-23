import { useEffect, useState } from 'react';
import { Button } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { googleLogin, googleLoginConfig } from '../lib/api';

WebBrowser.maybeCompleteAuthSession();

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

/** Redirecionamento cadastrado no Google Cloud; EXPO_PUBLIC_GOOGLE_REDIRECT_URI sobrescreve o padrão do esquema do app. */
const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI ?? AuthSession.makeRedirectUri({ scheme: 'tataia', path: 'google' });

function GoogleSignIn({ clientId, onDone }: { clientId: string; onDone: (error: string | null) => void }) {
  const [request, response, prompt] = AuthSession.useAuthRequest(
    { clientId, redirectUri, scopes: ['openid', 'email'], responseType: AuthSession.ResponseType.Code, usePKCE: true },
    DISCOVERY,
  );

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success' && request?.codeVerifier) {
      googleLogin(response.params.code ?? '', request.codeVerifier, redirectUri).then(onDone);
    } else if (response.type === 'error') {
      onDone('Não deu para entrar com o Google. Tente de novo.');
    }
    // response muda uma vez por tentativa
  }, [response]);

  return <Button title="Entrar com Google" disabled={!request} onPress={() => void prompt()} />;
}

/** Botão opcional: some por completo quando a API não tem as credenciais do Google. */
export default function GoogleButton({ onDone }: { onDone: (error: string | null) => void }) {
  const [clientId, setClientId] = useState<string | null>(null);
  useEffect(() => {
    void googleLoginConfig().then((c) => setClientId(c?.clientId ?? null));
  }, []);
  return clientId ? <GoogleSignIn clientId={clientId} onDone={onDone} /> : null;
}
