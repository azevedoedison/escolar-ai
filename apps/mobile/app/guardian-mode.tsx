import { useState } from 'react';
import { useRouter } from 'expo-router';
import { enterGuardianMode } from '../lib/api';
import { Body, Button, Card, ErrorText, Field, LinkText, Screen, Title } from '../components/ui';

/** Trocar para o modo Responsável no aparelho da criança exige e-mail e senha do responsável. */
export default function GuardianMode() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    const err = await enterGuardianMode(email.trim(), password);
    setBusy(false);
    if (err) return setError(err);
    router.replace('/devices');
  }

  return (
    <Screen>
      <Card>
        <Title>Modo Responsável</Title>
        <Body>Para continuar, confirme o e-mail e a senha do responsável.</Body>
        <Field label="E-mail do responsável" placeholder="voce@exemplo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Field label="Senha do responsável" placeholder="Sua senha" secureTextEntry value={password} onChangeText={setPassword} />
        <ErrorText>{error}</ErrorText>
        <Button title="Entrar" onPress={submit} loading={busy} />
        <LinkText href="/child-login">Voltar para a criança</LinkText>
      </Card>
    </Screen>
  );
}
