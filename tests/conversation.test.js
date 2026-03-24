/**
 * Testes - Conversation Repository
 * Task 7: Histórico de Conversas
 * 
 * Testes de lógica sem dependência de Prisma
 */

describe('Conversation Repository - Lógica', () => {
  
  describe('Lógica de estatísticas', () => {
    it('deve calcular blockedRate corretamente', () => {
      const conversations = [
        { status: 'approved' },
        { status: 'approved' },
        { status: 'approved' },
        { status: 'blocked' },
        { status: 'blocked' },
      ];

      const total = conversations.length;
      const blocked = conversations.filter(c => c.status === 'blocked').length;
      const blockedRate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0';

      expect(blockedRate).toBe('40.0');
    });

    it('deve retornar 0 quando não há conversas', () => {
      const conversations = [];
      const total = conversations.length;
      const blocked = 0;
      const blockedRate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0';

      expect(blockedRate).toBe('0');
    });

    it('deve contar por motivo de bloqueio', () => {
      const conversations = [
        { status: 'blocked', blockReason: 'outOfContext' },
        { status: 'blocked', blockReason: 'violence' },
        { status: 'blocked', blockReason: 'outOfContext' },
        { status: 'approved', blockReason: null },
      ];

      const blockReasons = {};
      conversations
        .filter(c => c.status === 'blocked' && c.blockReason)
        .forEach(c => {
          blockReasons[c.blockReason] = (blockReasons[c.blockReason] || 0) + 1;
        });

      expect(blockReasons).toEqual({
        outOfContext: 2,
        violence: 1,
      });
    });
  });

  describe('Filtros de data', () => {
    it('deve filtrar conversas por período', () => {
      const conversations = [
        { createdAt: new Date('2024-01-05'), input: 'Pergunta 1' },
        { createdAt: new Date('2024-01-15'), input: 'Pergunta 2' },
        { createdAt: new Date('2024-02-01'), input: 'Pergunta 3' },
      ];

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const filtered = conversations.filter(c => 
        c.createdAt >= startDate && c.createdAt <= endDate
      );

      expect(filtered).toHaveLength(2);
      expect(filtered[0].input).toBe('Pergunta 1');
      expect(filtered[1].input).toBe('Pergunta 2');
    });
  });

  describe('Ordenação', () => {
    it('deve ordenar por data (mais recente primeiro)', () => {
      const conversations = [
        { createdAt: new Date('2024-01-01'), input: 'Antiga' },
        { createdAt: new Date('2024-01-15'), input: 'Média' },
        { createdAt: new Date('2024-01-30'), input: 'Recente' },
      ];

      const sorted = [...conversations].sort((a, b) => 
        b.createdAt - a.createdAt
      );

      expect(sorted[0].input).toBe('Recente');
      expect(sorted[1].input).toBe('Média');
      expect(sorted[2].input).toBe('Antiga');
    });
  });

  describe('Limpeza de dados antigos', () => {
    it('deve identificar conversas para deletar (> 30 dias)', () => {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const conversations = [
        { createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000), id: 'recente' },  // 5 dias
        { createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000), id: 'media' },   // 15 dias
        { createdAt: new Date(now - 35 * 24 * 60 * 60 * 1000), id: 'antiga1' }, // 35 dias
        { createdAt: new Date(now - 60 * 24 * 60 * 60 * 1000), id: 'antiga2' }, // 60 dias
      ];

      const toDelete = conversations.filter(c => c.createdAt < thirtyDaysAgo);

      expect(toDelete).toHaveLength(2);
      expect(toDelete.map(c => c.id)).toContain('antiga1');
      expect(toDelete.map(c => c.id)).toContain('antiga2');
    });
  });
});
