/**
 * Escolar AI - Web Interface
 * Chat estilo ChatGPT para testes
 */

import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { chat } from '../ai/client.js';
import { GuardRailsEngine } from '../guardrails/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const guardrails = new GuardRailsEngine();

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// System prompt
const SYSTEM_PROMPT = `Você é a Escolar AI, uma amiga que ajuda crianças de 6-14 anos a estudar.

REGRAS:
- Responda de forma SIMPLES e DIVERTIDA
- Use MUITOS emojis 🎉📚🔬
- Use comparações que crianças entendem
- Se não souber algo, diga que vai estudar mais!
- Máximo 3 parágrafos

Você é um tutor amigável e patiente.`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    // 1. Guard Rails
    console.log('🛡️ Guard Rails check:', message);
    const guardCheck = await guardrails.check({ message, userId: 'web-user' });
    console.log('🛡️ Resultado:', guardCheck);
    
    if (!guardCheck.safe) {
      return res.json({
        response: getBlockedResponse(guardCheck.reason),
        blocked: true,
        reason: guardCheck.reason
      });
    }

    // 2. Chat com IA
    const result = await chat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message }
    ], { maxTokens: 300 });

    if (!result.success) {
      return res.json({
        response: '🤔 Ops! Algo deu errado. Tente novamente!',
        error: true
      });
    }

    res.json({
      response: result.content,
      model: result.model,
      source: result.source
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

function getBlockedResponse(reason) {
  return `🛡️ **Ops! Essa pergunta está fora do contexto escolar.**

Que tal perguntar sobre:
• 🔬 Ciências
• 📐 Matemática
• 🌍 História  
• 📖 Português

📚 **O que você quer aprender?**`;
}

const PORT = process.env.WEB_PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎓 Escolar AI - Interface Web`);
  console.log(`📱 Abra: http://localhost:${PORT}\n`);
});
