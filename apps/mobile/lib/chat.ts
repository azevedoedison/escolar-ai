import type { ChatReply, ChatMessage, ConversationItem } from '@tata/shared';
import { getChildSession } from './child-session';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function call<T>(path: string, init?: RequestInit): Promise<T | null> {
  const session = getChildSession();
  if (!session) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.token}` },
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Envia só a mensagem nova e o id da conversa: o histórico mora no servidor. */
export const sendMessage = (message: string, conversationId?: string) =>
  call<ChatReply>('/chat', { method: 'POST', body: JSON.stringify({ message, conversationId }) });

export async function listConversations(): Promise<ConversationItem[]> {
  return (await call<{ conversations: ConversationItem[] }>('/conversations'))?.conversations ?? [];
}

export async function loadConversation(id: string): Promise<ChatMessage[]> {
  return (await call<{ messages: ChatMessage[] }>(`/conversations/${id}`))?.messages ?? [];
}
