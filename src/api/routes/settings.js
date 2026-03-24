/**
 * Settings Routes
 * Configurações do pai (retenção de dados, etc.)
 */

import express from 'express';
import { authenticateParent } from '../../auth/parent-auth.js';

const router = express.Router();

// Armazenamento em memória (em produção, usar banco)
const settingsStore = new Map();

/**
 * GET /api/parent/settings/retention
 * Obter configuração de retenção
 */
router.get('/retention', authenticateParent, async (req, res) => {
  try {
    const setting = settingsStore.get(req.parent.id);
    res.json({ retentionDays: setting?.retentionDays || 90 });
  } catch (error) {
    console.error('Erro ao buscar settings:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

/**
 * PUT /api/parent/settings/retention
 * Atualizar configuração de retenção
 */
router.put('/retention', authenticateParent, async (req, res) => {
  try {
    const { retentionDays } = req.body;
    settingsStore.set(req.parent.id, { retentionDays });
    res.json({ success: true, retentionDays });
  } catch (error) {
    console.error('Erro ao salvar settings:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

export default router;
