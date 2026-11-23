import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { validateLogin } from '@tata/shared';
import { signIn } from '../../lib/auth';
import { guardianLogin } from '../../lib/api';

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
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Entrar (responsável)</Text>
      <TextInput placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      <Button title="Entrar" onPress={submit} />
      <Link href="/signup">Criar conta</Link>
    </View>
  );
}
