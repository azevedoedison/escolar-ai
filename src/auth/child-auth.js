/**
 * Child Authentication
 * Login com nickname + senha + rate limiting
 */

import jwt from 'jsonwebtoken';
import { childRepository } from '../db/repositories/child.js';
import { sessionRepository } from '../db/repositories/session.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const CHILD_SESSION_HOURS = parseInt(process.env.CHILD_SESSION_HOURS || '2');

// ═══════════════════════════════════════════════════
// Rate Limiting (em memória)
// ═══════════════════════════════════════════════════

const loginAttempts = new Map(); // key: IP → { count, resetAt }

const RATE_LIMIT_MAX = 5;      // 5 tentativas
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutos

function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  record.count++;

  if (record.count > RATE_LIMIT_MAX) {
    return { 
      allowed: false, 
      remaining: 0,
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

function resetRateLimit(ip) {
  loginAttempts.delete(ip);
}

// Limpar rate limits expirados a cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts) {
    if (now > record.resetAt) {
      loginAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

// ═══════════════════════════════════════════════════
// Token Generation
// ═══════════════════════════════════════════════════

function generateAccessToken(child) {
  return jwt.sign(
    {
      sub: child.id,
      type: 'child',
      parentId: child.parentId,
      nickname: child.nickname,
    },
    JWT_SECRET,
    { expiresIn: `${CHILD_SESSION_HOURS}h` }
  );
}

function generateRefreshToken(child) {
  return jwt.sign(
    {
      sub: child.id,
      type: 'child_refresh',
      jti: crypto.randomUUID(),
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

function getSessionExpiresAt() {
  return new Date(Date.now() + CHILD_SESSION_HOURS * 60 * 60 * 1000);
}

// ═══════════════════════════════════════════════════
// Login
// ═══════════════════════════════════════════════════

export async function childLogin(nickname, password, clientIp) {
  // Rate limit check
  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    throw Object.assign(
      new Error(`Too many login attempts. Try again in ${rateCheck.retryAfter}s`),
      { statusCode: 429, retryAfter: rateCheck.retryAfter }
    );
  }

  // Buscar filho
  const { valid, child } = await childRepository.verifyPassword(nickname, password);

  if (!valid || !child) {
    throw Object.assign(
      new Error('Invalid nickname or password'),
      { statusCode: 401 }
    );
  }

  // Verificar se conta está ativa
  if (!child.active) {
    throw Object.assign(
      new Error('Account is deactivated. Ask your parent to reactivate.'),
      { statusCode: 403 }
    );
  }

  // Reset rate limit no login sucesso
  resetRateLimit(clientIp);

  // Gerar tokens
  const accessToken = generateAccessToken(child);
  const refreshToken = generateRefreshToken(child);

  // Salvar sessão
  await sessionRepository.create({
    userId: child.id,
    userType: 'child',
    token: accessToken,
    refreshToken,
    expiresAt: getSessionExpiresAt(),
  });

  return {
    child: {
      id: child.id,
      name: child.name,
      nickname: child.nickname,
      age: child.age,
    },
    accessToken,
    refreshToken,
    expiresIn: CHILD_SESSION_HOURS * 3600, // segundos
  };
}

// ═══════════════════════════════════════════════════
// Refresh Token
// ═══════════════════════════════════════════════════

export async function childRefresh(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    if (payload.type !== 'child_refresh') {
      throw new Error('Invalid token type');
    }

    // Verificar sessão
    const session = await sessionRepository.findByRefreshToken(refreshToken);
    if (!session || session.revokedAt) {
      throw new Error('Session revoked');
    }

    // Buscar filho
    const child = await childRepository.findById(payload.sub);
    if (!child) {
      throw new Error('Child not found');
    }

    if (!child.active) {
      throw new Error('Account deactivated');
    }

    // Revogar sessão antiga
    await sessionRepository.revoke(session.token);

    // Novos tokens
    const newAccessToken = generateAccessToken(child);
    const newRefreshToken = generateRefreshToken(child);

    await sessionRepository.create({
      userId: child.id,
      userType: 'child',
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: getSessionExpiresAt(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: CHILD_SESSION_HOURS * 3600,
    };
  } catch (error) {
    throw Object.assign(
      new Error('Invalid or expired refresh token'),
      { statusCode: 401 }
    );
  }
}

// ═══════════════════════════════════════════════════
// Logout
// ═══════════════════════════════════════════════════

export async function childLogout(token) {
  await sessionRepository.revoke(token);
  return { success: true };
}

// ═══════════════════════════════════════════════════
// Middleware de Autenticação (Child)
// ═══════════════════════════════════════════════════

export function authenticateChild(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.type !== 'child') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    req.childId = payload.sub;
    req.parentId = payload.parentId;
    req.childNickname = payload.nickname;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
