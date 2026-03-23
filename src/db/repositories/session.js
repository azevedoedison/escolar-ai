/**
 * Session Repository
 * Operações de banco para Session (JWT tokens)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SessionRepository {
  /**
   * Criar sessão
   */
  async create(data) {
    return prisma.session.create({
      data: {
        userId: data.userId,
        userType: data.userType, // "parent" ou "child"
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Buscar por token (access token)
   */
  async findByToken(token) {
    return prisma.session.findUnique({
      where: { token },
      include: {
        // Incluir dados do usuário dependendo do tipo
      },
    });
  }

  /**
   * Buscar por refresh token
   */
  async findByRefreshToken(refreshToken) {
    return prisma.session.findUnique({
      where: { refreshToken },
    });
  }

  /**
   * Revogar sessão
   */
  async revoke(token) {
    return prisma.session.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revogar todas as sessões de um usuário
   */
  async revokeAll(userId) {
    return prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Verificar se sessão é válida
   */
  async isValid(token) {
    const session = await this.findByToken(token);
    if (!session) return false;
    if (session.revokedAt) return false;
    if (new Date() > session.expiresAt) return false;
    return true;
  }

  /**
   * Limpar sessões expiradas (manutenção)
   */
  async cleanupExpired() {
    return prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }

  /**
   * Contar sessões ativas de um usuário
   */
  async countActive(userId) {
    return prisma.session.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }
}

export const sessionRepository = new SessionRepository();
