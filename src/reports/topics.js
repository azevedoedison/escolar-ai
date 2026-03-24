/**
 * Topic Extraction
 * Extrai tópicos de conversas para relatórios
 */

// Keywords para extração de tópicos
export const TOPIC_KEYWORDS = {
  'Ciências': ['fotossíntese', 'planeta', 'átomo', 'dna', 'animal', 'planta', 'água', 'ar', 'evapora', 'ciclo', 'ciência', 'molécula', 'célula'],
  'Matemática': ['soma', 'divisão', 'multiplicação', 'número', 'conta', 'área', 'perímetro', 'triângulo', 'fração', 'matemática', 'equação', 'geometria'],
  'História': ['brasil', 'guerra', 'rei', 'rainha', 'descoberta', 'colonização', 'escravo', 'tiradentes', 'história', 'imperador', 'república'],
  'Português': ['verbo', 'substantivo', 'adjetivo', 'redação', 'texto', 'gramática', 'português', 'frase', 'sintaxe'],
  'Geografia': ['continente', 'país', 'capital', 'clima', 'rio', 'montanha', 'geografia', 'oceano', 'ilha'],
  'Inglês': ['english', 'word', 'vocabulary', 'verb to be', 'inglês', 'traduzir'],
};

/**
 * Extrair tópicos das conversas
 * @param {Array} conversations - Array de conversas com input
 * @returns {Array} - [{ topic, count, percentage }]
 */
export function extractTopics(conversations) {
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

  // Ordenar por count e pegar top 3
  const sorted = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic, count]) => ({
      topic,
      count,
      percentage: conversations.length > 0 
        ? ((count / conversations.length) * 100).toFixed(0) 
        : '0',
    }));

  return sorted;
}
