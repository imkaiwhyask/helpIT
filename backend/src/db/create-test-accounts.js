require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { prisma } = require('./index');

async function run() {
  const accounts = [
    {
      name:                 'Admin User',
      email:                'admin@helpit.local',
      password_hash:        bcrypt.hashSync('Admin@1234', 12),
      role:                 'admin',
      department:           'IT Management',
      must_change_password: false,
    },
    {
      name:                 'Test User',
      email:                'user@helpit.local',
      password_hash:        bcrypt.hashSync('User@1234', 12),
      role:                 'user',
      department:           'General',
      must_change_password: false,
    },
  ];

  for (const acc of accounts) {
    await prisma.user.upsert({
      where:  { email: acc.email },
      update: { password_hash: acc.password_hash, role: acc.role, must_change_password: acc.must_change_password, is_active: true, failed_login_count: 0, locked_until: null },
      create: acc,
    });
    console.log(`✓ ${acc.role.padEnd(5)} ${acc.email}`);
  }

  console.log('\nTest accounts ready:');
  console.log('  Admin : admin@helpit.local / Admin@1234');
  console.log('  User  : user@helpit.local  / User@1234');

  await prisma.$disconnect();
}

run().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
