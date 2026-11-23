import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SUPERVISION_NOTICE, isTypingDone, revealLength, suggestedQuestions, type ChatMessage } from '@tata/shared';
import { getChildSession } from '../../lib/child-session';
import { loadConversation, sendMessage } from '../../lib/chat';
import { Button, LinkText, Loading } from '../../components/ui';
import { theme } from '../../lib/theme';

const c = theme.colors;

const FALLBACK = 'Não consegui responder agora. Pode tentar de novo daqui a pouco?';

/** Mostra a resposta da Tatá aos poucos (efeito de digitação). */
function TypedText({ text, animate }: { text: string; animate: boolean }) {
  const [step, setStep] = useState(animate ? 0 : Number.MAX_SAFE_INTEGER);
  useEffect(() => {
    if (!animate || isTypingDone(text, step)) return;
    const t = setTimeout(() => setStep((s) => s + 1), 30);
    return () => clearTimeout(t);
  }, [animate, text, step]);
  return <Text style={{ color: c.text, fontSize: 15, lineHeight: 22 }}>{text.slice(0, revealLength(text, step))}</Text>;
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
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 720, padding: 16, gap: 8 }}>
        <Text accessibilityRole="text" style={{ backgroundColor: '#3b2a0a', color: '#fde68a', padding: 10, borderRadius: 10, fontSize: 13 }}>
          {SUPERVISION_NOTICE}
        </Text>
        <LinkText href="/chat/questions">Minhas perguntas</LinkText>
        {messages.length === 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '600' }}>Oi! Sobre o que você quer conversar?</Text>
            {suggestedQuestions(age).map((q) => (
              <Pressable
                key={q}
                accessibilityRole="button"
                onPress={() => void send(q)}
                style={{ padding: 12, borderWidth: 1, borderColor: c.border, borderRadius: 10, backgroundColor: c.card, minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ color: c.text }}>{q}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <FlatList
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf: item.role === 'child' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: 10,
                marginVertical: 4,
                borderRadius: 14,
                backgroundColor: item.role === 'child' ? c.primary : c.card,
                borderWidth: item.role === 'child' ? 0 : 1,
                borderColor: c.border,
              }}
            >
              {item.role === 'tata' ? (
                <TypedText text={item.content} animate={item.id === typingId} />
              ) : (
                <Text style={{ color: c.text, fontSize: 15, lineHeight: 22 }}>{item.content}</Text>
              )}
            </View>
          )}
          ListFooterComponent={waiting ? <Loading label="A Tatá está escrevendo…" /> : undefined}
        />
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            style={{ flex: 1, minHeight: 44, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 12, backgroundColor: c.input, color: c.text, fontSize: 16 }}
            placeholderTextColor={c.textMuted}
            placeholder="Escreva sua pergunta"
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => void send(text)}
          />
          <View style={{ width: 110 }}>
            <Button title="Enviar" onPress={() => void send(text)} disabled={waiting || !text.trim()} />
          </View>
        </View>
      </View>
    </View>
  );
}
