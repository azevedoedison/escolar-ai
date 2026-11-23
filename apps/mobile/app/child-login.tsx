import { useState } from 'react';
import { useRouter } from 'expo-router';
import { parseChildLogin } from '@tata/shared';
import { childLogin } from '../lib/api';
import GoogleButton from '../components/google-button';
import { Button, Card, ErrorText, Field, LinkText, Screen, Title } from '../components/ui';

/** Login da criança: PIN, ou e-mail e senha definidos pelo responsável. */
export default function ChildLogin() {
  const router = useRouter();
  const [usePin, setUsePin] = useState(true);
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    const body = parseChildLogin(usePin ? { pin } : { email, password });
    if (!body) return setError(usePin ? 'O PIN tem de 4 a 6 números.' : 'Informe e-mail e senha.');
    setBusy(true);
    const err = await childLogin(body);
    setBusy(false);
    if (err) return setError(err);
    router.replace('/chat');
  }

  return (
    <Screen>
      <Card>
        <Title>Oi! Quem está aí?</Title>
        {usePin ? (
          <Field label="Seu PIN" placeholder="4 a 6 números" keyboardType="number-pad" secureTextEntry maxLength={6} value={pin} onChangeText={setPin} />
        ) : (
          <>
            <Field label="E-mail" placeholder="voce@exemplo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Field label="Senha" placeholder="Sua senha" secureTextEntry value={password} onChangeText={setPassword} />
          </>
        )}
        <ErrorText>{error}</ErrorText>
        <Button title="Entrar" onPress={submit} loading={busy} />
        <Button title={usePin ? 'Entrar com e-mail e senha' : 'Entrar com PIN'} variant="secondary" onPress={() => setUsePin(!usePin)} />
        <GoogleButton
          onDone={(err) => {
            if (err) setError(err);
            else router.replace('/chat');
          }}
        />
        <LinkText href="/pair">Conectar este aparelho com um código</LinkText>
        <LinkText href="/guardian-mode">Sou o responsável</LinkText>
      </Card>
    </Screen>
  );
}
