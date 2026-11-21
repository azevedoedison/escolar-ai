/**
 * Parent Authentication
 * Google OAuth + JWT + Login com email/senha
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { parentRepository } from '../db/repositories/parent.js';
import { sessionRepository } from '../db/repositories/session.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 10;

// ═══════════════════════════════════════════════════
// Token Generation
// ═══════════════════════════════════════════════════

function generateAccessToken(parent) {
  return jwt.sign(
    {
      sub: parent.id,
      type: 'parent',
      email: parent.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function generateRefreshToken(parent) {
  return jwt.sign(
    {
      sub: parent.id,
      type: 'parent_refresh',
      jti: crypto.randomUUID(),
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES }
  );
}

function getExpiresAt(expiresIn) {
  const now = new Date();
  if (expiresIn === '15m') return new Date(now.getTime() + 15 * 60 * 1000);
  if (expiresIn === '7d') return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() + 15 * 60 * 1000);
}

// ═══════════════════════════════════════════════════
// Google OAuth
// ═══════════════════════════════════════════════════

/**
 * Processar callback do Google OAuth
 * Cria ou encontra o pai e gera tokens
 */
export async function handleGoogleCallback(googleProfile) {
  const { id: googleId, emails, displayName } = googleProfile;
  
  if (!emails || emails.length === 0) {
    throw new Error('Google account must have an email');
  }

  const email = emails[0].value;

  // Criar ou encontrar pai
  const parent = await parentRepository.findOrCreateGoogle({
    googleId,
    email,
    name: displayName,
  });

  // Gerar tokens
  const accessToken = generateAccessToken(parent);
  const refreshToken = generateRefreshToken(parent);

  // Salvar sessão
  await sessionRepository.create({
    userId: parent.id,
    userType: 'parent',
    token: accessToken,
    refreshToken,
    expiresAt: getExpiresAt(JWT_REFRESH_EXPIRES),
  });

  return {
    parent: {
      id: parent.id,
      email: parent.email,
      name: parent.name,
      emailVerified: parent.emailVerified,
    },
    accessToken,
    refreshToken,
  };
}

// ═══════════════════════════════════════════════════
// Register (email + senha - fallback sem Google)
// ═══════════════════════════════════════════════════

export async function register(data) {
  const { email, name, phone, password } = data;

  // Verificar se email já existe
  const existing = await parentRepository.findByEmail(email);
  if (existing) {
    throw new Error('Email already registered');
  }

  // Validar password
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Criar pai com passwordHash
  const parent = await parentRepository.create({
    email,
    name,
    phone,
    emailVerified: false,
    passwordHash,
  });

  // Gerar tokens
  const accessToken = generateAccessToken(parent);
  const refreshToken = generateRefreshToken(parent);

  // Salvar sessão
  await sessionRepository.create({
    userId: parent.id,
    userType: 'parent',
    token: accessToken,
    refreshToken,
    expiresAt: getExpiresAt(JWT_REFRESH_EXPIRES),
  });

  // TODO: Enviar email de confirmação

  return {
    parent: {
      id: parent.id,
      email: parent.email,
      name: parent.name,
      emailVerified: false,
    },
    accessToken,
    refreshToken,
  };
}

// ═══════════════════════════════════════════════════
// Login (email + senha)
// ═══════════════════════════════════════════════════

export async function login(email, password) {
  // Buscar pai
  const parent = await parentRepository.findByEmail(email);
  if (!parent) {
    throw new Error('Invalid email or password');
  }

  // Se tem passwordHash (cadastro manual)
  if (parent.passwordHash) {
    const valid = await bcrypt.compare(password, parent.passwordHash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }
  } else {
    // Cadastro via Google - não tem password local
    throw new Error('This account uses Google Sign-In. Please login with Google.');
  }

  // Gerar tokens
  const accessToken = generateAccessToken(parent);
  const refreshToken = generateRefreshToken(parent);

  // Salvar sessão
  await sessionRepository.create({
    userId: parent.id,
    userType: 'parent',
    token: accessToken,
    refreshToken,
    expiresAt: getExpiresAt(JWT_REFRESH_EXPIRES),
  });

  return {
    parent: {
      id: parent.id,
      email: parent.email,
      name: parent.name,
      emailVerified: parent.emailVerified,
    },
    accessToken,
    refreshToken,
  };
}

// ═══════════════════════════════════════════════════
// Refresh Token
// ═══════════════════════════════════════════════════

export async function refresh(refreshToken) {
  try {
    // Verificar token
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    if (payload.type !== 'parent_refresh') {
      throw new Error('Invalid token type');
    }

    // Verificar se sessão existe e não foi revogada
    const session = await sessionRepository.findByRefreshToken(refreshToken);
    if (!session || session.revokedAt) {
      throw new Error('Session revoked');
    }

    // Buscar pai
    const parent = await parentRepository.findById(payload.sub);
    if (!parent) {
      throw new Error('Parent not found');
    }

    // Revogar sessão antiga
    await sessionRepository.revoke(session.token);

    // Gerar novos tokens
    const newAccessToken = generateAccessToken(parent);
    const newRefreshToken = generateRefreshToken(parent);

    // Criar nova sessão
    await sessionRepository.create({
      userId: parent.id,
      userType: 'parent',
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: getExpiresAt(JWT_REFRESH_EXPIRES),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

// ═══════════════════════════════════════════════════
// Logout
// ═══════════════════════════════════════════════════

export async function logout(token) {
  await sessionRepository.revoke(token);
  return { success: true };
}

// ═══════════════════════════════════════════════════
// Middleware de Autenticação
// ═══════════════════════════════════════════════════

/**
 * Middleware Express para verificar JWT de parent
 */
export function authenticateParent(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    if (payload.type !== 'parent') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    req.parentId = payload.sub;
    req.parentEmail = payload.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
