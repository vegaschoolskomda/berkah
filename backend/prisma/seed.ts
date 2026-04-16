/**
 * Prisma Seed — Contoh Produk: Cetak HVS
 *
 * Menambahkan produk "Cetak HVS" dengan 2 varian (1 Sisi & 2 Sisi),
 * masing-masing memiliki 3 tier harga berdasarkan jumlah lembar.
 *
 * Jalankan dengan:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 * Atau tambahkan ke package.json:
 *   "prisma": { "seed": "ts-node prisma/seed.ts" }
 * Lalu jalankan: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 0. Seed role dan akun login default
  const ownerRole = await prisma.role.upsert({
    where: { name: 'owner' },
    update: {},
    create: { name: 'owner' },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'karyawan' },
    update: {},
    create: { name: 'karyawan' },
  });

  const defaultAccounts = [
    { username: 'berkah2019pratama', password: 'y74hjbsu3@!$', name: 'Bos Utama', roleId: ownerRole.id },
    { username: 'bos02', password: 'j2!Vx8#qL1m', name: 'Bos 02', roleId: ownerRole.id },
    { username: 'bos03', password: 'k7@Zn4$hP6r', name: 'Bos 03', roleId: ownerRole.id },
    { username: 'karyawan01', password: 'u5#Lp8!nR2m', name: 'Karyawan 01', roleId: employeeRole.id },
    { username: 'karyawan02', password: 't8K!m2#qP9v', name: 'Karyawan 02', roleId: employeeRole.id },
    { username: 'karyawan03', password: 'p4@Lm7$zR2x', name: 'Karyawan 03', roleId: employeeRole.id },
    { username: 'karyawan04', password: 'n9#Qw1!bT6k', name: 'Karyawan 04', roleId: employeeRole.id },
    { username: 'karyawan05', password: 'm3$Hv8@cJ5r', name: 'Karyawan 05', roleId: employeeRole.id },
    { username: 'karyawan06', password: 'r7!Xp2#dL4n', name: 'Karyawan 06', roleId: employeeRole.id },
    { username: 'karyawan07', password: 's1@Nk6$fV9q', name: 'Karyawan 07', roleId: employeeRole.id },
    { username: 'karyawan08', password: 'v5#Tb3!gM8w', name: 'Karyawan 08', roleId: employeeRole.id },
    { username: 'karyawan09', password: 'q2$Yh9@jP1t', name: 'Karyawan 09', roleId: employeeRole.id },
    { username: 'karyawan10', password: 'w8!Cf4#kR7m', name: 'Karyawan 10', roleId: employeeRole.id },
    { username: 'karyawan11', password: 'x6@Jp1$hN3z', name: 'Karyawan 11', roleId: employeeRole.id },
    { username: 'karyawan12', password: 'z4#Rm7!lK2v', name: 'Karyawan 12', roleId: employeeRole.id },
    { username: 'karyawan13', password: 'a9$Ld5@pQ8x', name: 'Karyawan 13', roleId: employeeRole.id },
    { username: 'karyawan14', password: 'b2!Gk8#rT1n', name: 'Karyawan 14', roleId: employeeRole.id },
    { username: 'karyawan15', password: 'c7@Vn3$sM6h', name: 'Karyawan 15', roleId: employeeRole.id },
    { username: 'karyawan16', password: 'd1#Wp9!tJ4q', name: 'Karyawan 16', roleId: employeeRole.id },
    { username: 'karyawan17', password: 'e5$Xr2@vL8k', name: 'Karyawan 17', roleId: employeeRole.id },
    { username: 'karyawan18', password: 'f8!Hm6#yP3w', name: 'Karyawan 18', roleId: employeeRole.id },
    { username: 'karyawan19', password: 'g3@Qt1$zN7r', name: 'Karyawan 19', roleId: employeeRole.id },
    { username: 'karyawan20', password: 'h6#Yp4!mK2v', name: 'Karyawan 20', roleId: employeeRole.id },
  ];

  for (const account of defaultAccounts) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    await prisma.user.upsert({
      where: { email: account.username },
      update: {
        name: account.name,
        roleId: account.roleId,
        passwordHash,
      },
      create: {
        name: account.name,
        email: account.username,
        passwordHash,
        roleId: account.roleId,
      },
    });
  }

  console.log(`✓ Akun default login disiapkan: ${defaultAccounts.length} akun`);

  // 1. Upsert Category: "Cetak"
  const category = await prisma.category.upsert({
    where: { name: 'Cetak' },
    update: {},
    create: { name: 'Cetak' },
  });

  // 2. Upsert Unit: "Lembar"
  const unit = await prisma.unit.upsert({
    where: { name: 'Lembar' },
    update: {},
    create: { name: 'Lembar' },
  });

  // 3. Buat Product: Cetak HVS
  //    - pricingMode: UNIT (dihitung per lembar, bukan per m²)
  //    - trackStock: false (jasa cetak, stok tidak dilacak)
  //    - pricePerUnit: harga default (dipakai jika tidak ada tier yang cocok)
  const product = await prisma.product.create({
    data: {
      name: 'Cetak HVS',
      description:
        'Layanan cetak dokumen di atas kertas HVS 70 gsm / 80 gsm. ' +
        'Tersedia cetak 1 sisi dan 2 sisi. ' +
        'Harga otomatis menyesuaikan jumlah lembar (tier harga).',
      categoryId: category.id,
      unitId: unit.id,
      pricingMode: 'UNIT',
      productType: 'SELLABLE',
      pricePerUnit: 1500, // harga fallback (tidak dipakai jika tier aktif)
      requiresProduction: false,
      trackStock: false,
    },
  });

  console.log(`✓ Produk dibuat: ${product.name} (id: ${product.id})`);

  // ──────────────────────────────────────────────
  // 4. Varian 1: Cetak HVS 1 Sisi
  // ──────────────────────────────────────────────
  const variant1Sisi = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: 'HVS-1SISI',
      variantName: '1 Sisi',
      price: 1500, // harga satuan default (dipakai saat checkout jika tier tidak aktif)
      hpp: 300,    // estimasi biaya tinta + listrik per lembar
      stock: 0,
      priceTiers: {
        create: [
          {
            // Tier 1: Eceran (1–10 lembar) — harga normal
            tierName: 'Eceran',
            minQty: 1,
            maxQty: 10,
            price: 1500,
          },
          {
            // Tier 2: Semi-grosir (11–50 lembar) — harga lebih murah
            tierName: 'Semi-Grosir',
            minQty: 11,
            maxQty: 50,
            price: 1000,
          },
          {
            // Tier 3: Grosir (>50 lembar) — harga termurah
            // maxQty: null = tidak ada batas atas
            tierName: 'Grosir',
            minQty: 51,
            maxQty: null,
            price: 750,
          },
        ],
      },
    },
    include: { priceTiers: true },
  });

  console.log(
    `✓ Varian dibuat: ${variant1Sisi.variantName} (sku: ${variant1Sisi.sku}) ` +
    `— ${variant1Sisi.priceTiers.length} tier harga`,
  );

  // ──────────────────────────────────────────────
  // 5. Varian 2: Cetak HVS 2 Sisi
  // ──────────────────────────────────────────────
  const variant2Sisi = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: 'HVS-2SISI',
      variantName: '2 Sisi',
      price: 2000, // harga satuan default
      hpp: 500,    // estimasi HPP lebih tinggi karena 2x cetak
      stock: 0,
      priceTiers: {
        create: [
          {
            tierName: 'Eceran',
            minQty: 1,
            maxQty: 10,
            price: 2000,
          },
          {
            tierName: 'Semi-Grosir',
            minQty: 11,
            maxQty: 50,
            price: 1500,
          },
          {
            tierName: 'Grosir',
            minQty: 51,
            maxQty: null,
            price: 1200,
          },
        ],
      },
    },
    include: { priceTiers: true },
  });

  console.log(
    `✓ Varian dibuat: ${variant2Sisi.variantName} (sku: ${variant2Sisi.sku}) ` +
    `— ${variant2Sisi.priceTiers.length} tier harga`,
  );

  // ──────────────────────────────────────────────
  // Ringkasan
  // ──────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────');
  console.log('Seed selesai. Ringkasan tier harga:\n');

  console.log('Cetak HVS — 1 Sisi');
  console.log('  1–10 lembar   : Rp 1.500 / lembar  (Eceran)');
  console.log('  11–50 lembar  : Rp 1.000 / lembar  (Semi-Grosir)');
  console.log('  >50 lembar    : Rp   750 / lembar  (Grosir)');

  console.log('\nCetak HVS — 2 Sisi');
  console.log('  1–10 lembar   : Rp 2.000 / lembar  (Eceran)');
  console.log('  11–50 lembar  : Rp 1.500 / lembar  (Semi-Grosir)');
  console.log('  >50 lembar    : Rp 1.200 / lembar  (Grosir)');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
