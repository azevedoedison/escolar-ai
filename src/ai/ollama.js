/**
 * Escolar AI - Ollama Client (Local)
 * Usa modelos locais via Ollama - mais rápido sem fila!
 */

import { logger } from '../utils/logger.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Modelos locais disponíveis
export const LOCAL_MODELS = {
  fast: 'llama3.2:3b',          // Rápido (~3B)
  balanced: 'llama3.1:8b',      // Equilibrado (~8B)
  smart: 'qwen2.5:14b',         // Mais inteligente (~14B)
};

/**
 * Chat com modelo local Ollama
 */
export async function chat(messages, options = {}) {
  const model = options.model || LOCAL_MODELS.fast;  // Default: rápido
  
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 300,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      content: data.message.content,
      model: data.model,
      usage: {
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
      },
    };

  } catch (error) {
    logger.error('Erro no Ollama', { error: error.message });
    return {
      success: false,
      error: error.message,
    };
  }
}

// Alias para compatibilidade
export const FREE_MODELS = LOCAL_MODELS;
