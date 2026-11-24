import { useCallback, useEffect, useState } from 'react';
import { Button, Platform, ScrollView, Share, Text, View } from 'react-native';
import { listChildren } from '../lib/children';
import {
  deleteChild,
  deleteChildConversations,
  exportData,
  getRetention,
  RETENTION_CHOICES,
  setRetention,
} from '../lib/privacy';

type Child = { id: string; nickname: string };

/** Entrega o JSON: no navegador vira download; no celular abre o menu de compartilhar. */
async function deliver(json: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `tata-ia-dados-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    await Share.share({ message: json });
  }
}

/** Privacidade da família: retenção, exportação e exclusão de dados dos filhos. Cada exclusão pede um segundo toque. */
export default function Privacy() {
  const [days, setDays] = useState<number | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await getRetention();
    if (r.ok) setDays(r.data.days);
    else setMessage(r.message);
    setChildren((await listChildren()) as Child[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function chooseRetention(d: number) {
    const r = await setRetention(d);
    if (r.ok) {
      setDays(d);
      setMessage(`As conversas passam a ser apagadas depois de ${d} dias.`);
    } else setMessage(r.message);
  }

  async function doExport() {
    const r = await exportData();
    if (!r.ok) return setMessage(r.message);
    await deliver(r.data);
    setMessage('Dados exportados.');
  }

  async function run(key: string, action: () => Promise<string | null>) {
    if (confirm !== key) return setConfirm(key);
    setConfirm(null);
    setMessage(await action());
    await load();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Privacidade</Text>

      <Text style={{ fontSize: 18, fontWeight: '600' }}>Por quanto tempo guardar as conversas</Text>
      <Text>Conversas mais antigas são apagadas sozinhas. Alertas de crise ainda não resolvidos ficam até você resolver.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {RETENTION_CHOICES.map((d) => (
          <Button key={d} title={d === days ? `✓ ${d} dias` : `${d} dias`} onPress={() => chooseRetention(d)} />
        ))}
      </View>

      <Text style={{ fontSize: 18, fontWeight: '600' }}>Seus dados</Text>
      <Text>Baixe tudo o que a família tem no Tatá IA: filhos, conversas, alertas e registro de acessos.</Text>
      <Button title="Exportar dados da família" onPress={doExport} />

      <Text style={{ fontSize: 18, fontWeight: '600' }}>Apagar dados dos filhos</Text>
      {children.length === 0 ? <Text>Nenhum filho cadastrado.</Text> : null}
      {children.map((c) => (
        <View key={c.id} style={{ gap: 6 }}>
          <Text>{c.nickname}</Text>
          <Button
            title={confirm === `conv:${c.id}` ? 'Toque de novo para apagar as conversas' : 'Apagar conversas'}
            onPress={() =>
              run(`conv:${c.id}`, async () => {
                const r = await deleteChildConversations(c.id);
                return r.ok ? `${r.data.deleted} conversa(s) apagada(s).` : r.message;
              })
            }
          />
          <Button
            color="#b00020"
            title={confirm === `child:${c.id}` ? 'Toque de novo: apaga o filho e tudo dele' : 'Excluir conta do filho'}
            onPress={() =>
              run(`child:${c.id}`, async () => {
                const r = await deleteChild(c.id);
                return r.ok ? `${c.nickname} foi excluído(a).` : r.message;
              })
            }
          />
        </View>
      ))}
      {confirm ? <Button title="Cancelar" onPress={() => setConfirm(null)} /> : null}
      {message ? <Text accessibilityRole="alert">{message}</Text> : null}
    </ScrollView>
  );
}
