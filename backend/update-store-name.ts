import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating store name from PosPro to BPS - CV BERKAH PRATAMA SEJAHTERA...');
  
  const updated = await prisma.storeSettings.updateMany({
    where: {
      storeName: 'PosPro',
    },
    data: {
      storeName: 'BPS - CV BERKAH PRATAMA SEJAHTERA',
    },
  });

  console.log(`Updated ${updated.count} record(s)`);
  
  const settings = await prisma.storeSettings.findFirst();
  console.log('Current settings:', settings?.storeName);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
