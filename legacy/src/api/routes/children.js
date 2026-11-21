/**
 * Children Routes
 * CRUD de filhos pelo pai
 * GET/POST /api/parent/children
 * GET/PATCH/DELETE /api/parent/children/:id
 */

import { Router } from 'express';
import { authenticateParent } from '../../auth/parent-auth.js';
import { childRepository } from '../../db/repositories/child.js';

const router = Router();

// Todas as rotas requerem autenticação do pai
router.use(authenticateParent);

// ═══════════════════════════════════════════════════
// GET /api/parent/children - Lista filhos
// ═══════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const children = await childRepository.findByParentId(req.parentId);
    res.json({ children });
  } catch (error) {
    console.error('List children error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/parent/children - Cadastra filho
// ═══════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const { name, nickname, password, email, age, grade, school, city, state } = req.body;

    // Validações obrigatórias
    if (!name || !nickname || !password || !age) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, nickname, password, age' 
      });
    }

    // Validar idade (6-14)
    if (!childRepository.validateAge(Number(age))) {
      return res.status(400).json({ 
        error: 'Age must be between 6 and 14 years' 
      });
    }

    // Validar nickname (apenas letras, números, underscore)
    const nicknameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!nicknameRegex.test(nickname)) {
      return res.status(400).json({ 
        error: 'Nickname must be 3-20 characters (letters, numbers, underscore only)' 
      });
    }

    // Validar senha
    if (password.length < 4) {
      return res.status(400).json({ 
        error: 'Password must be at least 4 characters' 
      });
    }

    // Verificar se nickname já existe
    const nicknameTaken = await childRepository.nicknameExists(nickname);
    if (nicknameTaken) {
      return res.status(409).json({ 
        error: 'Nickname already taken. Choose another.' 
      });
    }

    // Criar filho
    const child = await childRepository.create({
      parentId: req.parentId,
      name,
      nickname,
      password,
      email,
      age: Number(age),
      grade,
      school,
      city,
      state,
    });

    res.status(201).json({
      message: 'Child registered successfully',
      child,
    });
  } catch (error) {
    console.error('Create child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// GET /api/parent/children/:id - Detalhes do filho
// ═══════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const child = await childRepository.findWithStats(req.params.id);
    
    if (!child || child.parentId !== req.parentId) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ child });
  } catch (error) {
    console.error('Get child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// PATCH /api/parent/children/:id - Atualiza filho
// ═══════════════════════════════════════════════════
router.patch('/:id', async (req, res) => {
  try {
    const child = await childRepository.findById(req.params.id);
    
    if (!child || child.parentId !== req.parentId) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const { name, grade, school, city, state } = req.body;

    const updated = await childRepository.update(req.params.id, {
      ...(name && { name }),
      ...(grade !== undefined && { grade }),
      ...(school !== undefined && { school }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
    });

    res.json({
      message: 'Child updated successfully',
      child: updated,
    });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/parent/children/:id/toggle - Ativa/Desativa
// ═══════════════════════════════════════════════════
router.post('/:id/toggle', async (req, res) => {
  try {
    const child = await childRepository.findById(req.params.id);
    
    if (!child || child.parentId !== req.parentId) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const updated = await childRepository.toggleActive(req.params.id);

    res.json({
      message: `Child ${updated.active ? 'activated' : 'deactivated'} successfully`,
      active: updated.active,
    });
  } catch (error) {
    console.error('Toggle child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/parent/children/:id/reset-password
// ═══════════════════════════════════════════════════
router.post('/:id/reset-password', async (req, res) => {
  try {
    const child = await childRepository.findById(req.params.id);
    
    if (!child || child.parentId !== req.parentId) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ 
        error: 'New password must be at least 4 characters' 
      });
    }

    await childRepository.resetPassword(req.params.id, newPassword);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// DELETE /api/parent/children/:id - Desativar filho
// ═══════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    const child = await childRepository.findById(req.params.id);
    
    if (!child || child.parentId !== req.parentId) {
      return res.status(404).json({ error: 'Child not found' });
    }

    await childRepository.deactivate(req.params.id);

    res.json({ message: 'Child deactivated successfully' });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
