import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Delete user accounts based on CSV file
 * 
 * Usage: npx ts-node delete-accounts.ts [csv-file-path]
 * 
 * CSV format:
 * username,password
 * karyawan01,password123
 * karyawan02,password456
 */

async function main() {
    const prisma = new PrismaClient();
    
    try {
        // Get CSV file path from command line argument
        const csvFilePath = process.argv[2] || './accounts_import.csv';
        
        if (!fs.existsSync(csvFilePath)) {
            console.error(`❌ File not found: ${csvFilePath}`);
            process.exit(1);
        }

        // Read and parse CSV
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        
        if (lines.length <= 1) {
            console.error('❌ CSV file is empty or has no data rows');
            process.exit(1);
        }

        // Skip header
        const accountsToDelete = lines.slice(1).map(line => {
            const [username] = line.split(',');
            return username.trim();
        }).filter(Boolean);

        console.log(`📋 Found ${accountsToDelete.length} accounts to delete`);
        console.log('Accounts:', accountsToDelete);
        console.log('');

        // Confirm deletion
        if (accountsToDelete.length === 0) {
            console.log('No accounts to delete.');
            process.exit(0);
        }

        // Find users to delete
        const usersToDelete = await prisma.user.findMany({
            where: {
                OR: accountsToDelete.map(username => ({
                    email: username,
                })),
            },
            select: { id: true, name: true, email: true },
        });

        if (usersToDelete.length === 0) {
            console.log('⚠️  No users found matching the CSV accounts');
            process.exit(0);
        }

        console.log(`🗑️  Found ${usersToDelete.length} users to delete:`);
        usersToDelete.forEach(user => {
            console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
        });
        console.log('');

        // Delete users
        const result = await prisma.user.deleteMany({
            where: {
                id: { in: usersToDelete.map(u => u.id) },
            },
        });

        console.log(`✅ Successfully deleted ${result.count} user(s)`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
