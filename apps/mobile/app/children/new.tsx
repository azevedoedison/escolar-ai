import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AVATARS, validateChild, type ChildErrors } from '@tata/shared';
import { createChild } from '../../lib/children';

export default function NewChild() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [grade, setGrade] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<ChildErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const input = { nickname, birthYear: Number(birthYear), grade, avatar, pin };
    const found = validateChild(input);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const err = await createChild(input);
    if (err) return setMessage(err);
    router.back();
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Cadastrar filho(a)</Text>
      <TextInput placeholder="Apelido" value={nickname} onChangeText={setNickname} />
      {errors.nickname ? <Text>{errors.nickname}</Text> : null}
      <TextInput placeholder="Ano de nascimento" keyboardType="number-pad" value={birthYear} onChangeText={setBirthYear} />
      {errors.birthYear ? <Text>{errors.birthYear}</Text> : null}
      <TextInput placeholder="Série (opcional)" value={grade} onChangeText={setGrade} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {AVATARS.map((a) => (
          <Button key={a} title={a === avatar ? `✓ ${a}` : a} onPress={() => setAvatar(a)} />
        ))}
      </View>
      <TextInput placeholder="PIN (4 a 6 números)" secureTextEntry keyboardType="number-pad" maxLength={6} value={pin} onChangeText={setPin} />
      {errors.pin ? <Text>{errors.pin}</Text> : null}
      {message ? <Text accessibilityRole="alert">{message}</Text> : null}
      <Button title="Salvar" onPress={submit} />
    </View>
  );
}
