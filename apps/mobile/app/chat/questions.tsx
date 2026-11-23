import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Link } from 'expo-router';
import { conversationLabel, type ConversationItem } from '@tata/shared';
import { listConversations } from '../../lib/chat';
import { Body, LinkText, Loading, Title } from '../../components/ui';
import { theme } from '../../lib/theme';

export default function Questions() {
  const [items, setItems] = useState<ConversationItem[] | null>(null);
  useEffect(() => {
    void listConversations().then(setItems);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 720, padding: 16, gap: 8 }}>
        <Title>Minhas perguntas</Title>
        {items === null ? <Loading /> : null}
        {items && items.length === 0 ? <Body>Você ainda não fez perguntas.</Body> : null}
        <FlatList
          data={items ?? []}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/chat', params: { id: item.id } }} style={{ paddingVertical: 12, color: theme.colors.text, fontSize: 15 }}>
              {conversationLabel(item)}
            </Link>
          )}
        />
        <LinkText href="/chat">Nova pergunta</LinkText>
      </View>
    </View>
  );
}
