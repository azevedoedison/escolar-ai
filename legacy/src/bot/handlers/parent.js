/**
 * Escolar AI - Parent Handler
 * Processa comandos de pais
 */

import { logger } from '../../utils/logger.js';

// Comandos disponíveis
const COMMANDS = {
  '!pai cadastrar': cadastrarFilho,
  '!pai filhos': listarFilhos,
  '!pai relatorio': enviarRelatorio,
  '!pai alertas': listarAlertas,
  '!pai ajuda': mostrarAjuda,
};

export async function handleParentCommand(message, client) {
  const { body, from, author } = message;
  const userId = author || from;
  const command = body.toLowerCase().trim();

  logger.info('Processando comando de pai', { userId, command });

  // Encontrar comando
  const handler = COMMANDS[command];
  
  if (handler) {
    const response = await handler(userId);
    await message.reply(response);
  } else if (command.startsWith('!pai cadastrar')) {
    const response = await cadastrarFilho(userId, command);
    await message.reply(response);
  } else {
    await message.reply(mostrarAjuda());
  }
}

async function cadastrarFilho(parentId, command) {
  // Formato: !pai cadastrar Maria 10 5ºano
  const parts = command.split(' ');
  
  if (parts.length < 4) {
    return `📝 *Como cadastrar:*\n\n!pai cadastrar [nome] [idade] [série]\n\nExemplo: !pai cadastrar Maria 10 5ºano`;
  }

  const name = parts[2];
  const age = parseInt(parts[3]);
  const grade = parts.slice(4).join(' ') || 'não informado';

  if (isNaN(age) || age < 6 || age > 14) {
    return `⚠️ Idade deve ser entre 6 e 14 anos.`;
  }

  // TODO: Salvar no banco de dados
  return `✅ *${name}* cadastrada com sucesso!\n\n👶 Idade: ${age} anos\n📚 Série: ${grade}\n\nAgora ${name} pode usar a Escolar AI! 🎉`;
}

async function listarFilhos(parentId) {
  // TODO: Buscar do banco
  return `📋 *Seus filhos cadastrados:*\n\n👶 Maria - 10 anos - 5ºano\n👶 João - 8 anos - 3ºano\n\nPara cadastrar: !pai cadastrar [nome] [idade] [série]`;
}

async function enviarRelatorio(parentId) {
  // TODO: Buscar do banco e formatar
  return `📊 *Relatório Semanal*\n\n📅 Período: 17-23 de Março\n\n👶 *Maria:*\n• 23 perguntas\n• 1h 45min de uso\n• 2 bloqueados\n• Favoritas: Ciências, Matemática\n\n✅ Sem alertas esta semana!`;
}

async function listarAlertas(parentId) {
  // TODO: Buscar do banco
  return `🔔 *Alertas Recentes*\n\nNenhum alerta nas últimas 24h ✅\n\n3 bloqueios na última semana:\n• "filme de terror" - bloqueado\n• "YouTuber" - bloqueado\n• "piada" - bloqueado`;
}

function mostrarAjuda() {
  return `🤖 *Escolar AI - Comandos do Pai*

📝 *!pai cadastrar [nome] [idade] [série]*
Cadastrar filho(a)

👶 *!pai filhos*  
Ver filhos cadastrados

📊 *!pai relatorio*
Relatório semanal

🔔 *!pai alertas*
Ver alertas recentes

💬 *Dúvidas?* Comente aqui!`;
}
