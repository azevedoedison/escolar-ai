// Helpers de teste: cria famílias e filhos fictícios via API e grava conversas direto no banco de teste.
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const prisma = new PrismaClient();
// senhas aleatórias por execução: nenhuma credencial fixa no repositório
const secret = () => randomBytes(12).toString('hex') + 'Aa1!';

export async function registerParent(request, tag) {
  const PASSWORD = secret();
  const email = `pai-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@teste.dev`;
  const res = await request.post(`${BASE_URL}/api/auth/parent/register`, {
    data: { email, name: `Responsável ${tag}`, password: PASSWORD },
  });
  const body = await res.json();
  return { email, password: PASSWORD, token: body.accessToken, id: body.parent.id };
}

export async function createChild(request, parent, tag) {
  const nickname = `crianca${tag}${Math.random().toString(36).slice(2, 6)}`;
  const password = secret();
  const res = await request.post(`${BASE_URL}/api/parent/children`, {
    headers: { authorization: `Bearer ${parent.token}` },
    data: { name: `Criança ${tag}`, nickname, password, age: 11 },
  });
  const body = await res.json();
  return { id: body.child.id, nickname, password };
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
