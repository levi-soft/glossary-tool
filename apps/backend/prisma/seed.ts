import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'demo@glossary-tool.com' },
    update: {},
    create: {
      email: 'demo@glossary-tool.com',
      username: 'demo',
      password: 'hashed-password', // TODO: Hash properly
      role: 'ADMIN',
    },
  });

  console.log('✅ Created user:', user.username);

  // Create sample projects
  const project1 = await prisma.project.upsert({
    where: { id: 'sample-project-1' },
    update: {},
    create: {
      id: 'sample-project-1',
      name: 'Visual Novel RPG',
      description: 'Dịch game visual novel từ tiếng Anh sang tiếng Việt',
      gameFormat: 'renpy',
      sourceLang: 'en',
      targetLang: 'vi',
      ownerId: user.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'sample-project-2' },
    update: {},
    create: {
      id: 'sample-project-2',
      name: 'RPG Maker Adventure',
      description: 'Game phiêu lưu RPG Maker',
      gameFormat: 'rpgmaker',
      sourceLang: 'en',
      targetLang: 'vi',
      ownerId: user.id,
    },
  });

  console.log('✅ Created projects:', project1.name, ',', project2.name);

  // Create glossary terms for project 1
  const glossaryTerms = await prisma.glossaryTerm.createMany({
    data: [
      {
        projectId: project1.id,
        sourceTerm: 'Health Potion',
        targetTerm: 'Thuốc hồi máu',
        category: 'Items',
        description: 'Vật phẩm hồi phục HP',
      },
      {
        projectId: project1.id,
        sourceTerm: 'Dragon',
        targetTerm: 'Rồng',
        category: 'Monsters',
        description: 'Boss cấp cao',
      },
      {
        projectId: project1.id,
        sourceTerm: 'Main Character',
        targetTerm: 'Nhân vật chính',
        category: 'Story',
        description: 'Protagonist của game',
      },
      {
        projectId: project1.id,
        sourceTerm: 'HP',
        targetTerm: 'Máu',
        category: 'Game Terms',
        description: 'Health Points - điểm sinh lực',
      },
      {
        projectId: project1.id,
        sourceTerm: 'Mana',
        targetTerm: 'Năng lượng phép',
        category: 'Game Terms',
        description: 'Magic points - điểm ma thuật',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created', glossaryTerms.count, 'glossary terms');

  // Create text entries for project 1
  const textEntries = await prisma.textEntry.createMany({
    data: [
      {
        projectId: project1.id,
        context: 'dialogue',
        originalText: 'Hello, brave adventurer!',
        currentTranslation: 'Xin chào, chiến binh dũng cảm!',
        status: 'APPROVED',
        lineNumber: 1,
      },
      {
        projectId: project1.id,
        context: 'menu',
        originalText: 'Start Game',
        currentTranslation: 'Bắt đầu game',
        status: 'TRANSLATED',
        lineNumber: 2,
      },
      {
        projectId: project1.id,
        context: 'item',
        originalText: 'Health Potion',
        currentTranslation: 'Thuốc hồi máu',
        status: 'APPROVED',
        lineNumber: 3,
      },
      {
        projectId: project1.id,
        context: 'dialogue',
        originalText: 'The dragon awaits in the mountain peak.',
        currentTranslation: '',
        status: 'UNTRANSLATED',
        lineNumber: 4,
        aiSuggestions: {
          text: 'Con rồng đang chờ đợi ở đỉnh núi.',
          confidence: 0.95,
        },
      },
      {
        projectId: project1.id,
        context: 'quest',
        originalText: 'Defeat 10 goblins',
        currentTranslation: 'Đánh bại 10 yêu tinh',
        status: 'IN_REVIEW',
        lineNumber: 5,
      },
      {
        projectId: project1.id,
        context: 'dialogue',
        originalText: 'Welcome to our village!',
        currentTranslation: '',
        status: 'UNTRANSLATED',
        lineNumber: 6,
      },
      {
        projectId: project1.id,
        context: 'item',
        originalText: 'Mana Potion',
        currentTranslation: 'Thuốc năng lượng phép',
        status: 'TRANSLATED',
        lineNumber: 7,
      },
      {
        projectId: project1.id,
        context: 'dialogue',
        originalText: 'Your HP is running low!',
        currentTranslation: 'Máu của bạn sắp hết!',
        status: 'APPROVED',
        lineNumber: 8,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created', textEntries.count, 'text entries');

  // Create some entries for project 2
  await prisma.textEntry.createMany({
    data: [
      {
        projectId: project2.id,
        context: 'dialogue',
        originalText: 'Press any key to continue',
        currentTranslation: '',
        status: 'UNTRANSLATED',
        lineNumber: 1,
      },
      {
        projectId: project2.id,
        context: 'menu',
        originalText: 'New Game',
        currentTranslation: 'Trò chơi mới',
        status: 'TRANSLATED',
        lineNumber: 2,
      },
    ],
    skipDuplicates: true,
  });

  console.log('🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('- Users:', 1);
  console.log('- Projects:', 2);
  console.log('- Glossary terms:', glossaryTerms.count);
  console.log('- Text entries:', textEntries.count + 2);
  console.log('\n🚀 You can now run: npm run dev');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });