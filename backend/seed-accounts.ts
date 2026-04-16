import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Creating 20 Admin and 4 Owner accounts...\n');

  // Get or create roles
  let adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({ data: { name: 'admin' } });
    console.log('✅ Created "admin" role');
  }

  let ownerRole = await prisma.role.findUnique({ where: { name: 'owner' } });
  if (!ownerRole) {
    ownerRole = await prisma.role.create({ data: { name: 'owner' } });
    console.log('✅ Created "owner" role\n');
  }

  // Admin Users (20)
  const adminUsers = [];
  console.log('📋 ADMIN ACCOUNTS (20):');
  console.log('─'.repeat(50));
  for (let i = 1; i <= 20; i++) {
    const username = `admin${i}`;
    const password = `Admin@${i < 10 ? '0' + i : i}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const email = `admin${i}@bps.local`;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      const user = existing
        ? await prisma.user.update({
            where: { email },
            data: {
              name: username,
              passwordHash,
              roleId: adminRole.id,
            },
          })
        : await prisma.user.create({
            data: {
              name: username,
              email,
              passwordHash,
              roleId: adminRole.id,
            },
          });
      adminUsers.push({ id: user.id, username, password, email });
      console.log(`${i}. Username: ${username} | Password: ${password}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`${i}. ⚠️ ${username} sudah ada`);
      } else {
        console.error(`${i}. ❌ Error: ${e.message}`);
      }
    }
  }

  console.log('\n📋 OWNER ACCOUNTS (4):');
  console.log('─'.repeat(50));
  // Owner Users (4)
  const ownerUsers = [];
  for (let i = 1; i <= 4; i++) {
    const username = `owner${i}`;
    const password = `Owner@${i}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const email = `owner${i}@bps.local`;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      const user = existing
        ? await prisma.user.update({
            where: { email },
            data: {
              name: username,
              passwordHash,
              roleId: ownerRole.id,
            },
          })
        : await prisma.user.create({
            data: {
              name: username,
              email,
              passwordHash,
              roleId: ownerRole.id,
            },
          });
      ownerUsers.push({ id: user.id, username, password, email });
      console.log(`${i}. Username: ${username} | Password: ${password}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`${i}. ⚠️ ${username} sudah ada`);
      } else {
        console.error(`${i}. ❌ Error: ${e.message}`);
      }
    }
  }

  console.log('\n✅ SELESAI!');
  console.log('───────────────────────────────────────────');
  console.log('💡 Catatan:');
  console.log('  • Email & nomor telepon bisa di-edit di halaman Profile');
  console.log('  • Username dan password di atas adalah akun yang sudah dibuat');
  console.log('  • Total: 20 Admin + 4 Owner = 24 akun');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
