/**
 * Conversation Repository
 * Operações de banco para Conversation (histórico)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ConversationRepository {
  /**
   * Criar conversa (pergunta)
   */
  async create(data) {
    return prisma.conversation.create({
      data: {
        childId: data.childId,
        input: data.input,
        output: data.output || null,
        status: data.status || 'approved',
        blockReason: data.blockReason || null,
        guardRail: data.guardRail || null,
        model: data.model || null,
        tokens: data.tokens || null,
      },
    });
  }

  /**
   * Atualizar resposta da conversa
   */
  async updateResponse(id, data) {
    return prisma.conversation.update({
      where: { id },
      data: {
        output: data.output,
        status: data.status || 'approved',
        model: data.model,
        tokens: data.tokens,
      },
    });
  }

  /**
   * Buscar conversas por criança (histórico)
   */
  async findByChildId(childId, options = {}) {
    const { limit = 50, offset = 0, startDate, endDate, status } = options;

    const where = { childId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status) {
      where.status = status;
    }

    return prisma.conversation.findMany({
      where,
      select: {
        id: true,
        input: true,
        output: true,
        status: true,
        blockReason: true,
        model: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Contar conversas por período
   */
  async countByPeriod(childId, startDate, endDate) {
    const conversations = await prisma.conversation.findMany({
      where: {
        childId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        status: true,
        createdAt: true,
        tokens: true,
      },
    });

    const total = conversations.length;
    const approved = conversations.filter(c => c.status === 'approved').length;
    const blocked = conversations.filter(c => c.status === 'blocked').length;
    const totalTokens = conversations.reduce((sum, c) => sum + (c.tokens || 0), 0);

    // Agrupar por dia
    const byDay = {};
    conversations.forEach(c => {
      const day = c.createdAt.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { total: 0, blocked: 0 };
      byDay[day].total++;
      if (c.status === 'blocked') byDay[day].blocked++;
    });

    return { total, approved, blocked, totalTokens, byDay };
  }

  /**
   * Buscar conversas bloqueadas (para alertas)
   */
  async findBlocked(childId, limit = 10) {
    return prisma.conversation.findMany({
      where: {
        childId,
        status: 'blocked',
      },
      select: {
        id: true,
        input: true,
        blockReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Deletar conversas antigas (> dias)
   */
  async deleteOlderThan(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return prisma.conversation.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });
  }

  /**
   * Buscar estatísticas gerais (para dashboard)
   */
  async getStats(childId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const conversations = await prisma.conversation.findMany({
      where: {
        childId,
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        blockReason: true,
        createdAt: true,
      },
    });

    const total = conversations.length;
    const blocked = conversations.filter(c => c.status === 'blocked').length;

    // Contar por motivo de bloqueio
    const blockReasons = {};
    conversations
      .filter(c => c.status === 'blocked' && c.blockReason)
      .forEach(c => {
        blockReasons[c.blockReason] = (blockReasons[c.blockReason] || 0) + 1;
      });

    // Por hora (últimas 24h)
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);
    const recentBlocked = conversations.filter(
      c => c.status === 'blocked' && c.createdAt >= last24h
    ).length;

    return {
      total,
      blocked,
      blockedRate: total > 0 ? ((blocked / total) * 100).toFixed(1) : '0',
      blockReasons,
      recentBlocked,
      days,
    };
  }

  /**
   * Buscar últimas conversas (para contexto do chat)
   */
  async getRecentContext(childId, limit = 5) {
    return prisma.conversation.findMany({
      where: {
        childId,
        status: 'approved',
      },
      select: {
        input: true,
        output: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const conversationRepository = new ConversationRepository();
