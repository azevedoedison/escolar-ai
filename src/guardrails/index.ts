/**
 * Guard Rails Engine
 * Sistema de 6 camadas de proteção para crianças
 */

import { 
  GuardRailInput, 
  GuardRailOutput, 
  GuardRailLayer,
  GuardRailConfig,
  DEFAULT_CONFIG,
  LayerResult 
} from './types';
import { logger } from '../utils/logger';

export class GuardRailsEngine {
  private layers: GuardRailLayer[] = [];
  private config: GuardRailConfig;

  constructor(config: Partial<GuardRailConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeLayers();
  }

  private initializeLayers(): void {
    // Camadas serão registradas aqui
    // Exemplo: this.registerLayer(new FormatLayer(this.config.format));
    logger.info('GuardRailsEngine initialized');
  }

  registerLayer(layer: GuardRailLayer): void {
    this.layers.push(layer);
    logger.debug(`Layer registered: ${layer.name}`);
  }

  async check(input: GuardRailInput): Promise<GuardRailOutput> {
    const results: LayerResult[] = [];
    
    logger.debug('Starting guard rails check', { 
      userId: input.userId, 
      messageLength: input.message.length 
    });

    for (const layer of this.layers) {
      try {
        const result = await layer.validate(input);
        results.push(result);

        if (!result.passed) {
          logger.warn('Message blocked', {
            userId: input.userId,
            layer: layer.name,
            reason: result.reason,
          });

          return {
            safe: false,
            layers: results,
            blockedLayer: layer.name,
            reason: result.reason,
            confidence: result.confidence,
          };
        }
      } catch (error) {
        logger.error(`Layer ${layer.name} failed`, { error });
        // Fail-open: continua para próxima camada
      }
    }

    logger.debug('Message passed all layers', { userId: input.userId });

    return {
      safe: true,
      layers: results,
    };
  }

  getConfig(): GuardRailConfig {
    return this.config;
  }
}

export * from './types';
