/**
 * Guard Rails - Prompt Injection Layer
 * Camada de proteção contra prompt injection
 * 
 * Camadas:
 * 1. Input Validation + Encoding Detection
 * 2. Pattern Matching (regex)
 * 3. Context Analysis
 * 4. Logging
 */

import { ALL_INJECTION_PATTERNS, PATTERN_NAMES } from './patterns.js';
import { detectEncoding, normalizeMessage } from './encoding.js';
import { logger } from '../../../utils/logger.js';

// Stats para análise
const stats = {
  totalChecked: 0,
  blocked: 0,
  byType: {},
};

export class InjectionLayer {
  constructor(options = {}) {
    this.strictMode = options.strictMode ?? true;
    this.logAllAttempts = options.logAllAttempts ?? true;
  }

  /**
   * Verifica mensagem contra todas as camadas de injeção
   * @param {object} input - { message, userId }
   * @returns {object} - { safe, reason, details, layers }
   */
  async check(input) {
    const { message, userId } = input;
    stats.totalChecked++;
    const layers = [];
    const details = [];

    // ═══════════════════════════════════════════════
    // CAMADA 1: Input Validation + Encoding
    // ═══════════════════════════════════════════════
    
    // Verificar mensagens muito longas (context overflow)
    if (message.length > 1500) {
      return this.block('context_overflow', 'Mensagem muito longa (possível context overflow)', {
        layer: 'input_validation',
        length: message.length,
      });
    }

    // Detectar encoding suspeito
    const encodings = detectEncoding(message);
    if (encodings.some(e => e.suspicious)) {
      const suspicious = encodings.filter(e => e.suspicious);
      
      // Se decodificou algo suspeito, verificar se contém injeção
      for (const enc of suspicious) {
        if (enc.decoded) {
          const decodedCheck = this.checkPatterns(enc.decoded);
          if (decodedCheck.blocked) {
            return this.block('encoding_injection', `Injeção codificada detectada (${enc.type})`, {
              layer: 'encoding_detection',
              encoding: enc.type,
              decoded: enc.decoded.substring(0, 50),
              pattern: decodedCheck.pattern,
            });
          }
        } else {
          // Homoglyph ou char pad sem decoded - suspeito o suficiente
          return this.block('obfuscation', `Texto ofuscado detectado (${enc.type})`, {
            layer: 'encoding_detection',
            encoding: enc.type,
          });
        }
      }
    }
    layers.push('encoding');

    // Normalizar mensagem para análise
    const normalized = normalizeMessage(message);
    if (normalized !== message) {
      details.push({ note: 'Mensagem normalizada', original: message.length, normalized: normalized.length });
    }

    // ═══════════════════════════════════════════════
    // CAMADA 2: Pattern Matching
    // ═══════════════════════════════════════════════
    const textToCheck = this.strictMode ? `${message} ${normalized}` : normalized;
    const patternResult = this.checkPatterns(textToCheck);
    
    if (patternResult.blocked) {
      return this.block(patternResult.type, patternResult.reason, {
        layer: 'pattern_matching',
        pattern: patternResult.pattern,
      });
    }
    layers.push('patterns');

    // ═══════════════════════════════════════════════
    // CAMADA 3: Context Analysis
    // ═══════════════════════════════════════════════
    const contextResult = this.analyzeContext(message);
    if (contextResult.suspicious) {
      return this.block('context_suspicious', contextResult.reason, {
        layer: 'context_analysis',
        indicators: contextResult.indicators,
      });
    }
    layers.push('context');

    // ═══════════════════════════════════════════════
    // PASSED: Mensagem segura
    // ═══════════════════════════════════════════════
    return {
      safe: true,
      layers,
      details: details.length > 0 ? details : undefined,
    };
  }

  /**
   * Verifica mensagem contra todos os patterns
   */
  checkPatterns(text) {
    for (const pattern of ALL_INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        const patternName = PATTERN_NAMES[pattern.source] || this.guessPatternName(text, pattern);
        
        // Log da detecção
        if (this.logAllAttempts) {
          logger.warn('Prompt injection detectado', {
            type: patternName,
            pattern: pattern.source.substring(0, 50),
          });
        }
        
        // Atualizar stats
        stats.blocked++;
        stats.byType[patternName] = (stats.byType[patternName] || 0) + 1;

        return {
          blocked: true,
          type: patternName,
          reason: `Padrão de injeção detectado: ${patternName}`,
          pattern: pattern.source,
        };
      }
    }
    
    return { blocked: false };
  }

  /**
   * Análise contextual avançada
   */
  analyzeContext(message) {
    const lower = message.toLowerCase();
    const indicators = [];

    // 1. Múltiplas palavras de injeção em uma mensagem
    const injectionWords = [
      'ignore', 'forget', 'instructions', 'rules',
      'esqueça', 'instruções', 'regras', 'ignore',
      'mode', 'modo', 'free', 'livre',
    ];
    const foundWords = injectionWords.filter(w => lower.includes(w));
    if (foundWords.length >= 3) {
      indicators.push(`Múltiplas palavras suspeitas: ${foundWords.join(', ')}`);
    }

    // 2. Comandos no início da mensagem (caráter imperativo)
    const startsWithCommand = /^(ignore|forget|esqueça|ignore|agora|from now|system)/i.test(message);
    if (startsWithCommand) {
      indicators.push('Começa com comando imperativo');
    }

    // 3. Presença de separadores ou marcadores de sistema
    const hasSystemMarkers = /---|\[INST\]|<\|im_start\|>|system\s*:/i.test(message);
    if (hasSystemMarkers) {
      indicators.push('Contém marcadores de sistema');
    }

    // 4. Mensagem contém formatação de prompt (system/user/assistant)
    const hasPromptFormat = /(system|user|assistant)\s*:\s*/i.test(message);
    if (hasPromptFormat && !lower.startsWith('system:') && !lower.includes('pergunta')) {
      indicators.push('Contém formatação de prompt');
    }

    // 5. "Jogo" que muda regras
    const gamePattern = /(vamos\s+(jogar|brincar)|let'?s\s+play|jogo\s+de\s+(roleplay|imagine))/i;
    if (gamePattern.test(message)) {
      indicators.push('Parece ser início de jogo de roleplay');
    }

    const suspicious = indicators.length >= 2;
    return {
      suspicious,
      reason: suspicious ? `Indicadores de injeção: ${indicators.join('; ')}` : null,
      indicators: indicators.length > 0 ? indicators : null,
    };
  }

  /**
   * Bloqueia a mensagem
   */
  block(type, reason, details = {}) {
    stats.blocked++;
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    if (this.logAllAttempts) {
      logger.warn('Prompt injection bloqueado', { type, reason, ...details });
    }

    return {
      safe: false,
      reason: 'Conteúdo inadequado',
      blockReason: reason,
      type,
      layers: ['injection'],
      details,
    };
  }

  guessPatternName(text, pattern) {
    const lower = text.toLowerCase();
    if (lower.includes('ignore')) return 'direct_injection';
    if (lower.includes('forget')) return 'forget_instruction';
    if (lower.includes('system')) return 'system_injection';
    if (lower.includes('jogar') || lower.includes('play')) return 'roleplay_injection';
    return 'unknown_injection';
  }

  /**
   * Retorna estatísticas
   */
  getStats() {
    return { ...stats };
  }
}

// Singleton para uso global
export const injectionLayer = new InjectionLayer();
