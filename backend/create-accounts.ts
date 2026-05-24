import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Seed script untuk membuat akun boss dan karyawan baru
 * 
 * Usage: npx ts-node create-accounts.ts
 * 
 * Akan membuat:
 * - 3 akun boss
 * - 20 akun karyawan
 */

async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
}

async function main() {
    const prisma = new PrismaClient();

    try {
        // Get or create roles
        let bossRole = await prisma.role.findFirst({
            where: {
                name: {
                    in: ['boss', 'bos', 'owner', 'pemilik'],
                },
            },
        });

        if (!bossRole) {
            bossRole = await prisma.role.create({
                data: { name: 'boss' },
            });
            console.log('✅ Created "boss" role');
        } else {
            console.log(`✅ Using existing role: "${bossRole.name}"`);
        }

        let karyawanRole = await prisma.role.findFirst({
            where: {
                name: {
                    in: ['karyawan', 'staff', 'employee'],
                },
            },
        });

        if (!karyawanRole) {
            karyawanRole = await prisma.role.create({
                data: { name: 'karyawan' },
            });
            console.log('✅ Created "karyawan" role');
        } else {
            console.log(`✅ Using existing role: "${karyawanRole.name}"`);
        }

        // Create boss accounts
        const bosses = [
            { email: 'boss1@berkah.com', name: 'Boss 1', password: 'Boss@123456' },
            { email: 'boss2@berkah.com', name: 'Boss 2', password: 'Boss@234567' },
            { email: 'boss3@berkah.com', name: 'Boss 3', password: 'Boss@345678' },
        ];

        console.log('\n📝 Creating boss accounts...');
        for (const boss of bosses) {
            const existing = await prisma.user.findUnique({ where: { email: boss.email } });
            if (existing) {
                console.log(`  ⚠️  ${boss.email} sudah ada`);
                continue;
            }

            const passwordHash = await hashPassword(boss.password);
            await prisma.user.create({
                data: {
                    email: boss.email,
                    name: boss.name,
                    passwordHash,
                    roleId: bossRole!.id,
                },
            });
            console.log(`  ✅ ${boss.email} (password: ${boss.password})`);
        }

        // Create karyawan accounts
        const karyawanAccounts = [];
        console.log('\n📝 Creating karyawan accounts...');
        for (let i = 1; i <= 20; i++) {
            const email = `karyawan${String(i).padStart(2, '0')}@berkah.com`;
            const name = `Karyawan ${i}`;
            const password = `Karyawan@${String(i).padStart(2, '0')}`;

            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                console.log(`  ⚠️  ${email} sudah ada`);
                continue;
            }

            const passwordHash = await hashPassword(password);
            const user = await prisma.user.create({
                data: {
                    email,
                    name,
                    passwordHash,
                    roleId: karyawanRole!.id,
                },
            });
            karyawanAccounts.push({ email, password });
            console.log(`  ✅ ${email} (password: ${password})`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ AKUN BERHASIL DIBUAT!');
        console.log('='.repeat(60));

        console.log('\n👔 AKUN BOSS:');
        bosses.forEach(boss => {
            console.log(`   Email: ${boss.email}`);
            console.log(`   Password: ${boss.password}\n`);
        });

        console.log('👨‍💼 AKUN KARYAWAN:');
        karyawanAccounts.forEach(({ email, password }) => {
            console.log(`   Email: ${email} | Password: ${password}`);
        });

        console.log('\n💡 Tip: Simpan akun-akun di atas untuk login nanti');
        console.log('⚠️  Pastikan setiap user mengubah password saat first login');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
