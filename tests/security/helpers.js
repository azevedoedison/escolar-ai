// Helpers de teste: cria famílias e filhos fictícios via API e grava conversas direto no banco de teste.
import { PrismaClient } from '@prisma/client';

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const prisma = new PrismaClient();
const PASSWORD = 'Senha@12345';

export async function registerParent(request, tag) {
  const email = `pai-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@teste.dev`;
  const res = await request.post(`${BASE_URL}/api/auth/parent/register`, {
    data: { email, name: `Responsável ${tag}`, password: PASSWORD },
  });
  const body = await res.json();
  return { email, password: PASSWORD, token: body.accessToken, id: body.parent.id };
}

export async function createChild(request, parent, tag) {
  const nickname = `crianca${tag}${Math.random().toString(36).slice(2, 6)}`;
  const res = await request.post(`${BASE_URL}/api/parent/children`, {
    headers: { authorization: `Bearer ${parent.token}` },
    data: { name: `Criança ${tag}`, nickname, password: 'Crianca@123', age: 11 },
  });
  const body = await res.json();
  return { id: body.child.id, nickname, password: 'Crianca@123' };
}

export async function seedConversation(childId, { input, output = 'ok', createdAt = new Date() }) {
  return prisma.conversation.create({
    data: { childId, input, output, status: 'approved', createdAt },
  });
}

export async function loginParentUI(page, parent) {
  await page.goto(BASE_URL);
  await page.fill('#parentEmail', parent.email);
  await page.fill('#parentPassword', parent.password);
  await page.click('#parentLoginBtn');
}
