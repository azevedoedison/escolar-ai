import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { SUPERVISION_NOTICE, isTypingDone, revealLength, suggestedQuestions, type ChatMessage } from '@tata/shared';
import { getChildSession } from '../../lib/child-session';
import { loadConversation, sendMessage } from '../../lib/chat';

const FALLBACK = 'Não consegui responder agora. Pode tentar de novo daqui a pouco?';

/** Mostra a resposta da Tatá aos poucos (efeito de digitação). */
function TypedText({ text, animate }: { text: string; animate: boolean }) {
  const [step, setStep] = useState(animate ? 0 : Number.MAX_SAFE_INTEGER);
  useEffect(() => {
    if (!animate || isTypingDone(text, step)) return;
    const t = setTimeout(() => setStep((s) => s + 1), 30);
    return () => clearTimeout(t);
  }, [animate, text, step]);
  return <Text>{text.slice(0, revealLength(text, step))}</Text>;
}

export default function Chat() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [conversationId, setConversationId] = useState<string | undefined>(id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [waiting, setWaiting] = useState(false);
  const counter = useRef(0);
  const age = getChildSession()?.age ?? 11;

  useEffect(() => {
    if (id) void loadConversation(id).then(setMessages);
  }, [id]);

  async function send(raw: string) {
    const message = raw.trim();
    if (!message || waiting) return;
    setText('');
    setWaiting(true);
    setMessages((m) => [...m, { id: `local-${counter.current++}`, role: 'child', content: message }]);
    const reply = await sendMessage(message, conversationId);
    setWaiting(false);
    if (!reply) {
      setMessages((m) => [...m, { id: `local-${counter.current++}`, role: 'tata', content: FALLBACK }]);
      return;
    }
    setConversationId(reply.conversationId);
    setTypingId(reply.message.id);
    setMessages((m) => [...m, reply.message]);
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 8 }}>
      <Text accessibilityRole="text" style={{ backgroundColor: '#fff3cd', padding: 8, borderRadius: 8 }}>
        {SUPERVISION_NOTICE}
      </Text>
      <Link href="/chat/questions">Minhas perguntas</Link>
      {messages.length === 0 ? (
        <View style={{ gap: 8 }}>
          <Text>Oi! Sobre o que você quer conversar?</Text>
          {suggestedQuestions(age).map((q) => (
            <Pressable key={q} accessibilityRole="button" onPress={() => void send(q)} style={{ padding: 10, borderWidth: 1, borderRadius: 8 }}>
              <Text>{q}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <FlatList
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={{ alignSelf: item.role === 'child' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: 10, marginVertical: 4, borderRadius: 12, backgroundColor: item.role === 'child' ? '#dbeafe' : '#f1f5f9' }}>
            {item.role === 'tata' ? <TypedText text={item.content} animate={item.id === typingId} /> : <Text>{item.content}</Text>}
          </View>
        )}
        ListFooterComponent={waiting ? <ActivityIndicator accessibilityLabel="A Tatá está escrevendo" /> : undefined}
      />
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 8 }} placeholder="Escreva sua pergunta" value={text} onChangeText={setText} onSubmitEditing={() => void send(text)} />
        <Button title="Enviar" onPress={() => void send(text)} disabled={waiting} />
      </View>
    </View>
  );
}
