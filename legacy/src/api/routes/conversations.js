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
 * GET /api/conversations/search?q=xxx
 * Buscar conversas por texto (para o pai)
 */
router.get('/search', authenticateParent, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ data: [] });
    }

    // Buscar filhos do pai
    const children = await childRepository.findByParentId(req.parent.id);
    const childIds = children.map(c => c.id);

    // Buscar conversas com o texto
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const conversations = await prisma.conversation.findMany({
      where: {
        childId: { in: childIds },
        input: { contains: q, mode: 'insensitive' },
      },
      select: {
        id: true,
        input: true,
        output: true,
        status: true,
        createdAt: true,
        child: { select: { id: true, name: true, nickname: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const data = conversations.map(c => ({
      conversationId: c.id,
      childId: c.child.id,
      childNickname: c.child.nickname || c.child.name,
      input: c.input,
      output: c.output,
      status: c.status,
      startedAt: c.createdAt,
    }));

    res.json({ data });
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({ error: 'Erro na busca' });
  }
});

/**
 * GET /api/conversations/detail/:id
 * Buscar detalhes de uma conversa específica
 */
router.get('/detail/:id', authenticateParent, async (req, res) => {
  try {
    const { id } = req.params;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        child: { select: { id: true, name: true, nickname: true, parentId: true } },
      },
    });

    if (!conversation || conversation.child.parentId !== req.parent.id) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Erro ao buscar conversa:', error);
    res.status(500).json({ error: 'Erro ao buscar conversa' });
  }
});

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

/**
 * DELETE /api/conversations/:id
 * Deletar uma conversa específica
 */
router.delete('/:id', authenticateParent, async (req, res) => {
  try {
    const { id } = req.params;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Verificar se a conversa pertence a um filho do pai
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { child: { select: { parentId: true } } },
    });

    if (!conversation || conversation.child.parentId !== req.parent.id) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    await prisma.conversation.delete({ where: { id } });

    res.json({ message: 'Conversa deletada', id });
  } catch (error) {
    console.error('Erro ao deletar conversa:', error);
    res.status(500).json({ error: 'Erro ao deletar conversa' });
  }
});

export default router;
