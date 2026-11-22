import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { parseChildLogin } from '@tata/shared';
import { childLogin } from '../lib/api';

/** Login da criança: PIN, ou e-mail e senha definidos pelo responsável. */
export default function ChildLogin() {
  const router = useRouter();
  const [usePin, setUsePin] = useState(true);
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const body = parseChildLogin(usePin ? { pin } : { email, password });
    if (!body) return setError(usePin ? 'O PIN tem de 4 a 6 números.' : 'Informe e-mail e senha.');
    const err = await childLogin(body);
    if (err) return setError(err);
    router.replace('/');
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Oi! Quem está aí?</Text>
      {usePin ? (
        <TextInput placeholder="Seu PIN" keyboardType="number-pad" secureTextEntry maxLength={6} value={pin} onChangeText={setPin} />
      ) : (
        <>
          <TextInput placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />
        </>
      )}
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      <Button title="Entrar" onPress={submit} />
      <Button title={usePin ? 'Entrar com e-mail e senha' : 'Entrar com PIN'} onPress={() => setUsePin(!usePin)} />
    </View>
  );
}
