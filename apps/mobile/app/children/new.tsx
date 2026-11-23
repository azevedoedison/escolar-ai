import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AVATARS, validateChild, type ChildErrors } from '@tata/shared';
import { createChild } from '../../lib/children';
import { Body, Button, Card, Chip, ErrorText, Field, LinkText, Screen, Title } from '../../components/ui';

export default function NewChild() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [grade, setGrade] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<ChildErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const input = { nickname, birthYear: Number(birthYear), grade, avatar, pin };
    const found = validateChild(input);
    setErrors(found);
    setMessage(null);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    const err = await createChild(input);
    setBusy(false);
    if (err) return setMessage(err);
    router.back();
  }

  return (
    <Screen>
      <Card>
        <Title>Cadastrar filho(a)</Title>
        <Field label="Apelido" placeholder="Como a criança gosta de ser chamada" value={nickname} onChangeText={setNickname} />
        <ErrorText>{errors.nickname}</ErrorText>
        <Field label="Ano de nascimento" placeholder="Ex.: 2014" keyboardType="number-pad" value={birthYear} onChangeText={setBirthYear} />
        <ErrorText>{errors.birthYear}</ErrorText>
        <Field label="Série (opcional)" placeholder="Ex.: 6º ano" value={grade} onChangeText={setGrade} />
        <Body>Escolha um avatar</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {AVATARS.map((a) => (
            <Chip key={a} label={a} selected={a === avatar} onPress={() => setAvatar(a)} />
          ))}
        </View>
        <Field label="PIN da criança" placeholder="4 a 6 números" secureTextEntry keyboardType="number-pad" maxLength={6} value={pin} onChangeText={setPin} />
        <ErrorText>{errors.pin}</ErrorText>
        <ErrorText>{message}</ErrorText>
        <Button title="Salvar" onPress={submit} loading={busy} />
        <LinkText href="/">Voltar ao início</LinkText>
      </Card>
    </Screen>
  );
}
