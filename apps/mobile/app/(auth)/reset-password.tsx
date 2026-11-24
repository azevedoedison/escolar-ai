import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { validateNewPassword } from '@tata/shared';
import { resetPassword } from '../../lib/api';

export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!token) return setMessage('Este link não vale mais. Peça um novo.');
    const errors = validateNewPassword(password, confirmation);
    const found = errors.password ?? errors.confirmation;
    if (found) return setMessage(found);
    const err = await resetPassword(token, password);
    if (err) return setMessage(err);
    setDone(true);
  }

  if (done) {
    return (
      <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '600' }}>Senha trocada</Text>
        <Text>Por segurança, você saiu de todos os aparelhos. Entre de novo com a senha nova.</Text>
        <Link href="/login">Entrar</Link>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Nova senha</Text>
      <TextInput placeholder="Senha nova (mínimo 8 caracteres)" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput placeholder="Repita a senha" secureTextEntry value={confirmation} onChangeText={setConfirmation} />
      {message ? <Text accessibilityRole="alert">{message}</Text> : null}
      <Button title="Trocar senha" onPress={submit} />
      <Link href="/forgot-password">Pedir um novo link</Link>
    </View>
  );
}
