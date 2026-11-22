import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createPairingCode } from '../../lib/pairing';

/** Tela do responsável: mostra o código de 6 dígitos (vale 10 minutos, uso único). */
export default function NewPairing() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    const r = childId ? await createPairingCode(childId) : null;
    if (!r) return setError('Não foi possível gerar o código.');
    setCode(r.code);
  }
  useEffect(() => {
    void generate();
  }, [childId]);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Parear aparelho</Text>
      <Text>No aparelho da criança, abra o app e digite este código. Ele vale por 10 minutos e só pode ser usado uma vez.</Text>
      {code ? <Text style={{ fontSize: 40, letterSpacing: 8 }} accessibilityLabel={`Código ${code.split('').join(' ')}`}>{code}</Text> : null}
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      <Button title="Gerar novo código" onPress={generate} />
    </View>
  );
}
