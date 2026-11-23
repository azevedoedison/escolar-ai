import { useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { isPairingCode } from '@tata/shared';
import { pairDevice } from '../lib/api';
import { Body, Button, Card, ErrorText, Field, LinkText, Screen, Title } from '../components/ui';

/** Tela do aparelho da criança: digita o código gerado pelo responsável. */
export default function Pair() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!isPairingCode(code)) return setError('O código tem 6 números.');
    const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
    setBusy(true);
    const err = await pairDevice(code, platform);
    setBusy(false);
    if (err) return setError(err);
    router.replace('/child-login');
  }

  return (
    <Screen>
      <Card>
        <Title>Conectar este aparelho</Title>
        <Body>Peça ao responsável o código de 6 números que aparece no aparelho dele.</Body>
        <Field label="Código" placeholder="6 números" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
        <ErrorText>{error}</ErrorText>
        <Button title="Conectar" onPress={submit} loading={busy} />
        <LinkText href="/">Voltar ao início</LinkText>
      </Card>
    </Screen>
  );
}
