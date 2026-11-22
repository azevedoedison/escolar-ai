import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { conversationLabel, type ConversationItem } from '@tata/shared';
import { listConversations } from '../../lib/chat';

export default function Questions() {
  const [items, setItems] = useState<ConversationItem[] | null>(null);
  useEffect(() => {
    void listConversations().then(setItems);
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Minhas perguntas</Text>
      {items && items.length === 0 ? <Text>Você ainda não fez perguntas.</Text> : null}
      <FlatList
        data={items ?? []}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/chat', params: { id: item.id } }} style={{ paddingVertical: 12 }}>
            {conversationLabel(item)}
          </Link>
        )}
      />
      <Link href="/chat">Nova pergunta</Link>
    </View>
  );
}
