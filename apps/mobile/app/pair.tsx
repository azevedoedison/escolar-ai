import { useState } from 'react';
import { Button, Platform, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { isPairingCode } from '@tata/shared';
import { pairDevice } from '../lib/api';

/** Tela do aparelho da criança: digita o código gerado pelo responsável. */
export default function Pair() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!isPairingCode(code)) return setError('O código tem 6 números.');
    const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
    const err = await pairDevice(code, platform);
    if (err) return setError(err);
    router.replace('/child-login');
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Conectar este aparelho</Text>
      <TextInput placeholder="Código de 6 números" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      <Button title="Conectar" onPress={submit} />
    </View>
  );
}
