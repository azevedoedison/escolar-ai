import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createPairingCode } from '../../lib/pairing';
import { Body, Button, Card, ErrorText, LinkText, Loading, Screen, Title } from '../../components/ui';
import { theme } from '../../lib/theme';

/** Tela do responsável: mostra o código de 6 dígitos (vale 10 minutos, uso único). */
export default function NewPairing() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setError(null);
    setCode(null);
    if (!childId) return setError('Escolha o filho antes de gerar o código. Entre pela lista de filhos.');
    setBusy(true);
    const r = await createPairingCode(childId);
    setBusy(false);
    if (!r) return setError('Não foi possível gerar o código. Entre como responsável e tente de novo.');
    setCode(r.code);
  }
  useEffect(() => {
    void generate();
  }, [childId]);

  return (
    <Screen>
      <Card>
        <Title>Parear aparelho</Title>
        <Body>No aparelho da criança, abra o app e digite este código. Ele vale por 10 minutos e só pode ser usado uma vez.</Body>
        {busy ? <Loading label="Gerando código…" /> : null}
        {code ? (
          <Text
            style={{ color: theme.colors.text, fontSize: 40, letterSpacing: 8, fontWeight: '700', textAlign: 'center' }}
            accessibilityLabel={`Código ${code.split('').join(' ')}`}
          >
            {code}
          </Text>
        ) : null}
        <ErrorText>{error}</ErrorText>
        <Button title="Gerar novo código" onPress={generate} loading={busy} />
        <LinkText href="/devices">Ver aparelhos conectados</LinkText>
        <LinkText href="/">Voltar ao início</LinkText>
      </Card>
    </Screen>
  );
}
