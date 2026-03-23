/**
 * AutoRAG Service
 * Integração com Cloudflare AutoRAG
 */

import { logger } from '../utils/logger.js';

export class AutoRAGService {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.pipelineName = process.env.AUTORAG_PIPELINE_NAME || 'escolar-ai';
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/autorag`;
  }

  /**
   * Buscar resposta baseada na apostila
   */
  async search(query, childId) {
    // Se não configurado, retorna vazio
    if (!this.accountId || !this.apiToken) {
      logger.warn('AutoRAG não configurado, pulando busca');
      return { found: false, context: '', sources: [] };
    }

    try {
      const response = await fetch(`${this.baseUrl}/rags/${this.pipelineName}/ai-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          max_results: 3,
          filters: childId ? { child_id: childId } : {},
        }),
      });

      if (!response.ok) {
        throw new Error(`AutoRAG error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result && data.result.response) {
        return {
          found: true,
          context: data.result.response,
          sources: data.result.sources || [],
        };
      }

      return { found: false, context: '', sources: [] };

    } catch (error) {
      logger.error('Erro no AutoRAG', { error: error.message });
      return { found: false, context: '', sources: [] };
    }
  }

  /**
   * Upload de apostila
   */
  async uploadApostila(pdfBuffer, metadata) {
    if (!this.accountId || !this.apiToken) {
      throw new Error('AutoRAG não configurado');
    }

    // TODO: Implementar upload para R2
    logger.info('Upload de apostila', metadata);
    return { success: true, message: 'Apostila enviada' };
  }
}
