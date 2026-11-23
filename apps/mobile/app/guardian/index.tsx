import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { listGuardianChildren, type GuardianChild } from '../../lib/guardian';

/** Painel dos pais: escolher o filho para ver a linha do tempo. */
export default function GuardianHome() {
  const router = useRouter();
  const [children, setChildren] = useState<GuardianChild[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listGuardianChildren().then((r) => {
      if (r.ok) return setChildren(r.data.children);
      if (r.expired) return router.replace('/guardian-mode');
      setError(r.message);
    });
  }, [router]);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Painel dos pais</Text>
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      {children?.length === 0 ? <Text>Nenhum filho cadastrado.</Text> : null}
      {children?.map((c) => (
        <Button
          key={c.id}
          title={`Ver conversas de ${c.nickname}`}
          onPress={() => router.push({ pathname: '/guardian/[childId]', params: { childId: c.id, nickname: c.nickname } })}
        />
      ))}
      <Button title="Aparelhos conectados" onPress={() => router.push('/devices')} />
    </View>
  );
}
