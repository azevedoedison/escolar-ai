import { useState } from 'react';
import { useRouter } from 'expo-router';
import { validateLogin } from '@tata/shared';
import { signIn } from '../../lib/auth';
import { guardianLogin } from '../../lib/api';
import { Button, Card, ErrorText, Field, LinkText, Screen, Title } from '../../components/ui';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const errors = validateLogin(email, password);
    if (errors.email ?? errors.password) return setError(errors.email ?? errors.password ?? null);
    const err = await signIn(email, password);
    if (err) return setError(err);
    // A mesma conta abre o painel dos pais na API, em qualquer aparelho.
    const apiErr = await guardianLogin(email, password);
    if (apiErr) return setError(apiErr);
    router.replace('/');
  }

  return (
    <Screen>
      <Card>
        <Title>Entrar (responsável)</Title>
        <Field label="E-mail" placeholder="voce@exemplo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Field label="Senha" placeholder="Sua senha" secureTextEntry value={password} onChangeText={setPassword} />
        <ErrorText>{error}</ErrorText>
        <Button title="Entrar" onPress={submit} />
        <LinkText href="/signup">Criar conta</LinkText>
        <LinkText href="/">Voltar ao início</LinkText>
      </Card>
    </Screen>
  );
}
