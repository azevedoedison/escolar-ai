import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { enterGuardianMode } from '../lib/api';

/** Trocar para o modo Responsável no aparelho da criança exige e-mail e senha do responsável. */
export default function GuardianMode() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const err = await enterGuardianMode(email.trim(), password);
    if (err) return setError(err);
    router.replace('/guardian');
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Modo Responsável</Text>
      <TextInput placeholder="E-mail do responsável" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Senha do responsável" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      <Button title="Entrar" onPress={submit} />
    </View>
  );
}
