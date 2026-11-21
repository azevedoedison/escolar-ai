/**
 * Escolar AI - WhatsApp Bot
 * Entry point principal
 */

import 'dotenv/config';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { handleChildMessage } from './handlers/child.js';
import { handleParentCommand } from './handlers/parent.js';
import { logger } from '../utils/logger.js';

// Configuração do bot
const CHILD_KEYWORDS = ['o que é', 'como', 'quando', 'onde', 'por que', 'quanto', 'quem'];
const PARENT_COMMANDS = ['!pai'];

// Inicializar cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

// Evento: QR Code gerado
client.on('qr', (qr) => {
  logger.info('📱 Escaneie o QR Code abaixo:');
  qrcode.generate(qr, { small: true });
});

// Evento: Pronto para uso
client.on('ready', () => {
  logger.info('✅ Escolar AI está online!');
  logger.info('📱 WhatsApp conectado e pronto para receber mensagens');
});

// Evento: Mensagem recebida
client.on('message', async (message) => {
  try {
    const { body, from, author } = message;
    const text = body.toLowerCase().trim();

    logger.debug('Mensagem recebida', { from, text: text.substring(0, 50) });

    // Verificar se é comando de pai
    if (text.startsWith('!pai')) {
      await handleParentCommand(message, client);
      return;
    }

    // Verificar se parece pergunta escolar
    const isSchoolQuestion = CHILD_KEYWORDS.some(kw => text.includes(kw)) || text.includes('?');
    
    if (isSchoolQuestion) {
      await handleChildMessage(message, client);
      return;
    }

    // Resposta padrão (não identificado)
    // Não responde para não poluir conversas normais

  } catch (error) {
    logger.error('Erro ao processar mensagem', { error: error.message });
    await message.reply('Ops! Algo deu errado. Tente novamente em alguns segundos. 🤖');
  }
});

// Inicializar bot
logger.info('🚀 Iniciando Escolar AI...');
client.initialize();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('👋 Encerrando Escolar AI...');
  await client.destroy();
  process.exit(0);
});
