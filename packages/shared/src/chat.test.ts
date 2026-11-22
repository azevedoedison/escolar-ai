import { describe, expect, it } from 'vitest';
import { SUPERVISION_NOTICE, conversationLabel, isTypingDone, revealLength, suggestedQuestions } from './chat';

describe('chat', () => {
  it('aviso de supervisão fala dos pais', () => {
    expect(SUPERVISION_NOTICE.toLowerCase()).toContain('pais');
  });
  it('sugestões variam por idade e nunca ficam vazias', () => {
    expect(suggestedQuestions(8)).not.toEqual(suggestedQuestions(12));
    expect(suggestedQuestions(8).length).toBeGreaterThan(0);
  });
  it('efeito de digitação avança até o fim do texto', () => {
    expect(revealLength('olá mundo', 0)).toBe(0);
    expect(revealLength('olá mundo', 2)).toBe(6);
    expect(revealLength('olá', 99)).toBe(3);
    expect(isTypingDone('olá', 1)).toBe(true);
    expect(isTypingDone('olá mundo', 1)).toBe(false);
  });
  it('rótulo da conversa tem padrão', () => {
    expect(conversationLabel({ id: '1', title: '  ', startedAt: '' })).toBe('Conversa sem título');
    expect(conversationLabel({ id: '1', title: 'Rios', startedAt: '' })).toBe('Rios');
  });
});
