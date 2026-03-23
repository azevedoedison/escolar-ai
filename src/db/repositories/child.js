/**
 * Child Repository
 * Operações de banco para Child (filho/criança)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

export class ChildRepository {
  /**
   * Buscar por ID
   */
  async findById(id) {
    return prisma.child.findUnique({ where: { id } });
  }

  /**
   * Buscar por nickname (para login)
   */
  async findByNickname(nickname) {
    return prisma.child.findUnique({ where: { nickname: nickname.toLowerCase() } });
  }

  /**
   * Buscar filhos de um pai
   */
  async findByParentId(parentId) {
    return prisma.child.findMany({
      where: { parentId },
      select: {
        id: true,
        name: true,
        nickname: true,
        age: true,
        grade: true,
        school: true,
        city: true,
        state: true,
        active: true,
        email: true,
        createdAt: true,
        _count: {
          select: { conversations: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Criar filho com senha hasheada
   */
  async create(data) {
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    return prisma.child.create({
      data: {
        parentId: data.parentId,
        name: data.name,
        nickname: data.nickname.toLowerCase(),
        passwordHash,
        email: data.email?.toLowerCase(),
        age: data.age,
        grade: data.grade,
        school: data.school,
        city: data.city,
        state: data.state,
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        age: true,
        active: true,
        createdAt: true,
      },
    });
  }

  /**
   * Atualizar filho
   */
  async update(id, data) {
    return prisma.child.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        nickname: true,
        age: true,
        grade: true,
        school: true,
        city: true,
        state: true,
        active: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Verificar senha
   */
  async verifyPassword(nickname, password) {
    const child = await this.findByNickname(nickname);
    if (!child) return { valid: false, child: null };

    const valid = await bcrypt.compare(password, child.passwordHash);
    return { valid, child };
  }

  /**
   * Redefinir senha
   */
  async resetPassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    return prisma.child.update({
      where: { id },
      data: { passwordHash },
    });
  }

  /**
   * Ativar/Desativar filho
   */
  async toggleActive(id) {
    const child = await prisma.child.findUnique({ where: { id }, select: { active: true } });
    return prisma.child.update({
      where: { id },
      data: { active: !child.active },
    });
  }

  /**
   * Soft delete (desativar)
   */
  async deactivate(id) {
    return prisma.child.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * Verificar se nickname existe
   */
  async nicknameExists(nickname) {
    const count = await prisma.child.count({ where: { nickname: nickname.toLowerCase() } });
    return count > 0;
  }

  /**
   * Validar idade (6-14)
   */
  validateAge(age) {
    return age >= 6 && age <= 14;
  }

  /**
   * Buscar com estatísticas (para dashboard do pai)
   */
  async findWithStats(id) {
    const child = await prisma.child.findUnique({
      where: { id },
      include: {
        _count: {
          select: { conversations: true },
        },
        conversations: {
          select: {
            status: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!child) return null;

    const totalQuestions = child.conversations.length;
    const blocked = child.conversations.filter(c => c.status === 'blocked').length;

    return {
      ...child,
      stats: {
        totalQuestions,
        blocked,
        blockedRate: totalQuestions > 0 ? ((blocked / totalQuestions) * 100).toFixed(1) : '0',
      },
      conversations: undefined, // remover dados brutos
    };
  }
}

export const childRepository = new ChildRepository();
