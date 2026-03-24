/**
 * ReportGenerator
 * Gera relatórios semanais de uso
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Keywords para extração de tópicos
export const TOPIC_KEYWORDS = {
  'Ciências': ['fotossíntese', 'planeta', 'átomo', 'dna', 'animal', 'planta', 'água', 'ar', 'evapora', 'ciclo', 'ciência'],
  'Matemática': ['soma', 'divisão', 'multiplicação', 'número', 'conta', 'área', 'perímetro', 'triângulo', 'fração', 'matemática'],
  'História': ['brasil', 'guerra', 'rei', 'rainha', 'descoberta', 'colonização', 'escravo', 'tiradentes', 'história'],
  'Português': ['verbo', 'substantivo', 'adjetivo', 'redação', 'texto', 'gramática', 'português'],
  'Geografia': ['continente', 'país', 'capital', 'clima', 'rio', 'montanha', 'geografia'],
  'Inglês': ['english', 'word', 'vocabulary', 'verb to be', 'inglês'],
};

export class ReportGenerator {
  /**
   * Calcular estatísticas de uma criança
   */
  async calculateChildStats(childId, startDate, endDate) {
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
        tokens: true,
      },
    });

    const totalQuestions = conversations.filter(c => c.status === 'approved').length;
    const totalBlocked = conversations.filter(c => c.status === 'blocked').length;
    const total = conversations.length;
    const totalTokens = conversations.reduce((sum, c) => sum + (c.tokens || 0), 0);

    return {
      totalQuestions,
      totalBlocked,
      blockedRate: total > 0 ? ((totalBlocked / total) * 100).toFixed(1) : '0',
      totalTokens,
      estimatedTime: this.formatTimeFromTokens(totalTokens),
    };
  }

  /**
   * Formatar tokens em tempo legível (~0.5s por token)
   */
  formatTimeFromTokens(tokens) {
    if (!tokens || tokens === 0) return '0s';

    const totalSeconds = Math.round(tokens * 0.5);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
    if (minutes > 0) {
      return seconds > 0 ? `${minutes}min ${seconds}s` : `${minutes}min`;
    }
    return `${seconds}s`;
  }

  /**
   * Extrair tópicos das conversas
   */
  extractTopics(conversations) {
    if (!conversations || conversations.length === 0) {
      return [];
    }

    const topicCounts = {};
    let matchedCount = 0;

    for (const conv of conversations) {
      const input = (conv.input || '').toLowerCase();
      let matched = false;

      for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        for (const keyword of keywords) {
          if (input.includes(keyword)) {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            matched = true;
            matchedCount++;
            break;
          }
        }
        if (matched) break;
      }
    }

    // Ordenar por count
    const sorted = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: matchedCount > 0 ? ((count / conversations.length) * 100).toFixed(0) : '0',
      }));

    return sorted;
  }

  /**
   * Calcular comparação com período anterior
   */
  calculateComparison(current, previous) {
    if (!previous || previous.totalQuestions === 0) {
      return {
        questionsChange: 'N/A',
        blockedChange: previous?.totalBlocked === 0 ? '0%' : 'N/A',
      };
    }

    const questionsChange = ((current.totalQuestions - previous.totalQuestions) / previous.totalQuestions * 100).toFixed(0);
    const blockedChange = previous.totalBlocked === 0 
      ? (current.totalBlocked > 0 ? '+' + current.totalBlocked : '0%')
      : ((current.totalBlocked - previous.totalBlocked) / previous.totalBlocked * 100).toFixed(0);

    return {
      questionsChange: questionsChange >= 0 ? `+${questionsChange}%` : `${questionsChange}%`,
      blockedChange: blockedChange >= 0 ? `+${blockedChange}%` : `${blockedChange}%`,
    };
  }

  /**
   * Gerar relatório semanal completo
   */
  async generateWeeklyReport(parentId, startDate, endDate) {
    const children = await prisma.child.findMany({
      where: { parentId },
      select: { id: true, name: true, age: true },
    });

    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - 7);
    const previousEnd = new Date(startDate);
    previousEnd.setDate(previousEnd.getDate() - 1);

    const childrenReports = [];

    for (const child of children) {
      const currentStats = await this.calculateChildStats(child.id, startDate, endDate);
      const conversations = await prisma.conversation.findMany({
        where: {
          childId: child.id,
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        },
        select: { input: true },
      });

      const previousStats = await this.calculateChildStats(child.id, previousStart, previousEnd);
      const comparison = this.calculateComparison(currentStats, previousStats);
      const topTopics = this.extractTopics(conversations);

      childrenReports.push({
        childId: child.id,
        name: child.name,
        age: child.age,
        stats: currentStats,
        topTopics,
        comparison,
      });
    }

    // Buscar alertas da semana
    const alerts = await prisma.alert.findMany({
      where: {
        child: { parentId },
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      include: { child: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      parentId,
      period: {
        start: startDate,
        end: endDate,
      },
      children: childrenReports,
      alerts: {
        total: alerts.length,
        recent: alerts.slice(0, 5).map(a => ({
          childName: a.child.name,
          timestamp: a.createdAt,
          message: a.message,
        })),
      },
    };
  }
}

export const reportGenerator = new ReportGenerator();
