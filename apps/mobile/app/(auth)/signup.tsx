import { useState } from 'react';
import { Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { validateSignup, type SignupErrors } from '@tata/shared';
import { signUp } from '../../lib/auth';
import { Body, Button, Card, ErrorText, Field, LinkText, Screen, Title } from '../../components/ui';

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
    <Screen>
      <Card>
        <Title>Criar conta de responsável</Title>
        <Field label="Seu nome" placeholder="Nome e sobrenome" value={name} onChangeText={setName} />
        <ErrorText>{errors.name}</ErrorText>
        <Field label="E-mail" placeholder="voce@exemplo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <ErrorText>{errors.email}</ErrorText>
        <Field label="Senha" placeholder="Mínimo de 8 caracteres" secureTextEntry value={password} onChangeText={setPassword} />
        <ErrorText>{errors.password}</ErrorText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Switch value={consent} onValueChange={setConsent} />
          <View style={{ flex: 1 }}>
            <Body>
              Sou responsável legal pela criança e concordo com o tratamento dos dados dela para o funcionamento da Tatá IA,
              incluindo guardar as conversas para eu acompanhar.
            </Body>
          </View>
        </View>
        <ErrorText>{errors.consent}</ErrorText>
        <ErrorText>{message}</ErrorText>
        <Button title="Criar conta" onPress={submit} />
        <LinkText href="/login">Já tenho conta</LinkText>
        <LinkText href="/">Voltar ao início</LinkText>
      </Card>
    </Screen>
  );
}
