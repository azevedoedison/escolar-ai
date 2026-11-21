/**
 * Testes - Dashboard Web (frontend logic)
 * T-007 | Reports System
 */

// Testes de lógica pura do frontend (sem DOM)

describe('Dashboard Utils', () => {
  
  describe('formatDate', () => {
    it('deve formatar data para DD/MM/YYYY', async () => {
      const { formatDate } = await import('../../src/web/public/history.js');
      
      const date = new Date('2024-03-15T14:30:00');
      expect(formatDate(date)).toBe('15/03/2024');
    });

    it('deve formatar hora para HH:MM', async () => {
      const { formatTime } = await import('../../src/web/public/history.js');
      
      const date = new Date('2024-03-15T14:30:00');
      expect(formatTime(date)).toBe('14:30');
    });
  });

  describe('formatRelativeTime', () => {
    it('deve mostrar "há 5 minutos" para datas recentes', async () => {
      const { formatRelativeTime } = await import('../../src/web/public/history.js');
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toContain('minuto');
    });

    it('deve mostrar "há 2 horas"', async () => {
      const { formatRelativeTime } = await import('../../src/web/public/history.js');
      
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toContain('hora');
    });

    it('deve mostrar "ontem" para ontem', async () => {
      const { formatRelativeTime } = await import('../../src/web/public/history.js');
      
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(yesterday)).toContain('ontem');
    });
  });

  describe('statusIcon', () => {
    it('deve retornar 🟢 para approved', async () => {
      const { statusIcon } = await import('../../src/web/public/history.js');
      
      expect(statusIcon('approved')).toBe('🟢');
      expect(statusIcon('aprovado')).toBe('🟢');
    });

    it('deve retornar 🔴 para blocked', async () => {
      const { statusIcon } = await import('../../src/web/public/history.js');
      
      expect(statusIcon('blocked')).toBe('🔴');
      expect(statusIcon('bloqueado')).toBe('🔴');
    });
  });

  describe('truncateText', () => {
    it('deve truncar texto longo', async () => {
      const { truncateText } = await import('../../src/web/public/history.js');
      
      const longText = 'A'.repeat(100);
      expect(truncateText(longText, 50)).toHaveLength(53); // 50 + '...'
    });

    it('não deve truncar texto curto', async () => {
      const { truncateText } = await import('../../src/web/public/history.js');
      
      expect(truncateText('Texto curto', 50)).toBe('Texto curto');
    });
  });

  describe('buildQueryString', () => {
    it('deve montar query string com parâmetros', async () => {
      const { buildQueryString } = await import('../../src/web/public/history.js');
      
      const params = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        status: 'blocked',
        search: '',
      };

      const query = buildQueryString(params);
      expect(query).toContain('startDate=2024-01-01');
      expect(query).toContain('endDate=2024-01-31');
      expect(query).toContain('status=blocked');
    });

    it('deve ignorar parâmetros vazios', async () => {
      const { buildQueryString } = await import('../../src/web/public/history.js');
      
      const params = {
        startDate: '',
        status: null,
        search: undefined,
      };

      const query = buildQueryString(params);
      expect(query).toBe('');
    });
  });

  describe('debounce', () => {
    it('deve aguardar antes de executar', async () => {
      const { debounce } = await import('../../src/web/public/history.js');
      
      let count = 0;
      const increment = () => { count++; };
      const debounced = debounce(increment, 100);

      debounced();
      debounced();
      debounced();

      expect(count).toBe(0);

      await new Promise(r => setTimeout(r, 150));
      expect(count).toBe(1);
    });
  });

  describe('groupByDate', () => {
    it('deve agrupar conversas por data', async () => {
      const { groupByDate } = await import('../../src/web/public/history.js');
      
      const conversations = [
        { id: 1, createdAt: '2024-03-24T10:00:00Z' },
        { id: 2, createdAt: '2024-03-24T14:00:00Z' },
        { id: 3, createdAt: '2024-03-23T10:00:00Z' },
      ];

      const grouped = groupByDate(conversations);
      
      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['24/03/2024']).toHaveLength(2);
      expect(grouped['23/03/2024']).toHaveLength(1);
    });
  });

  describe('calculateStats', () => {
    it('deve calcular estatísticas do array', async () => {
      const { calculateStats } = await import('../../src/web/public/history.js');
      
      const conversations = [
        { status: 'approved', tokens: 100 },
        { status: 'approved', tokens: 150 },
        { status: 'blocked', tokens: 0 },
        { status: 'approved', tokens: 200 },
      ];

      const stats = calculateStats(conversations);
      
      expect(stats.total).toBe(4);
      expect(stats.approved).toBe(3);
      expect(stats.blocked).toBe(1);
      expect(stats.blockedRate).toBe('25.0');
      expect(stats.totalTokens).toBe(450);
    });

    it('deve retornar zeros para array vazio', async () => {
      const { calculateStats } = await import('../../src/web/public/history.js');
      
      const stats = calculateStats([]);
      
      expect(stats.total).toBe(0);
      expect(stats.approved).toBe(0);
      expect(stats.blocked).toBe(0);
      expect(stats.blockedRate).toBe('0');
    });
  });

  describe('exportToCSV', () => {
    it('deve gerar CSV válido', async () => {
      const { exportToCSV } = await import('../../src/web/public/history.js');
      
      const conversations = [
        {
          createdAt: '2024-03-24T10:00:00Z',
          input: 'O que é fotossíntese?',
          output: 'Fotossíntese é...',
          status: 'approved',
          blockReason: null,
        },
        {
          createdAt: '2024-03-24T14:00:00Z',
          input: 'maconha vibe',
          output: null,
          status: 'blocked',
          blockReason: 'drogas',
        },
      ];

      const csv = exportToCSV(conversations);
      
      expect(csv).toContain('Data,Hora,Pergunta,Resposta,Status,Motivo');
      expect(csv).toContain('24/03/2024');
      expect(csv).toContain('O que é fotossíntese?');
      expect(csv).toContain('approved');
      expect(csv).toContain('drogas');
    });

    it('deve escapar vírgulas no texto', async () => {
      const { exportToCSV } = await import('../../src/web/public/history.js');
      
      const conversations = [
        {
          createdAt: '2024-03-24T10:00:00Z',
          input: 'Olá, tudo bem?',
          output: 'Tudo bem, e você?',
          status: 'approved',
          blockReason: null,
        },
      ];

      const csv = exportToCSV(conversations);
      
      // Vírgulas devem ser escapadas
      expect(csv).toContain('"Olá, tudo bem?"');
    });
  });
});
