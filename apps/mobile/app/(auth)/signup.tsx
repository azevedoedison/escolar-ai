import { useState } from 'react';
import { Button, Switch, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { validateSignup, type SignupErrors } from '@tata/shared';
import { signUp } from '../../lib/auth';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const found = validateSignup({ name, email, password, consent });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const err = await signUp({ name, email, password, consent });
    if (err) return setMessage(err);
    router.replace('/');
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Criar conta de responsável</Text>
      <TextInput placeholder="Seu nome" value={name} onChangeText={setName} />
      {errors.name ? <Text>{errors.name}</Text> : null}
      <TextInput placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      {errors.email ? <Text>{errors.email}</Text> : null}
      <TextInput placeholder="Senha (mínimo 8 caracteres)" secureTextEntry value={password} onChangeText={setPassword} />
      {errors.password ? <Text>{errors.password}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Switch value={consent} onValueChange={setConsent} />
        <Text style={{ flex: 1 }}>
          Sou responsável legal pela criança e concordo com o tratamento dos dados dela para o funcionamento da Tatá IA,
          incluindo guardar as conversas para eu acompanhar.
        </Text>
      </View>
      {errors.consent ? <Text>{errors.consent}</Text> : null}
      {message ? <Text accessibilityRole="alert">{message}</Text> : null}
      <Button title="Criar conta" onPress={submit} />
      <Link href="/login">Já tenho conta</Link>
    </View>
  );
}
