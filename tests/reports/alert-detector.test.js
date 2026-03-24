/**
 * Testes Unitários - AlertDetector
 * T-002 | Reports System
 */

const { AlertDetector } = await import('../../src/reports/alert-detector.js');

describe('AlertDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new AlertDetector();
    detector.hourlyCounts.clear();
  });

  describe('recordBlock', () => {
    it('deve incrementar contador de bloqueios', async () => {
      const result1 = await detector.recordBlock('child-123', {
        input: 'maconha',
        reason: 'drogas',
      });

      expect(result1.count).toBe(1);
      expect(result1.shouldAlert).toBe(false);

      const result2 = await detector.recordBlock('child-123', {
        input: 'terror',
        reason: 'outOfContext',
      });

      expect(result2.count).toBe(2);
      expect(result2.shouldAlert).toBe(false);

      const result3 = await detector.recordBlock('child-123', {
        input: 'youtuber',
        reason: 'outOfContext',
      });

      expect(result3.count).toBe(3);
      expect(result3.shouldAlert).toBe(true); // Threshold atingido!
    });

    it('deve manter contadores separados por criança', async () => {
      await detector.recordBlock('child-123', { input: 'a' });
      await detector.recordBlock('child-123', { input: 'b' });
      await detector.recordBlock('child-456', { input: 'c' });

      const state1 = detector.hourlyCounts.get('child-123');
      const state2 = detector.hourlyCounts.get('child-456');

      expect(state1.count).toBe(2);
      expect(state2.count).toBe(1);
    });
  });

  describe('checkThreshold', () => {
    it('deve retornar shouldAlert=true quando atinge 3 bloqueios', async () => {
      await detector.recordBlock('child-123', { input: 'a' });
      await detector.recordBlock('child-123', { input: 'b' });
      const result = await detector.recordBlock('child-123', { input: 'c' });

      expect(result.shouldAlert).toBe(true);
      expect(result.attempts).toHaveLength(3);
    });

    it('deve retornar shouldAlert=false abaixo do threshold', async () => {
      await detector.recordBlock('child-123', { input: 'a' });
      const result = await detector.recordBlock('child-123', { input: 'b' });

      expect(result.shouldAlert).toBe(false);
      expect(result.count).toBe(2);
    });
  });

  describe('shouldSendAlert', () => {
    beforeEach(() => {
      // Simular que já houve alerta
      detector.lastAlertSent = new Map();
    });

    it('deve permitir alerta se passou 1 hora', () => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000) - 1000;
      detector.lastAlertSent.set('child-123', oneHourAgo);

      const canSend = detector.shouldSendAlert('child-123');

      expect(canSend).toBe(true);
    });

    it('deve bloquear alerta se menos de 1 hora', () => {
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      detector.lastAlertSent.set('child-123', thirtyMinutesAgo);

      const canSend = detector.shouldSendAlert('child-123');

      expect(canSend).toBe(false);
    });

    it('deve permitir primeiro alerta', () => {
      const canSend = detector.shouldSendAlert('child-never-alerted');

      expect(canSend).toBe(true);
    });
  });

  describe('Integration: fluxo completo de alerta', () => {
    it('deve detectar e preparar alerta após 3 bloqueios', async () => {
      // Simular 3 bloqueios em menos de 1 hora
      const r1 = await detector.recordBlock('child-123', {
        input: 'qual a vibe de fumar maconha',
        reason: 'drogas',
      });
      expect(r1.shouldAlert).toBe(false);

      const r2 = await detector.recordBlock('child-123', {
        input: 'filme de terror mais assustador',
        reason: 'outOfContext',
      });
      expect(r2.shouldAlert).toBe(false);

      const r3 = await detector.recordBlock('child-123', {
        input: 'youtuber mais famoso',
        reason: 'outOfContext',
      });
      expect(r3.shouldAlert).toBe(true);
      expect(r3.attempts).toHaveLength(3);
      expect(r3.attempts[0].input).toContain('maconha');
    });
  });

  describe('getActiveAlerts', () => {
    it('deve retornar alertas ativos para uma criança', async () => {
      // Criar alguns bloqueios
      await detector.recordBlock('child-123', { input: 'a', reason: 'test' });
      await detector.recordBlock('child-123', { input: 'b', reason: 'test' });
      await detector.recordBlock('child-123', { input: 'c', reason: 'test' });

      const active = detector.getActiveAlerts('child-123');

      expect(active).toHaveProperty('count');
      expect(active).toHaveProperty('attempts');
    });
  });

  describe('resetHourlyCounter', () => {
    it('deve resetar contador após 1 hora', () => {
      const oldTime = Date.now() - (61 * 60 * 1000); // 61 minutos atrás
      
      detector.hourlyCounts.set('child-123', {
        count: 5,
        resetAt: oldTime,
        attempts: [],
      });

      detector.resetHourlyCounter('child-123');

      const state = detector.hourlyCounts.get('child-123');
      expect(state.count).toBe(0);
    });
  });
});
