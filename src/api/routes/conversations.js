/**
 * Conversation Routes
 * API para histórico de conversas (Dashboard Pai)
 */

import express from 'express';
import { conversationRepository } from '../../db/repositories/conversation.js';
import { childRepository } from '../../db/repositories/child.js';
import { authenticateParent } from '../../auth/parent-auth.js';

const router = express.Router();

/**
 * GET /api/conversations/:childId
 * Buscar histórico de conversas de uma criança
 */
router.get('/:childId', authenticateParent, async (req, res) => {
  try {
    const { childId } = req.params;
    const { limit = 50, offset = 0, startDate, endDate, status } = req.query;

    // Verificar se a criança pertence ao pai
    const child = await childRepository.findById(childId);
    if (!child || child.parentId !== req.parent.id) {
      return res.status(404).json({ error: 'Criança não encontrada' });
    }

    const conversations = await conversationRepository.findByChildId(childId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      startDate,
      endDate,
      status,
    });

    res.json({
      conversations,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/conversations/:childId/stats
 * Estatísticas de conversas (últimos N dias)
 */
router.get('/:childId/stats', authenticateParent, async (req, res) => {
  try {
    const { childId } = req.params;
    const { days = 7 } = req.query;

    // Verificar se a criança pertence ao pai
    const child = await childRepository.findById(childId);
    if (!child || child.parentId !== req.parent.id) {
      return res.status(404).json({ error: 'Criança não encontrada' });
    }

    const stats = await conversationRepository.getStats(childId, parseInt(days));

    res.json({
      childId,
      childName: child.name,
      period: `${days} dias`,
      stats,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/conversations/:childId/blocked
 * Buscar conversas bloqueadas (alertas)
 */
router.get('/:childId/blocked', authenticateParent, async (req, res) => {
  try {
    const { childId } = req.params;
    const { limit = 10 } = req.query;

    // Verificar se a criança pertence ao pai
    const child = await childRepository.findById(childId);
    if (!child || child.parentId !== req.parent.id) {
      return res.status(404).json({ error: 'Criança não encontrada' });
    }

    const blocked = await conversationRepository.findBlocked(childId, parseInt(limit));

    res.json({
      childId,
      childName: child.name,
      blocked,
      count: blocked.length,
    });
  } catch (error) {
    console.error('Erro ao buscar bloqueios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/conversations/cleanup
 * Limpar conversas antigas (> 30 dias)
 */
router.delete('/cleanup', authenticateParent, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await conversationRepository.deleteOlderThan(days);

    res.json({
      message: `${result.count} conversas antigas removidas`,
      deleted: result.count,
      olderThan: `${days} dias`,
    });
  } catch (error) {
    console.error('Erro ao limpar conversas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
