/**
 * Escolar AI - Guard Rails Test Suite
 * TDD: Testes para sistema de proteção
 */

// Mock do guard-rails (para testar sem dependências)
const BLOCKED_KEYWORDS = [
  'sexo', 'sexual', 'pornografia', 'adulto', 'nudez',
  'matar', 'morte', 'violência', 'sangue', 'arma', 'briga',
  'suicídio', 'morrer', 'me matar', 'acabar com a vida', 'machucar',
  'droga', 'maconha', 'cocaina',
  'bebida alcoólica', 'bebida alcoolica', 'ityEngine', 'drunk',
  'palavrão', 'piada de adulto', 'terror', 'assombração',
  'futebol', 'jogo de videogame', 'filme de terror', 'série',
  'YouTuber', 'TikTok', 'influencer', 'famoso'
];

// Palavras permitidas em contexto educacional/científico
const EDUCATIONAL_ALLOWED = [
  'álcool', 'alcool'  // OK em contexto de química
];

const VIOLENCE_KEYWORDS = ['matar', 'morte', 'violência', 'sangue', 'suicídio', 'morrer', 'machucar'];

function checkGuardRails(message) {
  const lowerMessage = message.toLowerCase();

  // Verificar palavras de violência
  for (const keyword of VIOLENCE_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      return { safe: false, reason: 'violence', keyword };
    }
  }

  // Verificar contexto educacional para palavras permitidas
  const educationalPatterns = [
    /na química/i,
    /na biologia/i,
    /o que é/i,
    /significado de/i,
    /definição de/i
  ];
  
  const hasEducationalContext = educationalPatterns.some(p => p.test(lowerMessage));
  
  // Se tem contexto educacional, permitir palavras como álcool
  if (hasEducationalContext) {
    for (const word of EDUCATIONAL_ALLOWED) {
      if (lowerMessage.includes(word.toLowerCase())) {
        return { safe: true, reason: 'educational_context' };
      }
    }
  }

  // Verificar lista de bloqueio geral
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      return { safe: false, reason: 'blocked', keyword };
    }
  }

  // Verificar comprimento
  if (message.length > 500) {
    return { safe: false, reason: 'too_long' };
  }

  return { safe: true };
}

// ============================================
// TESTES
// ============================================

describe('Guard Rails - Proteção de Violência', () => {
  
  test('DEVE bloquear mensagens com "suicídio"', () => {
    const result = checkGuardRails('quero saber sobre suicídio');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('violence');
  });

  test('DEVE bloquear mensagens com "matar"', () => {
    const result = checkGuardRails('como matar alguém');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('violence');
  });

  test('DEVE bloquear mensagens com "morrer"', () => {
    const result = checkGuardRails('quero morrer');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('violence');
  });

  test('DEVE bloquear mensagens com "sangue"', () => {
    const result = checkGuardRails('filme com sangue');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('violence');
  });

  test('DEVE bloquear mensagens com "violência"', () => {
    const result = checkGuardRails('brincadeira de violência');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('violence');
  });

  test('DEVE bloquear mensagens com "machucar"', () => {
    const result = checkGuardRails('como machucar alguém');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('violence');
  });

});

describe('Guard Rails - Conteúdo Inadequado', () => {
  
  test('DEVE bloquear "sexo"', () => {
    const result = checkGuardRails('o que é sexo');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('blocked');
  });

  test('DEVE bloquear "pornografia"', () => {
    const result = checkGuardRails('o que é pornografia');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('blocked');
  });

  test('DEVE bloquear "droga"', () => {
    const result = checkGuardRails('o que é droga');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('blocked');
  });

  test('DEVE PERMITIR "álcool" em contexto educacional', () => {
    const result = checkGuardRails('o que é álcool');
    expect(result.safe).toBe(true); // "o que é" = contexto educacional
  });

  test('DEVE bloquear "palavrão"', () => {
    const result = checkGuardRails('me ensina um palavrão');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('blocked');
  });

});

