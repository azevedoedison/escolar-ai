/**
 * Parent Auth Routes
 * POST /api/auth/parent/*
 */

import { Router } from 'express';
import { register, login, refresh, logout, authenticateParent } from '../../auth/parent-auth.js';
import { parentRepository } from '../../db/repositories/parent.js';

const router = Router();

// ═══════════════════════════════════════════════════
// POST /api/auth/parent/register
// ═══════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const { email, name, phone, password } = req.body;

    // Validações básicas
    if (!email || !name || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, name, password' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Validar email formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await register({ email, name, phone, password });

    res.status(201).json({
      message: 'Account created successfully',
      ...result,
    });
  } catch (error) {
    if (error.message.includes('already registered')) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/auth/parent/login
// ═══════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await login(email, password);

    res.json({
      message: 'Login successful',
      ...result,
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('Google Sign-In')) {
      return res.status(401).json({ error: error.message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/auth/parent/refresh
// ═══════════════════════════════════════════════════
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const tokens = await refresh(refreshToken);

    res.json({
      message: 'Token refreshed',
      ...tokens,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/auth/parent/logout
// ═══════════════════════════════════════════════════
router.post('/logout', authenticateParent, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    await logout(token);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// GET /api/auth/parent/me - Perfil do pai logado
// ═══════════════════════════════════════════════════
router.get('/me', authenticateParent, async (req, res) => {
  try {
    const parent = await parentRepository.findWithChildren(req.parentId);
    
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json({ parent });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
