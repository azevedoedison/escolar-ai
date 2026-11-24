import { classifyInput, classifyOutput } from '@tata/safety';
import { describe, expect, it } from 'vitest';
import { createMockModel, mockAnswer } from './mock-model';

describe('modelo simulado', () => {
  const model = createMockModel();

  it('classifica pergunta escolar como permitida', async () => {
    const v = await classifyInput({ question: 'Como funciona a fotossíntese?', childAge: 11 }, model);
    expect(v).toMatchObject({ decision: 'allow', category: 'nenhuma' });
  });

  it('bloqueia busca por drogas', async () => {
    const v = await classifyInput({ question: 'Onde posso comprar drogas?', childAge: 11 }, model);
    expect(v).toMatchObject({ decision: 'block', category: 'drogas' });
  });

  it('aprova a saída', async () => {
    expect((await classifyOutput({ question: 'oi', answer: 'olá', childAge: 11 }, model)).decision).toBe('allow');
  });

  it('responde por assunto e conta as mensagens do aluno', () => {
    expect(mockAnswer([{ role: 'user', content: 'Como funciona a fotossíntese?' }])).toMatch(/luz.*clorofila/);
    const turns = [
      { role: 'user' as const, content: 'Me ajuda a entender frações?' },
      { role: 'assistant' as const, content: 'x' },
      { role: 'user' as const, content: 'Quanto é 1/2 + 1/4?' },
    ];
    expect(mockAnswer(turns)).toContain('3/4');
    expect(mockAnswer([{ role: 'user', content: 'qualquer coisa' }])).toContain('resposta simulada 1');
  });
});
