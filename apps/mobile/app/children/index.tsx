import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteChild, listChildren } from '../../lib/children';
import { Body, Button, Card, ErrorText, Field, LinkText, Loading, Screen, Title } from '../../components/ui';
import { theme } from '../../lib/theme';

type Row = { id: string; nickname: string; grade: string | null; avatar: string; active: boolean };

/** Lista de filhos do responsável, com parear aparelho e excluir (confirmação escrita). */
export default function Children() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => setRows((await listChildren()) as Row[]), []);
  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: string) {
    setError(null);
    setBusy(true);
    const err = await deleteChild(id);
    setBusy(false);
    if (err) return setError(err);
    setConfirming(null);
    setTyped('');
    await load();
  }

  return (
    <Screen>
      <Card>
        <Title>Meus filhos</Title>
        {rows === null ? <Loading /> : null}
        {rows?.length === 0 ? <Body>Nenhum filho cadastrado.</Body> : null}
        {rows?.map((c) => (
          <View key={c.id} style={{ gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
              {c.nickname} · {c.avatar}
              {c.grade ? ` · ${c.grade}` : ''}
            </Text>
            <Button title="Parear aparelho" variant="secondary" onPress={() => router.push({ pathname: '/pairing/new', params: { childId: c.id } })} />
            {confirming === c.id ? (
              <>
                <Body>Isso apaga as conversas e os dados de {c.nickname}, e não dá para desfazer. Digite EXCLUIR para confirmar.</Body>
                <Field label="Confirmação" placeholder="EXCLUIR" autoCapitalize="characters" value={typed} onChangeText={setTyped} />
                <Button title="Excluir de vez" onPress={() => remove(c.id)} loading={busy} disabled={typed !== 'EXCLUIR'} />
                <Button title="Cancelar" variant="secondary" onPress={() => { setConfirming(null); setTyped(''); setError(null); }} />
              </>
            ) : (
              <Button title="Excluir filho(a)" variant="secondary" onPress={() => { setConfirming(c.id); setTyped(''); setError(null); }} />
            )}
          </View>
        ))}
        <ErrorText>{error}</ErrorText>
        <LinkText href="/children/new">Cadastrar filho(a)</LinkText>
        <LinkText href="/account">Minha conta</LinkText>
        <LinkText href="/">Voltar ao início</LinkText>
      </Card>
    </Screen>
  );
}
