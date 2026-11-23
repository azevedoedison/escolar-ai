import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Switch, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  DECISION_LABELS,
  categoryLabel,
  isHighlighted,
  isIsoDate,
  plainText,
  type TimelineFilters,
  type TimelineItem,
} from '@tata/shared';
import { loadTimeline } from '../../lib/guardian';

const ALERT_LABELS = { new: 'Alerta novo', seen: 'Alerta visto', resolved: 'Alerta resolvido' } as const;
const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

/**
 * Linha do tempo de um filho (M-30) com filtros e busca (M-31).
 * Todo conteúdo da criança entra só como filho de <Text>: nunca HTML (defeito S4).
 */
export default function Timeline() {
  const router = useRouter();
  const { childId, nickname } = useLocalSearchParams<{ childId: string; nickname?: string }>();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [alerts, setAlerts] = useState(false);
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState<TimelineFilters>({});
  const run = useRef(0);

  const fetchPage = useCallback(
    async (filters: TimelineFilters, cursor: string | null) => {
      const id = ++run.current;
      setLoading(true);
      setError(null);
      const r = await loadTimeline(childId, filters, cursor);
      if (id !== run.current) return; // chegou uma busca mais nova
      setLoading(false);
      if (!r.ok) {
        if (r.expired) return router.replace('/guardian-mode');
        return setError(r.message);
      }
      setItems((prev) => (cursor ? [...prev, ...r.data.items] : r.data.items));
      setNext(r.data.nextCursor);
    },
    [childId, router],
  );

  useEffect(() => {
    void fetchPage(applied, null);
  }, [applied, fetchPage]);

  function apply() {
    if ((from && !isIsoDate(from)) || (to && !isIsoDate(to))) return setError('Use datas no formato AAAA-MM-DD.');
    if (from && to && from > to) return setError('A data inicial vem depois da final.');
    setApplied({ from: from || undefined, to: to || undefined, blocked, alerts, q: q.trim() || undefined });
  }

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, gap: 12 }}
      data={items}
      keyExtractor={(i) => i.id}
      onEndReached={() => next && !loading && void fetchPage(applied, next)}
      ListHeaderComponent={
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '600' }}>Conversas{nickname ? ` de ${plainText(nickname)}` : ''}</Text>
          <TextInput placeholder="Buscar no texto" value={q} onChangeText={setQ} maxLength={100} />
          <TextInput placeholder="De (AAAA-MM-DD)" value={from} onChangeText={setFrom} autoCapitalize="none" />
          <TextInput placeholder="Até (AAAA-MM-DD)" value={to} onChangeText={setTo} autoCapitalize="none" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Switch value={blocked} onValueChange={setBlocked} accessibilityLabel="Só bloqueadas" />
            <Text>Só bloqueadas</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Switch value={alerts} onValueChange={setAlerts} accessibilityLabel="Só alertas" />
            <Text>Só alertas</Text>
          </View>
          <Button title="Filtrar" onPress={apply} />
          {error ? <Text accessibilityRole="alert">{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={<Text>{loading ? '' : 'Nenhuma conversa encontrada.'}</Text>}
      ListFooterComponent={<>{loading ? <ActivityIndicator /> : null}</>}
      renderItem={({ item }) => (
        <View
          style={{
            padding: 12,
            gap: 4,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isHighlighted(item.decision) ? '#c0392b' : '#ddd',
            backgroundColor: isHighlighted(item.decision) ? '#fdecea' : '#fff',
          }}
        >
          <Text style={{ fontSize: 12, color: '#555' }}>{fmt(item.createdAt)}</Text>
          <Text style={{ fontWeight: '600' }}>{plainText(item.question)}</Text>
          <Text>{item.answer === null ? 'Sem resposta.' : plainText(item.answer)}</Text>
          <Text style={{ fontSize: 12 }}>
            {DECISION_LABELS[item.decision]} · {categoryLabel(item.category)}
            {item.alert ? ` · ${ALERT_LABELS[item.alert]}` : ''}
          </Text>
        </View>
      )}
    />
  );
}
