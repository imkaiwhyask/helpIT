require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { prisma } = require('./index');

async function seed() {
  console.log('Clearing existing data...');

  await prisma.ticketComment.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.kbArticle.deleteMany();
  await prisma.user.deleteMany();

  await prisma.$executeRaw`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE tickets_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE ticket_comments_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE ticket_attachments_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE kb_articles_id_seq RESTART WITH 1`;

  console.log('Creating default accounts...');

  await prisma.user.createMany({
    data: [
      {
        name:          'Admin User',
        email:         'admin@helpit.local',
        password_hash: bcrypt.hashSync('admin123', 12),
        role:          'admin',
        department:    'IT Management',
        phone:         '',
      },
      {
        name:          'End User',
        email:         'user@helpit.local',
        password_hash: bcrypt.hashSync('user1234', 12),
        role:          'user',
        department:    '',
        phone:         '',
      },
    ],
  });

  console.log('✓ Seed complete');
  console.log('  Admin : admin@helpit.local / admin123');
  console.log('  User  : user@helpit.local  / user1234');

  await prisma.$disconnect();
  process.exit(0);
}

seed().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
