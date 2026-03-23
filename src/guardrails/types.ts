/**
 * Guard Rails - Types
 * Tipos e interfaces do sistema de proteção
 */

export interface GuardRailInput {
  message: string;
  userId: string;
  childId?: string;
}

export interface LayerResult {
  name: string;
  passed: boolean;
  reason?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface GuardRailOutput {
  safe: boolean;
  layers: LayerResult[];
  blockedLayer?: string;
  reason?: string;
  confidence?: number;
}

export interface GuardRailLayer {
  name: string;
  validate(input: GuardRailInput): Promise<LayerResult>;
}

export interface GuardRailConfig {
  format: {
    minLength: number;
    maxLength: number;
  };
  classifier: {
    threshold: number;
    categories: string[];
  };
  spam: {
    windowSeconds: number;
    maxMessages: number;
    cooldownSeconds: number;
  };
  notifications: {
    thresholdPerHour: number;
  };
}

export const DEFAULT_CONFIG: GuardRailConfig = {
  format: {
    minLength: 3,
    maxLength: 500,
  },
  classifier: {
    threshold: 0.7,
    categories: ['violence', 'sexual', 'drugs', 'hate'],
  },
  spam: {
    windowSeconds: 60,
    maxMessages: 10,
    cooldownSeconds: 30,
  },
  notifications: {
    thresholdPerHour: 3,
  },
};
