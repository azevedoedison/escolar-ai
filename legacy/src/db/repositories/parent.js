/**
 * Parent Repository
 * Operações de banco para Parent
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ParentRepository {
  /**
   * Buscar por ID
   */
  async findById(id) {
    return prisma.parent.findUnique({ where: { id } });
  }

  /**
   * Buscar por email
   */
  async findByEmail(email) {
    return prisma.parent.findUnique({ where: { email: email.toLowerCase() } });
  }

  /**
   * Buscar por Google ID
   */
  async findByGoogleId(googleId) {
    return prisma.parent.findUnique({ where: { googleId } });
  }

  /**
   * Criar novo pai
   */
  async create(data) {
    return prisma.parent.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        phone: data.phone,
        googleId: data.googleId,
        passwordHash: data.passwordHash,
        emailVerified: data.emailVerified || false,
      },
    });
  }

  /**
   * Atualizar pai
   */
  async update(id, data) {
    return prisma.parent.update({
      where: { id },
      data,
    });
  }

  /**
   * Marcar email como verificado
   */
  async markEmailVerified(id) {
    return prisma.parent.update({
      where: { id },
      data: { emailVerified: true },
    });
  }

  /**
   * Buscar pai com filhos
   */
  async findWithChildren(id) {
    return prisma.parent.findUnique({
      where: { id },
      include: {
        children: {
          select: {
            id: true,
            name: true,
            nickname: true,
            age: true,
            school: true,
            city: true,
            state: true,
            active: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Criar ou encontrar (Google OAuth)
   */
  async findOrCreateGoogle(data) {
    // Tentar encontrar por googleId
    if (data.googleId) {
      const existing = await this.findByGoogleId(data.googleId);
      if (existing) return existing;
    }

    // Tentar encontrar por email
    const byEmail = await this.findByEmail(data.email);
    if (byEmail) {
      // Vincular googleId ao existente
      return this.update(byEmail.id, { googleId: data.googleId });
    }

    // Criar novo
    return this.create({
      email: data.email,
      name: data.name,
      googleId: data.googleId,
      emailVerified: true, // Google já verificou
    });
  }
}

export const parentRepository = new ParentRepository();
