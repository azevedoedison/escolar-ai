/**
 * Cliente Prisma compartilhado (um por processo).
 */
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
