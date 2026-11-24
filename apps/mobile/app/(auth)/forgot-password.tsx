import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { validateForgot } from '@tata/shared';
import { forgotPassword } from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const errors = validateForgot(email);
    if (errors.email) return setMessage(errors.email);
    // A resposta é a mesma exista a conta ou não.
    setMessage(await forgotPassword(email));
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Esqueci a senha</Text>
      <Text>Informe o e-mail da sua conta. Se ela existir, enviamos um link para escolher uma nova senha (vale por 1 hora).</Text>
      <TextInput placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      {message ? <Text accessibilityRole="alert">{message}</Text> : null}
      <Button title="Enviar link" onPress={submit} />
      <Link href="/login">Voltar para entrar</Link>
    </View>
  );
}
