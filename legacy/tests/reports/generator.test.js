/**
 * Testes Unitários - ReportGenerator
 * T-001 | Reports System
 * 
 * Testes de lógica pura (sem mock de Prisma)
 */

const { ReportGenerator } = await import('../../src/reports/generator.js');

describe('ReportGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new ReportGenerator();
  });

  describe('formatTimeFromTokens', () => {
    it('deve formatar tokens em tempo legível', () => {
      expect(generator.formatTimeFromTokens(100)).toBe('50s');
      expect(generator.formatTimeFromTokens(120)).toBe('1min');
      expect(generator.formatTimeFromTokens(240)).toBe('2min');
      expect(generator.formatTimeFromTokens(2100)).toBe('17min 30s');
      expect(generator.formatTimeFromTokens(6300)).toBe('52min 30s');
      expect(generator.formatTimeFromTokens(null)).toBe('0s');
      expect(generator.formatTimeFromTokens(0)).toBe('0s');
    });

    it('deve formatar horas corretamente', () => {
      expect(generator.formatTimeFromTokens(7200)).toBe('1h');
      expect(generator.formatTimeFromTokens(8400)).toBe('1h 10min');
      expect(generator.formatTimeFromTokens(10800)).toBe('1h 30min');
    });
  });

  describe('calculateComparison', () => {
    it('deve calcular percentual de aumento', () => {
      const current = { totalQuestions: 23, totalBlocked: 2 };
      const previous = { totalQuestions: 20, totalBlocked: 4 };

      const comparison = generator.calculateComparison(current, previous);

      expect(comparison.questionsChange).toBe('+15%');
      expect(comparison.blockedChange).toBe('-50%');
    });

    it('deve lidar com semana anterior sem dados', () => {
      const current = { totalQuestions: 23, totalBlocked: 2 };
      const previous = null;

      const comparison = generator.calculateComparison(current, previous);

      expect(comparison.questionsChange).toBe('N/A');
      expect(comparison.blockedChange).toBe('N/A');
    });

    it('deve lidar com zero na semana anterior', () => {
      const current = { totalQuestions: 10, totalBlocked: 0 };
      const previous = { totalQuestions: 0, totalBlocked: 0 };

      const comparison = generator.calculateComparison(current, previous);

      expect(comparison.questionsChange).toBe('N/A');
      expect(comparison.blockedChange).toBe('0%');
    });

    it('deve calcular diminuição', () => {
      const current = { totalQuestions: 15, totalBlocked: 1 };
      const previous = { totalQuestions: 25, totalBlocked: 3 };

      const comparison = generator.calculateComparison(current, previous);

      expect(comparison.questionsChange).toBe('-40%');
      expect(comparison.blockedChange).toBe('-67%');
    });
  });

  describe('extractTopics', () => {
    it('deve extrair tópicos das conversas', () => {
      const conversations = [
        { input: 'O que é fotossíntese?' },
        { input: 'Como funciona a fotossíntese?' },
        { input: 'Calcular área do triângulo' },
        { input: 'O que é DNA?' },
      ];

      const topics = generator.extractTopics(conversations);

      expect(topics).toBeInstanceOf(Array);
      expect(topics.length).toBeGreaterThan(0);
      expect(topics[0]).toHaveProperty('topic');
      expect(topics[0]).toHaveProperty('count');
      expect(topics[0]).toHaveProperty('percentage');
    });

    it('deve retornar array vazio sem conversas', () => {
      const topics = generator.extractTopics([]);
      expect(topics).toEqual([]);
    });

    it('deve retornar top 3 tópicos', () => {
      const conversations = [
        { input: 'fotossíntese' },
        { input: 'triângulo' },
        { input: 'brasil' },
        { input: 'verbo' },
        { input: 'capital' },
      ];

      const topics = generator.extractTopics(conversations);

      expect(topics.length).toBeLessThanOrEqual(3);
    });

    it('deve ordenar por frequência', () => {
      const conversations = [
        { input: 'fotossíntese' },
        { input: 'DNA' },
        { input: 'água' },
        { input: 'triângulo' },
      ];

      const topics = generator.extractTopics(conversations);

      // Ciências tem 3, Matemática tem 1
      expect(topics[0].topic).toBe('Ciências');
      expect(topics[0].count).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Cálculos auxiliares', () => {
    it('deve calcular blockedRate', () => {
      // Simular cálculo
      const total = 10;
      const blocked = 2;
      const rate = ((blocked / total) * 100).toFixed(1);

      expect(rate).toBe('20.0');
    });

    it('deve lidar com divisão por zero', () => {
      const total = 0;
      const blocked = 0;
      const rate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0';

      expect(rate).toBe('0');
    });
  });
});
