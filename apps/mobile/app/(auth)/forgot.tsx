import { useState } from 'react';
import { requestPasswordReset } from '../../lib/auth';
import { Body, Button, Card, ErrorText, Field, LinkText, Screen, Title } from '../../components/ui';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    const err = await requestPasswordReset(email);
    setBusy(false);
    if (err) return setError(err);
    setSent(true);
  }

  return (
    <Screen>
      <Card>
        <Title>Recuperar senha</Title>
        <Field label="E-mail" placeholder="voce@exemplo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <ErrorText>{error}</ErrorText>
        {sent ? <Body>Pedido enviado. Se o e-mail existir, enviamos o link de recuperação.</Body> : null}
        <Button title="Enviar link de recuperação" onPress={submit} loading={busy} />
        <LinkText href="/login">Voltar ao login</LinkText>
      </Card>
    </Screen>
  );
}
