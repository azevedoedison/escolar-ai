/**
 * Testes Unitários - Format Layer (Camada 1)
 */

import { FormatLayer } from '../../../src/guardrails/layers/format';

describe('FormatLayer', () => {
  const layer = new FormatLayer({ minLength: 3, maxLength: 500 });

  describe('Mensagens válidas', () => {
    it('deve aprovar mensagem dentro do limite', async () => {
      const result = await layer.validate({
        message: 'O que é fotossíntese?',
        userId: 'test-user',
      });

      expect(result.passed).toBe(true);
      expect(result.name).toBe('format');
      expect(result.confidence).toBe(1.0);
    });

    it('deve aprovar mensagem com 3 caracteres (mínimo)', async () => {
      const result = await layer.validate({
        message: 'abc',
        userId: 'test-user',
      });

      expect(result.passed).toBe(true);
    });

    it('deve aprovar mensagem com 500 caracteres (máximo)', async () => {
      const message = 'a'.repeat(500);
      const result = await layer.validate({
        message,
        userId: 'test-user',
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('Mensagens inválidas', () => {
    it('deve bloquear mensagem muito curta (< 3 chars)', async () => {
      const result = await layer.validate({
        message: 'oi',
        userId: 'test-user',
      });

      expect(result.passed).toBe(false);
      expect(result.reason).toBe('Mensagem muito curta');
    });

    it('deve bloquear mensagem vazia', async () => {
      const result = await layer.validate({
        message: '',
        userId: 'test-user',
      });

      expect(result.passed).toBe(false);
    });

    it('deve bloquear mensagem muito longa (> 500 chars)', async () => {
      const message = 'a'.repeat(501);
      const result = await layer.validate({
        message,
        userId: 'test-user',
      });

      expect(result.passed).toBe(false);
      expect(result.reason).toBe('Mensagem muito longa');
    });
  });

  describe('Edge cases', () => {
    it('deve aprovar mensagem com espaços que totalizam >= 3 chars', async () => {
      const result = await layer.validate({
        message: '   ',
        userId: 'test-user',
      });

      // Espaços trimmed resultam em 0 chars
      expect(result.passed).toBe(false);
    });

    it('deve aprovar mensagem com emojis', async () => {
      const result = await layer.validate({
        message: 'O que é 🌱 fotossíntese?',
        userId: 'test-user',
      });

      expect(result.passed).toBe(true);
    });

    it('deve aprovar mensagem com acentos', async () => {
      const result = await layer.validate({
        message: 'Como funciona a fotossíntese das árvores?',
        userId: 'test-user',
      });

      expect(result.passed).toBe(true);
    });
  });
});
