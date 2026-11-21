/**
 * Child Auth Routes
 * POST /api/auth/child/*
 */

import { Router } from 'express';
import { childLogin, childRefresh, childLogout, authenticateChild } from '../../auth/child-auth.js';
import { childRepository } from '../../db/repositories/child.js';

const router = Router();

// ═══════════════════════════════════════════════════
// POST /api/auth/child/login
// ═══════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { nickname, password } = req.body;

    if (!nickname || !password) {
      return res.status(400).json({ error: 'Nickname and password required' });
    }

    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const result = await childLogin(nickname, password, clientIp);

    res.json({
      message: 'Login successful',
      ...result,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    
    if (status === 429) {
      return res.status(429).json({ 
        error: error.message,
        retryAfter: error.retryAfter,
      });
    }
    
    if (status === 403) {
      return res.status(403).json({ error: error.message });
    }

    if (status === 401) {
      return res.status(401).json({ error: error.message });
    }

    console.error('Child login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/auth/child/refresh
// ═══════════════════════════════════════════════════
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const tokens = await childRefresh(refreshToken);

    res.json({
      message: 'Token refreshed',
      ...tokens,
    });
  } catch (error) {
    res.status(error.statusCode || 401).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/auth/child/logout
// ═══════════════════════════════════════════════════
router.post('/logout', authenticateChild, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await childLogout(token);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Child logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// GET /api/auth/child/profile - Perfil do filho logado
// ═══════════════════════════════════════════════════
router.get('/profile', authenticateChild, async (req, res) => {
  try {
    const child = await childRepository.findById(req.childId);

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({
      child: {
        id: child.id,
        name: child.name,
        nickname: child.nickname,
        age: child.age,
        grade: child.grade,
        school: child.school,
        city: child.city,
        state: child.state,
      },
    });
  } catch (error) {
    console.error('Child profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
