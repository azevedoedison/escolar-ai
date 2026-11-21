/**
 * Testes Unitários - Topic Extraction
 * T-004 | Reports System
 */

const { extractTopics, TOPIC_KEYWORDS } = await import('../../src/reports/topics.js');

describe('Topic Extraction', () => {
  describe('extractTopics', () => {
    it('deve extrair tópicos de conversas', () => {
      const conversations = [
        { input: 'O que é fotossíntese?' },
        { input: 'Como funciona a fotossíntese nas plantas?' },
        { input: 'Calcular área do triângulo' },
        { input: 'O que é DNA?' },
        { input: 'Como a água evapora?' },
      ];

      const topics = extractTopics(conversations);

      expect(topics).toBeInstanceOf(Array);
      expect(topics.length).toBeGreaterThan(0);

      // Ciências deve ser primeiro (3 matches: fotossíntese, DNA, água)
      const ciencias = topics.find(t => t.topic === 'Ciências');
      expect(ciencias).toBeDefined();
      expect(ciencias.count).toBeGreaterThanOrEqual(3); // fotossíntese, DNA, água
    });

    it('deve retornar top 3 tópicos', () => {
      const conversations = [
        { input: 'fotossíntese' },
        { input: 'triângulo' },
        { input: 'brasil colonização' },
        { input: 'verbo substantivo' },
        { input: 'capital frança' },
      ];

      const topics = extractTopics(conversations);

      expect(topics.length).toBeLessThanOrEqual(3);
    });

    it('deve calcular percentual corretamente', () => {
      const conversations = [
        { input: 'fotossíntese' },
        { input: 'DNA' },
        { input: 'água' },
        { input: 'triângulo' },
      ];

      const topics = extractTopics(conversations);

      // Ciências: 3/4 = 75%, Matemática: 1/4 = 25%
      const ciencias = topics.find(t => t.topic === 'Ciências');
      expect(ciencias.percentage).toBe('75');
    });

    it('deve retornar array vazio sem conversas', () => {
      const topics = extractTopics([]);
      expect(topics).toEqual([]);
    });

    it('deve lidar com perguntas sem tópico conhecido', () => {
      const conversations = [
        { input: 'asdfgh jklmn' },
        { input: 'pergunta sem sentido' },
      ];

      const topics = extractTopics(conversations);

      // Deve retornar "Outros" ou array vazio
      expect(topics).toBeInstanceOf(Array);
    });
  });

  describe('TOPIC_KEYWORDS', () => {
    it('deve ter keywords para Ciências', () => {
      expect(TOPIC_KEYWORDS['Ciências']).toContain('fotossíntese');
      expect(TOPIC_KEYWORDS['Ciências']).toContain('dna');
      expect(TOPIC_KEYWORDS['Ciências']).toContain('planeta');
    });

    it('deve ter keywords para Matemática', () => {
      expect(TOPIC_KEYWORDS['Matemática']).toContain('triângulo');
      expect(TOPIC_KEYWORDS['Matemática']).toContain('área');
      expect(TOPIC_KEYWORDS['Matemática']).toContain('soma');
    });

    it('deve ter keywords para História', () => {
      expect(TOPIC_KEYWORDS['História']).toContain('brasil');
      expect(TOPIC_KEYWORDS['História']).toContain('guerra');
    });

    it('deve ter keywords para Português', () => {
      expect(TOPIC_KEYWORDS['Português']).toContain('verbo');
      expect(TOPIC_KEYWORDS['Português']).toContain('substantivo');
    });
  });

  describe('Cenários reais', () => {
    it('deve categorizar perguntas típicas de criança', () => {
      const conversations = [
        { input: 'O que é fotossíntese?' },
        { input: 'Como calcular área do triângulo?' },
        { input: 'Quem descobriu o Brasil?' },
        { input: 'O que é substantivo?' },
        { input: 'Como funciona o ciclo da água?' },
      ];

      const topics = extractTopics(conversations);

      // Deve ter pelo menos Ciências, Matemática, História, Português
      expect(topics.length).toBeGreaterThanOrEqual(3);
    });

    it('deve funcionar com perguntas curtas', () => {
      const conversations = [
        { input: 'DNA' },
        { input: 'triângulo' },
        { input: 'brasil' },
      ];

      const topics = extractTopics(conversations);

      expect(topics.length).toBeGreaterThan(0);
    });
  });
});
