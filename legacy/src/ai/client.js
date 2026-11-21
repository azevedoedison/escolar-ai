/**
 * Escolar AI - OpenRouter Client
 * Usa modelos gratuitos via OpenRouter API
 */

import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

// OpenRouter (modelos gratuitos)
const apiKey = process.env.OPENROUTER_API_KEY;

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey,
  defaultHeaders: !apiKey ? {} : {
    'HTTP-Referer': 'https://escolar-ai.app',
    'X-Title': 'Escolar AI'
  }
});

// Modelos disponíveis
export const MODELS = {
  fast: 'xiaomi/mimo-v2-omni',      // Nosso modelo padrão
  balanced: 'xiaomi/mimo-v2-omni',  
  smart: 'xiaomi/mimo-v2-omni',     
};

// Compatibilidade com código existente
export const FREE_MODELS = MODELS;

/**
 * Chat com modelo gratuito
 */
export async function chat(messages, options = {}) {
  const model = options.model || FREE_MODELS.fast;  // Default: rápido
  
  try {
    const response = await openrouter.chat.completions.create({
      model,
      messages,
      max_tokens: options.maxTokens || 300,
      temperature: options.temperature || 0.7,
    });

    return {
      success: true,
      content: response.choices[0].message.content,
      model: response.model,
      usage: response.usage,
    };

  } catch (error) {
    logger.error('Erro no OpenRouter', { error: error.message });
    return {
      success: false,
      error: error.message,
    };
  }
}

export { openrouter };
