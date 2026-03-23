/**
 * Escolar AI - Guard Rails
 * Sistema de 5 camadas de proteção
 */

// Lista de bloqueio (palavras/chave proibidas)
const BLOCKED_KEYWORDS = [
  // Conteúdo sexual
  'sexo', 'sexual', 'pornografia', 'adulto', 'nudez', 'íntimo',
  
  // Violência
  'matar', 'morte', 'violência', 'sangue', 'arma', 'briga',
  
  // Autolesão/Suicídio
  'suicídio', 'morrer', 'me matar', 'acabar com a vida', 'machucar',
  
  // Drogas
  'droga', 'maconha', 'cocaina', 'álcool', 'bebida alcoólica',
  
  // Conteúdo inadequado
  'palavrão', 'piada de adulto', 'terror', 'assombração',
  
  // Fora do contexto escolar
  'futebol', 'jogo de videogame', 'filme de terror', 'série',
  'YouTuber', ' TikTok', 'influencer', 'famoso'
];

// Respostas amigáveis para bloqueios
const BLOCKED_RESPONSES = {
  default: `🛡️ Ops! Isso está fora do contexto escolar.\n\nQue tal perguntar sobre:\n• 🔬 Ciências\n• 📐 Matemática\n• 🌍 História\n• 📖 Português\n\n📚 Escolar AI está aqui para te ajudar na escola!`,

  violence: `🛡️ Essa pergunta não é adequada.\n\nSe você está se sentindo mal ou precisa falar com alguém, procure um adulto de confiança (pai, mãe, professor) ou ligue para o CVV: 188.\n\nQue tal estudar algo interessante? Pode me perguntar sobre ciências! 🔬`,

  outOfContext: `🛡️ Isso não é sobre a escola!\n\nLembra: Eu posso ajudar com:\n• Ciências 🔬\n• Matemática 📐\n• História 🌍\n• Português 📖\n\nO que você quer aprender? 📚`
};

// Palavras que indicam violência (prioridade alta)
const VIOLENCE_KEYWORDS = ['matar', 'morte', 'violência', 'sangue', 'suicídio', 'morrer', 'machucar'];

class GuardRails {
  
  /**
   * Verifica se uma mensagem é segura
   * @param {string} message - Mensagem do usuário
   * @returns {object} { safe: boolean, response?: string, reason?: string }
   */
  async check(message) {
    const lowerMessage = message.toLowerCase();

    // 1ª Camada: Verificar palavras de violência (prioridade)
    for (const keyword of VIOLENCE_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        return {
          safe: false,
          response: BLOCKED_RESPONSES.violence,
          reason: 'violence'
        };
      }
    }

    // 2ª Camada: Verificar lista de bloqueio geral
    for (const keyword of BLOCKED_KEYWORDS) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return {
          safe: false,
          response: BLOCKED_RESPONSES.outOfContext,
          reason: `blocked_keyword: ${keyword}`
        };
      }
    }

    // 3ª Camada: Verificar comprimento (spam)
    if (message.length > 500) {
      return {
        safe: false,
        response: '🤔 Sua pergunta é muito longa! Tente fazer uma pergunta mais curta sobre a escola.',
        reason: 'too_long'
      };
    }

    // 4ª Camada: Verificar repetição (spam)
    if (this.isSpam(message)) {
      return {
        safe: false,
        response: '😊 Calma! Faz uma pergunta de cada vez, tá bom?',
        reason: 'spam'
      };
    }

    // 5ª Camada: Classificador de contexto (futuro - usar IA)
    // TODO: Adicionar classificador que verifica se é contexto escolar

    return { safe: true };
  }

  /**
   * Detecta spam (mensagens repetidas)
   */
  isSpam(message) {
    // TODO: Implementar detecção de spam
    return false;
  }

  /**
   * Adiciona palavra à lista de bloqueio
   */
  addBlockedKeyword(keyword) {
    BLOCKED_KEYWORDS.push(keyword.toLowerCase());
  }

  /**
   * Remove palavra da lista de bloqueio
   */
  removeBlockedKeyword(keyword) {
    const index = BLOCKED_KEYWORDS.indexOf(keyword.toLowerCase());
    if (index > -1) {
      BLOCKED_KEYWORDS.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Retorna lista atual de palavras bloqueadas
   */
  getBlockedKeywords() {
    return [...BLOCKED_KEYWORDS];
  }
}

module.exports = { guardRails: new GuardRails(), BLOCKED_KEYWORDS, BLOCKED_RESPONSES };
