/**
 * Guard Rails Engine v3
 * Sistema de proteção com Prompt Injection Defense
 */

import { logger } from '../utils/logger.js';
import { InjectionLayer } from './layers/injection/index.js';

// Padrões de ilegalidade explícita (pergunta como "como fazer X errado")
const ILLEGAL_PATTERNS = [
  /como\s+(invadir|hackear|roubar|falsificar|fraudar|clonar|golpe)/i,
  /como\s+(apagar|rastrear|esconder)\s+(rastro|prova|evidência)/i,
  /como\s+(enganar|passar\s+o\s+bicho)/i,
  /(falsificar|fraudar|clonar)\s+(documento|cartão|sistema)/i,
  /perfil\s+falso\s+convincente/i,
  /descobrir\s+a\s+senha/i,
];

// Palavras bloqueadas (contexto claro de perigo - ABSOLUTE BLOCK)
const BLOCKED_KEYWORDS = [
  'pornografia', 'nudez', 'cp', 'child',
  // Drogas
  'maconha', 'cocaína', 'cocaina', ' crack', 'lsd', 'mdma', 'heroína', 'heroina',
  'drogas', 'droga', 'fumar maconha', 'usar drogas', 'vape', 'baseado',
  // Conteúdo adulto
  'sexo', 'sexual', 'putaria', 'porno',
];

// Palavras de conteúdo sensível (suicídio, autolesão, saúde mental)
const SENSITIVE_KEYWORDS = [
  'suicídio', 'suicidio', 'suicida',
  'matar', 'me matar', 'se matar',
  'morrer', 'quero morrer', 'querer morrer',
  'tirar a vida', 'acabar com a vida',
  'autolesão', 'autocorte', 'se cortar',
  'overdose', 'tomar remédio demais',
  'pular do', 'enforcar',
];

// Padrões de conteúdo sensível (regex)
const SENSITIVE_PATTERNS = [
  /como\s+(matar|morreu|morrer)/i,
  /(quero|vou|vai)\s+(morrer|me\s+matar)/i,
  /tirar\s+(minha|a)\s+vida/i,
  /acabar\s+com\s+(minha|a)\s+vida/i,
  /não\s+(quero|vale)\s+(mais\s+)?viver/i,
  /life\s+isn'?t\s+worth/i,
  /ways?\s+to\s+(die|kill)/i,
];

// Padrões de pergunta educativa (permitidos)
const EDUCATIONAL_PATTERNS = [
  /é\s+(seguro|perigoso|normal|recomendado)/i,
  /faz\s+mal/i,
  /quanto\s+(é|demora)/i,
  /qual\s+(a|o)\s+(quantidade|dose|risco)/i,
  /como\s+(parar|deixar|sair|ajudar)/i,
  /dependência|vício/i,
  /consequência|efeito|impacto/i,
];

// Contextos permitidos para saúde/informação
const HEALTH_EDUCATIONAL = [
  'café', 'álcool', 'bebida', 'remédio', 'ansiedade', 'depressão',
  'cigarro', 'fumaça', 'sono', 'estresse', 'saúde'
];

// Padrões de violência explícita
const VIOLENCE_PATTERNS = [
  /como\s+(matar|machucar|agredir|bater|destruir)/i,
  /jeito\s+(mais\s+eficiente|melhor)\s+(de\s+)?(matar|machucar)/i,
  /fazer\s+(alguém|pessoa)\s+(desmaiar|morrer|sangrar)/i,
  /intimidar|ameaçar/i,
];

// Padrões de "como fazer algo errado" genéricos
const HOW_TO_BAD_PATTERNS = [
  /como\s+(sair|fugir)\s+(sem|da|de)\s*(ser\s+)?(pego|preso|detectado)/i,
  /como\s+(burlar|contornar|violar)\s+(regra|sistema|lei)/i,
  /sem\s+ser\s+(pego|detectado|visto)/i,
];

const MAX_MESSAGE_LENGTH = 500;
const MIN_MESSAGE_LENGTH = 2;

export class GuardRailsEngine {
  constructor() {
    this.rateLimits = new Map();
    this.injectionLayer = new InjectionLayer({ strictMode: true, logAllAttempts: true });
  }