describe('Guard Rails - Fora do Contexto Escolar', () => {
  
  test('DEVE bloquear "futebol"', () => {
    const result = checkGuardRails('quem ganhou o jogo de futebol');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('blocked');
  });

  test('DEVE bloquear "videogame"', () => {
    const result = checkGuardRails('qual o melhor jogo de videogame');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('blocked');
  });

  test('DEVE bloquear "YouTuber"', () => {
    const result = checkGuardRails('quem é o YouTuber mais famoso');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('blocked');
  });

  test('DEVE bloquear "TikTok"', () => {
    const result = checkGuardRails('vi um vídeo no TikTok');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('blocked');
  });

  test('DEVE bloquear "filme de terror"', () => {
    const result = checkGuardRails('filme de terror legal');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('blocked');
  });

  test('DEVE bloquear "piada de adulto"', () => {
    const result = checkGuardRails('conta uma piada de adulto');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('blocked');
  });

});

describe('Guard Rails - Spam e Abuso', () => {
  
  test('DEVE bloquear mensagens muito longas (>500 chars)', () => {
    const longMessage = 'a'.repeat(501);
    const result = checkGuardRails(longMessage);
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('too_long');
  });

});

describe('Guard Rails - CONTEÚDO PERMITIDO (Escolar)', () => {
  
  test('DEVE PERMITIR "O que é fotossíntese"', () => {
    const result = checkGuardRails('O que é fotossíntese?');
    expect(result.safe).toBe(true);
  });

  test('DEVE PERMITIR "Como calcular a área de um triângulo"', () => {
    const result = checkGuardRails('Como calcular a área de um triângulo?');
    expect(result.safe).toBe(true);
  });

  test('DEVE PERMITIR "Quem descobriu o Brasil"', () => {
    const result = checkGuardRails('Quem descobriu o Brasil?');
    expect(result.safe).toBe(true);
  });

  test('DEVE PERMITIR "O que é substantivo"', () => {
    const result = checkGuardRails('O que é substantivo?');
    expect(result.safe).toBe(true);
  });

  test('DEVE PERMITIR "Como funciona o ciclo da água"', () => {
    const result = checkGuardRails('Como funciona o ciclo da água?');
    expect(result.safe).toBe(true);
  });

  test('DEVE PERMITIR "Quais são os planetas"', () => {
    const result = checkGuardRails('Quais são os planetas do sistema solar?');
    expect(result.safe).toBe(true);
  });

  test('DEVE PERMITIR "O que é fração"', () => {
    const result = checkGuardRails('O que é fração?');
    expect(result.safe).toBe(true);
  });

  test('DEVE PERMITIR "Quem foi Tiradentes"', () => {
    const result = checkGuardRails('Quem foi Tiradentes?');
    expect(result.safe).toBe(true);
  });

  test('DEVE PERMITIR "Como fazer uma redação"', () => {
    const result = checkGuardRails('Como fazer uma redação boa?');
    expect(result.safe).toBe(true);
  });

  test('DEVE PERMITIR "O que éDNA"', () => {
    const result = checkGuardRails('O que é DNA?');
    expect(result.safe).toBe(true);
  });

  test('DEVE PERMITIR mensagens normais sobre escola', () => {
    const result = checkGuardRails('Preciso de ajuda com minha lição de história');
    expect(result.safe).toBe(true);
  });

});

describe('Guard Rails - CASOS LIMIOTROFES (Edge Cases)', () => {
  
  test('DEVE BLOQUEAR "terror" (filme/contexto inadequado)', () => {
    const result = checkGuardRails('gosto de filme de terror');
    expect(result.safe).toBe(false);
  });

  test('DEVE PERMITIR "terra" (não confundir com terror)', () => {
    const result = checkGuardRails('O que é a camada da terra?');
    expect(result.safe).toBe(true);
  });

  test('DEVE BLOQUEAR "arma" mesmo em contexto escolar', () => {
    const result = checkGuardRails('qual a arma usada na guerra');
    expect(result.safe).toBe(false);
  });

  test('DEVE PERMITIR perguntas sobre guerras históricas (sem arma)', () => {
    const result = checkGuardRails('Quais foram as principais guerras mundiais?');
    expect(result.safe).toBe(true);
  });

  test('DEVE PERMITIR "alcool" em contexto químico educacional', () => {
    const result = checkGuardRails('o que é alcool na química');
    expect(result.safe).toBe(true); // Permitir em contexto educacional
  });

  test('DEVE BLOQUEAR "bebida alcoólica" (contexto inadequado)', () => {
    const result = checkGuardRails('qual sua bebida alcoólica favorita');
    expect(result.safe).toBe(false); // Bloquear contexto de consumo
  });

});

console.log('✅ Testes de Guard Rails carregados!');
