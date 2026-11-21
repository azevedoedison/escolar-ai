/**
 * Escolar AI - Database Seed
 * Insere dados iniciais (palavras bloqueadas, etc.)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════
// Palavras bloqueadas padrão
// ═══════════════════════════════════════════════════
const BLOCKED_KEYWORDS = [
  // Violência (critical)
  { keyword: 'matar', category: 'violence', severity: 'critical' },
  { keyword: 'morte', category: 'violence', severity: 'critical' },
  { keyword: 'suicídio', category: 'violence', severity: 'critical' },
  { keyword: 'suicidio', category: 'violence', severity: 'critical' },
  { keyword: 'violência', category: 'violence', severity: 'high' },
  { keyword: 'violencia', category: 'violence', severity: 'high' },
  { keyword: 'sangue', category: 'violence', severity: 'medium' },
  { keyword: 'arma de fogo', category: 'violence', severity: 'high' },
  { keyword: 'bater', category: 'violence', severity: 'medium' },
  { keyword: 'agredir', category: 'violence', severity: 'high' },
  
  // Sexual (critical)
  { keyword: 'sexo', category: 'sexual', severity: 'critical' },
  { keyword: 'sexual', category: 'sexual', severity: 'critical' },
  { keyword: 'pornografia', category: 'sexual', severity: 'critical' },
  { keyword: 'nudez', category: 'sexual', severity: 'high' },
  { keyword: 'nudes', category: 'sexual', severity: 'critical' },
  { keyword: 'conteúdo adulto', category: 'sexual', severity: 'high' },
  
  // Fora de contexto (medium)
  { keyword: 'youtuber', category: 'out_of_context', severity: 'medium' },
  { keyword: 'tiktok', category: 'out_of_context', severity: 'medium' },
  { keyword: 'videogame', category: 'out_of_context', severity: 'medium' },
  { keyword: 'filme de terror', category: 'out_of_context', severity: 'medium' },
  { keyword: 'futebol', category: 'out_of_context', severity: 'low' },
  
  // Drogas (high)
  { keyword: 'droga', category: 'drugs', severity: 'high' },
  { keyword: 'maconha', category: 'drugs', severity: 'high' },
  { keyword: 'cocaina', category: 'drugs', severity: 'critical' },
  { keyword: 'cigarro', category: 'drugs', severity: 'medium' },
];

async function seed() {
  console.log('🌱 Iniciando seed...');

  // Limpar tabelas (cuidado em produção!)
  if (process.env.NODE_ENV === 'development') {
    console.log('  🗑️ Limpando dados existentes...');
    await prisma.conversation.deleteMany();
    await prisma.session.deleteMany();
    await prisma.child.deleteMany();
    await prisma.parent.deleteMany();
    await prisma.blockedKeyword.deleteMany();
  }

  // Inserir palavras bloqueadas
  console.log(`  📝 Inserindo ${BLOCKED_KEYWORDS.length} palavras bloqueadas...`);
  for (const kw of BLOCKED_KEYWORDS) {
    await prisma.blockedKeyword.upsert({
      where: { keyword: kw.keyword },
      update: kw,
      create: kw,
    });
  }

  console.log('✅ Seed concluído!');
  console.log(`   - ${BLOCKED_KEYWORDS.length} keywords`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed falhou:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
