/**
 * Escolar AI - Web Server
 * Interface ChatGPT-style na porta 3000
 */

import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import { GuardRailsEngine } from '../guardrails/index.js';
import { chat } from '../ai/client.js';
import { logger } from '../utils/logger.js';
import { conversationRepository } from '../db/repositories/conversation.js';

// Rotas
import parentAuthRoutes from '../api/routes/parent-auth.js';
import childrenRoutes from '../api/routes/children.js';
import childAuthRoutes from '../api/routes/child-auth.js';
import conversationRoutes from '../api/routes/conversations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const guardrails = new GuardRailsEngine();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ═══════════════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════════════
app.use('/api/auth/parent', parentAuthRoutes);
app.use('/api/auth/child', childAuthRoutes);
app.use('/api/parent/children', childrenRoutes);
app.use('/api/conversations', conversationRoutes);

// System prompts por modo
const SYSTEM_PROMPTS = {
  study: 'Você é um tutor educacional paciente. Responda de forma clara e didática, adequada para estudantes. Use emojis e exemplos.',
  homework: 'Ajude o estudante a pensar e resolver o problema, mas não dê a resposta diretamente. Faça perguntas que o guiem.',
  explain: 'Explique conceitos de forma simples e com exemplos do dia a dia. Use analogias quando possível.'
};

// API Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, history, childId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    // Guard Rails (Input)
    const inputCheck = await guardrails.check({ message, userId: 'web-user' });
    if (!inputCheck.safe) {
      // Salvar conversa bloqueada
      if (childId) {
        await conversationRepository.create({
          childId,
          input: message,
          status: 'blocked',
          blockReason: inputCheck.reason || 'guardrail',
          guardRail: JSON.stringify(inputCheck),
        });
      }
      return res.json({ 
        response: '🛡️ Essa pergunta está fora do contexto escolar. Que tal perguntar sobre matérias?'
      });
    }

    // Chat com Ollama
    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.study;
    
    const result = await chat([
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10), // Últimas 10 mensagens
      { role: 'user', content: message }
    ], { maxTokens: 500 });

    if (!result.success) {
      return res.json({ response: '🤔 Ops! Tente novamente em alguns segundos.' });
    }

    // Guard Rails (Output)
    const outputCheck = await guardrails.checkOutput(result.content);
    const response = outputCheck.safe ? result.content : '🤔 Ops! Tente perguntar de novo.';

    // Salvar conversa aprovada
    if (childId) {
      await conversationRepository.create({
        childId,
        input: message,
        output: response,
        status: 'approved',
        model: result.model,
        tokens: result.usage?.total_tokens || null,
        guardRail: JSON.stringify({ input: inputCheck, output: outputCheck }),
      });
    }

    res.json({ response, mode, model: result.model });

  } catch (error) {
    logger.error('Erro no chat:', error);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'escolar-ai-web' });
});

// History page
app.get('/history', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'history.html'));
});

// Dashboard (login de pai)
app.get('/dashboard', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'dashboard.html'));
});

// Serve index.html para chat
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Serve index.html para todas as outras rotas (chat)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Escolar AI Web rodando em http://localhost:${PORT}`);
  logger.info(`📚 Interface disponível!`);
});

export default app;