  async check(input) {
    const { message, userId } = input;
    const lowerMessage = message.toLowerCase();

    // ═══ Camada 0: Prompt Injection Defense (NOVA) ═══
    const injectionCheck = await this.injectionLayer.check({ message, userId });
    if (!injectionCheck.safe) {
      logger.warn('Guard Rails: Injection bloqueado', {
        userId,
        type: injectionCheck.type,
        reason: injectionCheck.blockReason,
      });
      return injectionCheck;
    }

    // ═══ Camada 1: Formato ═══
    if (message.length < MIN_MESSAGE_LENGTH) {
      return { safe: false, reason: 'Mensagem muito curta', layers: ['format'] };
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return { safe: false, reason: 'Mensagem muito longa', layers: ['format'] };
    }

    // Camada 2: Rate Limit
    if (this.isRateLimited(userId)) {
      return { safe: false, reason: 'Muitas mensagens, aguarde...', layers: ['spam'] };
    }

    // Camada 3: Prompt Injection
    const injectionPatterns = [
      /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
      /forget\s+(your|all)\s+(instructions|rules)/i,
      /you\s+are\s+now\s+(DAN|evil)/i,
    ];
    if (injectionPatterns.some(p => p.test(message))) {
      return { safe: false, reason: 'Prompt injection detectado', layers: ['injection'] };
    }

    // Camada 4: Palavras bloqueadas absolutas
    const blockedWord = BLOCKED_KEYWORDS.find(word => lowerMessage.includes(word));
    if (blockedWord) {
      return { safe: false, reason: 'Conteúdo inadequado', layers: ['keywords'] };
    }

    // Camada 4.5: Conteúdo sensível (suicídio, autolesão)
    const sensitiveWord = SENSITIVE_KEYWORDS.find(word => lowerMessage.includes(word));
    if (sensitiveWord) {
      return { 
        safe: false, 
        reason: '🛡️ Se você está passando por um momento difícil, por favor procure ajuda! Você não está sozinho(a). Em caso de urgência, ligue para o CVV: 188 (24h).', 
        layers: ['sensitive'] 
      };
    }
    if (SENSITIVE_PATTERNS.some(p => p.test(message))) {
      return { 
        safe: false, 
        reason: '🛡️ Se você está passando por um momento difícil, por favor procure ajuda! Você não está sozinho(a). Em caso de urgência, ligue para o CVV: 188 (24h).', 
        layers: ['sensitive'] 
      };
    }

    // Camada 5: Ilegalidade explícita
    if (ILLEGAL_PATTERNS.some(p => p.test(message))) {
      logger.warn('Padrão ilegal detectado', { userId, message: message.substring(0, 50) });
      return { safe: false, reason: ' Conteúdo inadequado', layers: ['illegal'] };
    }

    // Camada 6: Violência explícita
    if (VIOLENCE_PATTERNS.some(p => p.test(message))) {
      logger.warn('Padrão de violência detectado', { userId });
      return { safe: false, reason: 'Conteúdo inadequado', layers: ['violence'] };
    }

    // Camada 7: "Como fazer algo errado" genérico
    if (HOW_TO_BAD_PATTERNS.some(p => p.test(message))) {
      logger.warn('Padrão de evasão detectado', { userId });
      return { safe: false, reason: 'Conteúdo inadequado', layers: ['evasion'] };
    }

    // Camada 8: Perguntas sobre manipulação/enganação
    const manipulationPatterns = [
      /como\s+(manipular|controlar|enganar)\s+(alguém|pessoa|amigos)/i,
      /como\s+(convencer|forçar)\s+(alguém|pessoa)\s+(a\s+)?(fazer|aceitar)/i,
    ];
    if (manipulationPatterns.some(p => p.test(message))) {
      return { safe: false, reason: 'Conteúdo inadequado', layers: ['manipulation'] };
    }

    // NOTA: Perguntas educativas sobre saúde/substâncias SÃO permitidas
    // (ex: "Café em excesso faz mal?", "Qual a quantidade perigosa de álcool?")
    // Isso é intencional para educação

    return { safe: true, layers: ['all'] };
  }

  async checkOutput(response) {
    const lowerResponse = response.toLowerCase();
    
    // Verificar se resposta instrui a fazer algo perigoso
    const dangerousInstructions = [
      'para invadir', 'para hackear', 'para fraudar',
      'passo a passo', 'siguindo estes passos',
    ];
    
    if (dangerousInstructions.some(d => lowerResponse.includes(d))) {
      return { safe: false, reason: 'Output potencialmente perigoso', layers: ['output'] };
    }

    return { safe: true, layers: ['output'] };
  }

  isRateLimited(userId) {
    const now = Date.now();
    const limit = this.rateLimits.get(userId);
    
    if (!limit) {
      this.rateLimits.set(userId, { count: 1, resetAt: now + 60000 });
      return false;
    }
    
    if (now > limit.resetAt) {
      limit.count = 1;
      limit.resetAt = now + 60000;
      return false;
    }
    
    limit.count++;
    return limit.count > 10;
  }
}
