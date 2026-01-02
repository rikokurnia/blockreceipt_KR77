// prisma/seed.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Mulai seeding data ke block_receipt_v2 (Clean Run)...")

 // 1. Bersihkan semua data transaksi, agreement, dan users (Wajib setelah TRUNCATE)
  await prisma.zKVerificationLog.deleteMany(); // FIX: zkVerificationLog -> zKVerificationLog
  await prisma.zKProofCategory.deleteMany(); // FIX: zkProofCategory -> zKProofCategory
  await prisma.zKProofBlockchain.deleteMany(); // FIX: zkProofBlockchain -> zKProofBlockchain
  await prisma.zKProof.deleteMany(); // FIX: zkProof -> zKProof
  
  await prisma.approvalLog.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.dailyLimit.deleteMany();
  await prisma.agreementItem.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany(); 
  
  // --- LANJUTKAN DENGAN CREATE MASTER DATA ---

  // --- 2. CREATE MASTER DATA ---

  // 2.1 Create 8 Final Categories (Sesuai list baru)
  const categoryData = [
    { name: 'IT Infrastructure', description: 'Pembelian server, software, dan perangkat keras.' },
    { name: 'Office Supplies', description: 'Alat tulis, kertas, dan perlengkapan kantor.' },
    { name: 'Travel & Accommodation', description: 'Biaya perjalanan dinas dan penginapan.' },
    { name: 'HR & Training', description: 'Biaya rekrutmen, pelatihan, dan pengembangan SDM.' },
    { name: 'Marketing & Promotion', description: 'Iklan, kampanye digital, dan acara promosi.' },
    { name: 'Consulting & Legal', description: 'Layanan konsultasi dan biaya legal.' },
    { name: 'R&D', description: 'Penelitian dan pengembangan produk.' },
    { name: 'General & Admin', description: 'Biaya umum dan operasional administrasi.' },
  ];
  
  await prisma.category.createMany({
    data: categoryData,
    skipDuplicates: true,
  });

  // Ambil data Categories yang baru dibuat untuk relasi (by name)
  const allCategories = await prisma.category.findMany();
  const catIT = allCategories.find(c => c.name === 'IT Infrastructure');
  const catOffice = allCategories.find(c => c.name === 'Office Supplies');

  // 2.2 Create Vendors 
  const vendor1 = await prisma.vendor.create({
    data: {
      name: 'PT Tech Solutions',
      email: 'sales@techsolutions.co.id',
      address: 'Jakarta Selatan'
    }
  });
  
  const vendor2 = await prisma.vendor.create({
    data: {
      name: 'CV Berkah Abadi',
      email: 'admin@berkah.com',
      address: 'Bandung'
    }
  });

  // 2.3 Create Users (Finance & CFO)
  const financeUser = await prisma.user.create({
    data: {
      wallet_address: '0xd4fb...cf3a', 
      role: 'finance_admin',
      organization_name: 'BlockReceipt Corp'
    }
  });

  const cfoUser = await prisma.user.create({
    data: {
      wallet_address: '0xcfo...1234', 
      role: 'cfo',
      organization_name: 'BlockReceipt Corp'
    }
  });

  // 2.4 Set Initial Daily Limit for IT Infrastructure (Untuk Tes)
  if (catIT) {
    await prisma.dailyLimit.create({
        data: {
            category_id: catIT.id,
            limit_amount: 123456, // Limit Testing
        }
    });
  }
  if (catOffice) {
    await prisma.dailyLimit.create({
        data: {
            category_id: catOffice.id,
            limit_amount: 5000000, // Limit default lain
        }
    });
  }

  console.log({ 
    categoriesCount: allCategories.length, 
    vendorCount: 2, 
    financeUser: financeUser.id 
  });
  console.log("✅ Seeding selesai! Database siap untuk Final Test Run.");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  });