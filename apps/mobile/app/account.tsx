import { useState } from 'react';
import { useRouter } from 'expo-router';
import { deleteAccount } from '../lib/account';
import { Body, Button, Card, ErrorText, Field, LinkText, Screen, Title } from '../components/ui';

/** Conta do responsável: excluir a conta (recusada enquanto houver filhos). */
export default function Account() {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setError(null);
    setBusy(true);
    const err = await deleteAccount();
    setBusy(false);
    if (err) return setError(err);
    router.replace('/');
  }

  return (
    <Screen>
      <Card>
        <Title>Minha conta</Title>
        {asking ? (
          <>
            <Body>Excluir a conta apaga a família e não dá para desfazer. Só é possível sem filhos cadastrados. Digite EXCLUIR para confirmar.</Body>
            <Field label="Confirmação" placeholder="EXCLUIR" autoCapitalize="characters" value={typed} onChangeText={setTyped} />
            <ErrorText>{error}</ErrorText>
            <Button title="Excluir minha conta" onPress={remove} loading={busy} disabled={typed !== 'EXCLUIR'} />
            <Button title="Cancelar" variant="secondary" onPress={() => { setAsking(false); setTyped(''); setError(null); }} />
          </>
        ) : (
          <Button title="Excluir minha conta" variant="secondary" onPress={() => setAsking(true)} />
        )}
        <LinkText href="/children">Meus filhos</LinkText>
        <LinkText href="/">Voltar ao início</LinkText>
      </Card>
    </Screen>
  );
}
