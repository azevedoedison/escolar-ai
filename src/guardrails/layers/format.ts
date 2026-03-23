/**
 * Guard Rails - Camada 1: Validação de Formato
 * Verifica comprimento e encoding da mensagem
 */

import { GuardRailLayer, GuardRailInput, LayerResult } from '../types';

interface FormatConfig {
  minLength: number;
  maxLength: number;
}

export class FormatLayer implements GuardRailLayer {
  name = 'format';
  private config: FormatConfig;

  constructor(config: FormatConfig) {
    this.config = config;
  }

  async validate(input: GuardRailInput): Promise<LayerResult> {
    const { message } = input;
    const { minLength, maxLength } = this.config;

    // Verificar comprimento mínimo
    if (message.trim().length < minLength) {
      return {
        name: this.name,
        passed: false,
        reason: 'Mensagem muito curta',
        confidence: 1.0,
        metadata: { length: message.length, minLength },
      };
    }

    // Verificar comprimento máximo
    if (message.length > maxLength) {
      return {
        name: this.name,
        passed: false,
        reason: 'Mensagem muito longa',
        confidence: 1.0,
        metadata: { length: message.length, maxLength },
      };
    }

    // Verificar encoding UTF-8
    if (!this.isValidUTF8(message)) {
      return {
        name: this.name,
        passed: false,
        reason: 'Caracteres inválidos',
        confidence: 1.0,
      };
    }

    // Sanitização básica (remover caracteres perigosos)
    const sanitized = this.sanitize(message);
    if (sanitized !== message) {
      // Apenas log, não bloqueia
      console.debug('Message sanitized', { original: message, sanitized });
    }

    return {
      name: this.name,
      passed: true,
      confidence: 1.0,
      metadata: { length: message.length },
    };
  }

  private isValidUTF8(str: string): boolean {
    try {
      // Verifica se a string pode ser codificada como UTF-8 válida
      return Buffer.from(str, 'utf-8').toString('utf-8') === str;
    } catch {
      return false;
    }
  }

  private sanitize(str: string): string {
    // Remove caracteres de controle (exceto newline e tab)
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
}
