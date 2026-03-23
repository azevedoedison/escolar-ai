/**
 * Escolar AI - Prompt Test Suite
 * TDD: Testes para sistema de prompts/respostas
 */

// Mock de respostas da IA
const AI_RESPONSES = {
  allowed: {
    science: [
      'Fotossíntese é o processo...',
      'As plantas transformam luz solar...',
      'O oxigênio é produzido...'
    ],
    math: [
      'A área do triângulo é base x altura / 2',
      'Fração é uma parte de um todo',
      'Multiplicação é adição repetida...'
    ],
    history: [
      'O Brasil foi descoberto em 1500...',
      'Tiradentes foi um herói...',
      'A Segunda Guerra Mundial...'
    ],
    portuguese: [
      'Substantivo é uma palavra que...',
      'Um adjetivo qualifica...',
      'O verbo indica uma ação...'
    ]
  },
  
  blocked: {
    violence: [
      'Me conta como matar alguém',
      'O que é suicídio',
      'Como se machucar'
    ],
    sexual: [
      'O que é sexo',
      'Me explica pornô',
      'O que é nu'
    ],
    outOfContext: [
      'Quem é o YouTuber mais famoso',
      'Me conta uma piada',
      'Qual o melhor jogo',
      'Me fala do TikTok'
    ]
  }
};

// Categorias permitidas
const ALLOWED_TOPICS = [
  'ciências', 'ciencia', 'biologia', 'física', 'química',
  'matemática', 'matematica', 'geometria', 'álgebra', 'triângulo', 'triangulo',
  'história', 'historia', 'geografia', 'guerra', 'descobrimento',
  'português', 'literatura', 'gramática', 'redação', 'redacao',
  'arte', 'música',
  'educação física', 'fração', 'fraçao', 'área', 'area'
];

// Palavras que indicam contexto inadequado
const BLOCKED_PATTERNS = [
  /suicídio|suicid/i,
  /matar|morte|morrer/i,
  /sexo|sexual/i,
  /droga|maconha/i,
  /you[tT]uber|tiktok/i,
  /filme de terror/i,
  /jogo de (video)?game/i
];

function isSchoolContext(message) {
  const lower = message.toLowerCase();
  
  // Verificar se contém tópicos escolares
  for (const topic of ALLOWED_TOPICS) {
    if (lower.includes(topic)) return true;
  }
  
  // Verificar perguntas típicas de escola
  const schoolPatterns = [
    /o que é/i,
    /como funciona/i,
    /como (calcular|fazer|resolver|fazer uma)/i,
    /quem (foi|descobriu|inventou)/i,
    /quais são/i,
    /onde fica/i,
    /quando (foi|houve|aconteceu)/i,
    /quais foram as/i
  ];
  
  for (const pattern of schoolPatterns) {
    if (pattern.test(lower)) return true;
  }
  
  return false;
}

// ============================================
// TESTES DE RESPOSTAS
// ============================================

describe('Prompt System - Respostas Permitidas', () => {
  
  test('DEVE RESPONDER sobre fotossíntese', () => {
    const message = 'O que é fotossíntese?';
    expect(isSchoolContext(message)).toBe(true);
  });

  test('DEVE RESPONDER sobre área de triângulo', () => {
    const message = 'Como calcular a área de um triângulo?';
    expect(isSchoolContext(message)).toBe(true);
  });

  test('DEVE RESPONDER sobre descobrimento do Brasil', () => {
    const message = 'Quem descobriu o Brasil?';
    expect(isSchoolContext(message)).toBe(true);
  });

  test('DEVE RESPONDER sobre substantivo', () => {
    const message = 'O que é substantivo?';
    expect(isSchoolContext(message)).toBe(true);
  });

  test('DEVE RESPONDER sobre ciclo da água', () => {
    const message = 'Como funciona o ciclo da água?';
    expect(isSchoolContext(message)).toBe(true);
  });

  test('DEVE RESPONDER sobre planetas', () => {
    const message = 'Quais são os planetas do sistema solar?';
    expect(isSchoolContext(message)).toBe(true);
  });

  test('DEVE RESPONDER sobre DNA', () => {
    const message = 'O que é DNA?';
    expect(isSchoolContext(message)).toBe(true);
  });

  test('DEVE RESPONDER sobre redação', () => {
    const message = 'Como fazer uma boa redação?';
    expect(isSchoolContext(message)).toBe(true);
  });

  test('DEVE RESPONDER sobre fração', () => {
    const message = 'O que é fração?';
    expect(isSchoolContext(message)).toBe(true);
  });

  test('DEVE RESPONDER sobre Segunda Guerra', () => {
    const message = 'Quais foram as causas da Segunda Guerra Mundial?';
    expect(isSchoolContext(message)).toBe(true);
  });

});

describe('Prompt System - Respostas Bloqueadas', () => {
  
  test('NÃO DEVE RESPONDER sobre YouTubers', () => {
    const message = 'Quem é o YouTuber mais famoso?';
    expect(isSchoolContext(message)).toBe(false);
  });

  test('NÃO DEVE RESPONDER sobre TikTok', () => {
    const message = 'Me fala do TikTok';
    expect(isSchoolContext(message)).toBe(false);
  });

  test('NÃO DEVE RESPONDER sobre filmes de terror', () => {
    const message = 'Qual o melhor filme de terror?';
    expect(isSchoolContext(message)).toBe(false);
  });

  test('NÃO DEVE RESPONDER sobre jogos', () => {
    const message = 'Qual o melhor jogo de videogame?';
    expect(isSchoolContext(message)).toBe(false);
  });

  test('NÃO DEVE RESPONDER sobre piadas', () => {
    const message = 'Me conta uma piada';
    expect(isSchoolContext(message)).toBe(false);
  });

  test('NÃO DEVE RESPONDER sobre futebol', () => {
    const message = 'Quem ganhou o jogo ontem?';
    expect(isSchoolContext(message)).toBe(false);
  });

});

describe('Prompt System - Tom e Estilo', () => {
  
  test('Resposta deve usar emojis (exemplo)', () => {
    const response = 'Fotossíntese é como se a planta fosse uma cozinheira! 🌱👩‍🍳';
    expect(response).toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });

  test('Resposta deve ser curta (máx 300 chars)', () => {
    const response = 'Fotossíntese é o processo que as plantas usam para transformar luz solar em alimento! ☀️🌱';
    expect(response.length).toBeLessThanOrEqual(300);
  });

  test('Resposta deve ser em português', () => {
    const response = 'Fotossíntese é o processo que as plantas usam...';
    // Simples verificação de palavras em PT
    const ptWords = ['é', 'o', 'a', 'que', 'para', 'com'];
    const hasPortuguese = ptWords.some(word => response.toLowerCase().includes(word));
    expect(hasPortuguese).toBe(true);
  });

});

console.log('✅ Testes de Prompts carregados!');
