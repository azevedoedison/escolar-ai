/**
 * Escolar AI - Child Handler
 * Processa mensagens de crianças
 */

import { chat, FREE_MODELS } from '../../ai/client.js';
import { GuardRailsEngine } from '../../guardrails/index.js';
import { logger } from '../../utils/logger.js';

// Inicializar serviços
const guardrails = new GuardRailsEngine();

// System prompts por faixa etária
const SYSTEM_PROMPTS = {
  young: `Você é a Escolar AI, uma amiga que ajuda crianças de 6-8 anos a estudar.
REGRAS: Respostas CURTAS (2-3 frases), MUITOS emojis, linguagem SIMPLES.`,

  middle: `Você é a Escolar AI, um tutor amigável para crianças de 9-11 anos.
REGRAS: Respostas MÉDIAS (3-5 parágrafos), use emojis, dê exemplos práticos.`,

  preteen: `Você é a Escolar AI, um tutor para pré-adolescentes de 12-14 anos.
REGRAS: Respostas DETALHADAS, prepare para provas, tom respeitoso.`
};

export async function handleChildMessage(message, client) {
  const { body, from, author } = message;
  const userId = author || from;
  
  logger.info('Processando mensagem de criança', { userId });

  // 1. Guard Rails (Input)
  const inputCheck = await guardrails.check({
    message: body,
    userId
  });

  if (!inputCheck.safe) {
    logger.warn('Mensagem bloqueada', { userId, reason: inputCheck.reason });
    await message.reply(getBlockedResponse(inputCheck.reason));
    return;
  }

  // 2. RAG (TODO: implementar AutoRAG)
  // const context = await autorag.search(body, userId);

  // 3. OpenRouter (modelo gratuito)
  const systemPrompt = SYSTEM_PROMPTS.middle; // TODO: buscar baseado na idade
  
  const result = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: body }
  ], { maxTokens: 300 });

  if (!result.success) {
    await message.reply('🤔 Ops! Tente novamente em alguns segundos.');
    return;
  }

  const response = result.content;

  // 4. Guard Rails (Output)
  const outputCheck = await guardrails.checkOutput(response);
  
  if (!outputCheck.safe) {
    await message.reply(getSafeFallback());
    return;
  }

  // 5. Responder
  await message.reply(response);
  logger.info('Resposta enviada', { userId });
}

function getBlockedResponse(reason) {
  if (reason?.includes('violence') || reason?.includes('harm')) {
    return `🛡️ Essa pergunta não é adequada.\n\nSe você está se sentindo mal, procure um adulto ou ligue para o CVV: 188 💙`;
  }
  return `🛡️ Ops! Isso está fora do contexto escolar.\n\nQue tal perguntar sobre:\n• 🔬 Ciências\n• 📐 Matemática\n• 🌍 História`;
}

function getSafeFallback() {
  return `🤔 Ops! Tente perguntar de novo.\n\n📚 Pode perguntar à vontade sobre escola!`;
}
