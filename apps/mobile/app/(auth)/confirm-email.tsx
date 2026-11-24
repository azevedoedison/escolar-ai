import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { confirmEmail } from '../../lib/api';

export default function ConfirmEmail() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [state, setState] = useState<'loading' | 'ok' | string>('loading');

  useEffect(() => {
    if (!token) return setState('Este link não vale mais. Entre e peça um novo e-mail de confirmação.');
    confirmEmail(token).then((err) => setState(err ?? 'ok'));
  }, [token]);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Confirmar e-mail</Text>
      {state === 'loading' ? <Text>Confirmando…</Text> : state === 'ok' ? <Text>E-mail confirmado! Já pode entrar.</Text> : <Text accessibilityRole="alert">{state}</Text>}
      <Link href="/login">Entrar</Link>
    </View>
  );
}
