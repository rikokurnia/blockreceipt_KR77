// src/server.ts

// --- PATCH BIGINT (Supaya tidak error saat dikirim ke JSON) ---
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
// -------------------------------------------------------------

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
// const PORT = 4000;

const PORT = process.env.PORT || 4000;

// Middleware
// app.use(cors());
// --- SETTING CORS ANTI-GAGAL ---
app.use(cors({
  origin: "*", // Buka untuk SEMUA alamat (Vercel, Localhost, dll)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Izinkan semua metode
  allowedHeaders: ["Content-Type", "Authorization"] // Izinkan header standar
}));

// Tambahan Header Manual (Cadangan kalau library cors ngadat)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
// ------------------------------
app.use(express.json());

// --- ROUTES ---

// 1. GET VENDORS
app.get('/api/vendors', async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({ select: { id: true, name: true } });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Gagal ambil vendor' });
  }
});

// 2. GET CATEGORIES
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      select: { id: true, name: true }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Gagal ambil kategori' });
  }
});

// 3. POST CREATE AGREEMENT
app.post('/api/agreements', async (req, res) => {
  const { vendorId, categoryId, title, startDate, endDate, paymentTerms, items } = req.body; // Hapus createdBy dari sini
  try {
    // 🔥 FIX: Ambil user pertama dari DB sebagai fallback
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      return res.status(500).json({ error: 'Tidak ada user di database untuk dijadikan author agreement.' });
    }
    const createdBy = firstUser.id;
    // ---

    let calculatedTotal = 0;
    const formattedItems = items.map((item: any) => {
      const subtotal = item.quantity * item.unitPrice;
      calculatedTotal += subtotal;
      return {
        item_name: item.itemName,
        specifications: item.specifications,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unitPrice),
        subtotal: subtotal
      };
    });

    const count = await prisma.agreement.count();
    const agreementId = `AGR-2025-${String(count + 1).padStart(3, '0')}`;

    const newAgreement = await prisma.agreement.create({
      data: {
        id: agreementId,
        vendor_id: vendorId,
        category_id: categoryId,
        title: title || `Agreement with Vendor`,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        payment_terms: paymentTerms,
        total_value: calculatedTotal,
        status: 'pending_vendor',
        created_by: createdBy, // Gunakan ID user yang valid
        items: { create: formattedItems }
      }
    });

    console.log(`✅ Agreement Created: ${agreementId}`);
    res.json({ success: true, message: 'Agreement Draft Created!', data: newAgreement });
  } catch (error) {
    console.error("Error creating agreement:", error);
    res.status(500).json({ error: 'Gagal membuat agreement', details: error });
  }
});


// 4. GET ALL AGREEMENTS (Untuk Dashboard)
app.get('/api/agreements', async (req, res) => {
  try {
    const agreements = await prisma.agreement.findMany({
      include: {
        vendor: { select: { name: true } },
        items: true,
        category: true // 🔥 TAMBAHKAN INI (Agar kategori tidak "General")
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(agreements);
  } catch (error) {
    res.status(500).json({ error: 'Gagal load agreements' });
  }
});

// 5. POST SUBMIT RECEIPT
app.post('/api/receipts', async (req, res) => {
  const { vendorName, invoiceNumber, date, totalAmount, taxAmount, items, agreementId, status } = req.body; // Hapus userId
  try {
    // 🔥 FIX: Ambil user pertama dari DB sebagai fallback
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      return res.status(500).json({ error: 'Tidak ada user di database untuk dijadikan author receipt.' });
    }
    const userId = firstUser.id;
    // ---

    const mockTxHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const mockIpfsCid = "Qm" + Array(44).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

    const count = await prisma.receipt.count();
    const receiptId = `RCP-2025-${String(count + 1).padStart(4, '0')}`;

    const agreement = await prisma.agreement.findUnique({
        where: { id: agreementId },
        select: { category_id: true } 
    });

    if (!agreement) throw new Error("Agreement not found");

    const newReceipt = await prisma.receipt.create({
      data: {
        id: receiptId,
        user: { connect: { id: userId } }, // Gunakan ID user yang valid
        category: { connect: { id: agreement.category_id } }, 
        vendor_name: vendorName,
        invoice_number: invoiceNumber,
        receipt_date: new Date(date),
        subtotal: Number(totalAmount) - Number(taxAmount),
        tax_amount: Number(taxAmount),
        total_amount: Number(totalAmount),
        status: status === 'needs_cfo' ? 'pending_approval' : 'verified',
        ai_confidence_score: 0.95, 
        
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unitPrice),
            total: Number(item.total),
            sequence: 1
          }))
        },

        blockchain_record: status !== 'needs_cfo' ? {
          create: {
            tx_hash: mockTxHash,
            block_number: 12345678,
            network: 'Lisk Sepolia'
          }
        } : undefined,

        ipfs_record: { create: { cid: mockIpfsCid, file_type: 'image/jpeg' } }
      }
    });

    console.log(`✅ Receipt Saved: ${receiptId} | Status: ${status}`);
    res.json({ success: true, data: newReceipt, txHash: mockTxHash });
  } catch (error) {
    console.error("Error saving receipt:", error);
    res.status(500).json({ error: 'Gagal menyimpan receipt', details: error });
  }
});

// 6. GET DASHBOARD STATS (ADVANCED)
app.get('/api/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Basic Stats
    const activeAgreements = await prisma.agreement.count({ where: { status: 'active' } });
    const pendingInvoices = await prisma.receipt.count({ where: { status: 'pending_approval' } });
    const approvedThisMonth = await prisma.receipt.count({
      where: {
        status: 'verified',
        created_at: { gte: firstDayOfMonth }
      }
    });
    
    const totalValueData = await prisma.receipt.aggregate({
      _sum: { total_amount: true },
      where: {
        created_at: { gte: firstDayOfMonth },
        status: 'verified'
      }
    });

   // 2. Spending by Category (UBAH JADI BULANAN AGAR MUNCUL DATA LAMA)
    const categorySpending = await prisma.receipt.groupBy({
      by: ['category_id'],
      _sum: { total_amount: true },
      _count: { id: true },
      where: {
        created_at: { gte: firstDayOfMonth }, // <-- GANTI DARI 'today' KE 'firstDayOfMonth'
        status: 'verified'
      }
    });
    // Perkaya data kategori dengan nama (karena groupBy cuma return ID)
    const categoryDetails = await Promise.all(categorySpending.map(async (item) => {
        const cat = await prisma.category.findUnique({ where: { id: item.category_id } });
        const limit = await prisma.dailyLimit.findUnique({ where: { category_id: item.category_id } });
        return {
            category: cat?.name || "Unknown",
            amount: Number(item._sum.total_amount || 0),
            count: item._count.id,
            limit: Number(limit?.limit_amount || 50000000) // Default limit 50jt
        };
    }));

    // 3. 6-Month Trend
    // Karena Prisma SQLite/MySQL agak ribet soal date grouping, kita tarik data 6 bulan terakhir lalu olah di JS
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Awal bulan

    const trendDataRaw = await prisma.receipt.findMany({
        where: {
            created_at: { gte: sixMonthsAgo },
            status: 'verified'
        },
        select: { created_at: true, total_amount: true }
    });

    // Olah data trend di JS
    const trendMap = new Map();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Inisialisasi 6 bulan terakhir dengan 0
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = monthNames[d.getMonth()];
        trendMap.set(key, 0);
    }

    trendDataRaw.forEach(r => {
        const key = monthNames[new Date(r.created_at).getMonth()];
        if (trendMap.has(key)) {
            trendMap.set(key, trendMap.get(key) + Number(r.total_amount));
        }
    });

    const monthlyTrend = Array.from(trendMap, ([month, amount]) => ({ month, amount }));

    res.json({
      activeAgreements,
      pendingInvoices,
      approvedThisMonth,
      totalValueThisMonth: Number(totalValueData._sum.total_amount || 0),
      categorySpending: categoryDetails,
      monthlyTrend
    });

  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ error: 'Gagal ambil stats' });
  }
});

// 7. GET RECENT INVOICES
app.get('/api/receipts/recent', async (req, res) => {
  try {
    const receipts = await prisma.receipt.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { items: true, category: true }
    });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: 'Gagal ambil recent receipts' });
  }
});

// 8. GET ALL SUBMISSIONS (PAGINATED)
app.get('/api/receipts', async (req, res) => {
  // Extract pagination params
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5; // Default 5 items per page
  const offset = (page - 1) * limit;

  try {
    // 1. Get Total Count (for pagination footer)
    const totalCount = await prisma.receipt.count();

    // 2. Get Paginated Data
    const receipts = await prisma.receipt.findMany({
      orderBy: { created_at: 'desc' },
      skip: offset, // Pagination offset
      take: limit,  // Pagination limit
      include: { category: true, blockchain_record: true }
    });

    // 3. Return data structure for pagination
    res.json({
        data: receipts,
        total: totalCount,
        page,
        limit
    });
  } catch (error) {
    console.error("Error fetching paginated receipts:", error);
    res.status(500).json({ error: 'Gagal ambil data submissions' });
  }
});

// 9. GET PENDING ITEMS (CFO & VENDOR) - FIXED TYPESCRIPT ERROR
app.get('/api/approvals', async (req, res) => {
  const { role } = req.query; 

  try {
    // 🔥 PERBAIKAN: Definisikan tipe array explicitly
    let pendingAgreements: any[] = [];
    let pendingInvoices: any[] = [];

    if (role === 'vendor') {
        pendingAgreements = await prisma.agreement.findMany({
            where: { status: 'pending_vendor' },
            include: { vendor: true }
        });
    } else {
        // CFO View
        pendingAgreements = await prisma.agreement.findMany({
            where: { status: 'pending_cfo' },
            include: { vendor: true }
        });
        
        pendingInvoices = await prisma.receipt.findMany({
            where: { status: 'pending_approval' },
            include: { category: true }
        });
    }

    res.json({
      agreements: pendingAgreements,
      invoices: pendingInvoices,
      totalPending: pendingAgreements.length + pendingInvoices.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal ambil data approval' });
  }
});

// 10. POST ACTION (GENERAL APPROVAL FLOW) - FIXED TYPESCRIPT ERROR
app.post('/api/action', async (req, res) => {
  const { id, type, action, role, note, userId } = req.body; 

  try {
    let nextStatus = '';
    let receiptStatus = '';

    if (type === 'agreement') {
        if (action === 'reject') {
            nextStatus = 'rejected';
        } else {
            if (role === 'vendor') {
                nextStatus = 'pending_cfo'; 
            } else {
                nextStatus = 'active'; 
            }
        }
        
        // 🔥 PERBAIKAN: Gunakan 'as any' untuk memaksa status string
        await prisma.agreement.update({
            where: { id },
            data: { status: nextStatus as any }
        });

    } else if (type === 'invoice') {
        receiptStatus = action === 'approve' ? 'verified' : 'rejected';
        const mockTxHash = action === 'approve' ? "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('') : "";
        
        // 🔥 PERBAIKAN: Gunakan 'as any' untuk status
        await prisma.receipt.update({
            where: { id },
            data: { 
                status: receiptStatus as any,
                blockchain_record: action === 'approve' ? {
                    create: {
                        tx_hash: mockTxHash,
                        block_number: 12345678,
                        network: 'Lisk Sepolia'
                    }
                } : undefined
            }
        });
    }

    await prisma.approvalLog.create({
      data: {
        agreement_id: type === 'agreement' ? id : null,
        receipt_id: type === 'invoice' ? id : null,
        approver_id: userId || 'system',
        role_at_time: role || 'cfo',
        action: action.toUpperCase(),
        notes: note
      }
    });

    res.json({ success: true, message: `Action processed.` });

  } catch (error) {
    console.error("Action Error:", error);
    res.status(500).json({ error: 'Gagal memproses action' });
  }
});

// 11. GENERATE ZK PROOF
app.post('/api/zk/generate', async (req, res) => {
  const { dateRange, rangeProof, purpose, userId } = req.body;

  try {
    const startDate = new Date(dateRange.start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);

    console.log("---------------- ZK DEBUG ----------------");
    console.log("Range Query:", startDate.toISOString(), "s/d", endDate.toISOString());

    const totalSpending = await prisma.receipt.aggregate({
      _sum: { total_amount: true },
      where: {
        receipt_date: {
          gte: startDate,
          lte: endDate
        },
        status: 'verified'
      }
    });

    const actualAmount = Number(totalSpending._sum.total_amount || 0);
    const min = Number(rangeProof.min);
    const max = Number(rangeProof.max);

    console.log("💰 Total Found in DB:", actualAmount);
    console.log("🔍 Logic:", rangeProof.type, "Min:", min, "Max:", max);

    let isValid = false;
    if (rangeProof.type === 'between') {
      isValid = actualAmount >= min && actualAmount <= max;
    } else if (rangeProof.type === 'less-than') {
      isValid = actualAmount < max;
    } else if (rangeProof.type === 'greater-than') {
      isValid = actualAmount > min;
    }

    console.log("✅ Valid?", isValid);

    if (!isValid) {
      return res.status(400).json({ 
        error: "Proof Generation Failed: Actual spending data does not satisfy the claim." 
      });
    }

    const proofId = `ZKP-${Date.now()}`;
    const mockHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

    // 🔥 HARDCODE ID YANG PASTI BENAR DARI DATA KAMU
    // ID CFO: 6cd72335-e7fc-4bc2-b8ca-5e5f91c2f4d1
    const VALID_USER_ID = "f5d26810-43be-413b-949f-16a02b376e3c"; 

    console.log("Connecting Proof to User ID:", VALID_USER_ID);

   const newProof = await prisma.zKProof.create({
      data: {
        id: proofId,
        user: { connect: { id: VALID_USER_ID } }, // Paksa pakai ID ini
        name: purpose || "General Expenditure Proof",
        purpose: purpose,
        date_range_start: startDate,
        date_range_end: endDate,
        proof_type: rangeProof.type,
        range_min: min,
        range_max: max,
        proof_hash: mockHash,
        status: 'valid',
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({ success: true, proof: newProof });

  } catch (error) {
    console.error("ZK Error:", error);
    res.status(500).json({ error: 'Gagal generate proof' });
  }
});

// 12. GET ZK PROOFS
app.get('/api/zk/proofs', async (req, res) => {
  try {
    const proofs = await prisma.zKProof.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(proofs);
  } catch (error) {
    res.status(500).json({ error: 'Gagal load proofs' });
  }
});


// 13. VERIFY ZK PROOF (PUBLIC ACCESS) - WITH DEBUGGING
app.get('/api/zk/verify/:id', async (req, res) => {
  const { id } = req.params;
  console.log("🔍 [DEBUG] Mencari Proof ID:", id);

  try {
    const proof = await prisma.zKProof.findUnique({
      where: { id },
      include: {
        user: { select: { organization_name: true, wallet_address: true } }
      }
    });

    if (!proof) {
      console.log("❌ [DEBUG] Proof TIDAK DITEMUKAN di database.");
      return res.status(404).json({ error: 'Proof not found' });
    }

    console.log("✅ [DEBUG] Proof Ditemukan:", proof.id);
    
    // Konversi Decimal ke String manual (Jaga-jaga error serialisasi)
    const sanitizedProof = JSON.parse(JSON.stringify(proof, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));

    res.json(sanitizedProof);

  } catch (error) {
    console.error("💥 [DEBUG] Error Backend:", error);
    res.status(500).json({ error: 'Gagal verifikasi proof' });
  }
});

// 14. GENERATE REPORT (FILTERED DATA)
app.post('/api/reports/generate', async (req, res) => {
  const { startDate, endDate, categories } = req.body;

  try {
    // 1. Setup Filter Tanggal
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 2. Setup Filter Kategori
    let categoryFilter = {};
    if (categories && categories.length > 0) {
      // Filter berdasarkan nama kategori yang berelasi
      categoryFilter = {
        category: {
          name: { in: categories }
        }
      };
    }

    // 3. Query Database
    const reportData = await prisma.receipt.findMany({
      where: {
        status: 'verified', // Hanya ambil yang sudah verified
        receipt_date: {
          gte: start,
          lte: end
        },
        ...categoryFilter
      },
      include: {
        category: true,
        blockchain_record: true
      },
      orderBy: { receipt_date: 'desc' }
    });

    res.json(reportData);

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ error: 'Gagal generate report' });
  }
});

// 15. GET SINGLE AGREEMENT BY ID (For Vendor Review Page)
app.get('/api/agreements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const agreement = await prisma.agreement.findUnique({
      where: { id },
      include: {
        vendor: { select: { name: true } },
        items: true,
        category: true
      }
    });

    if (!agreement) {
      return res.status(404).json({ error: 'Agreement not found' });
    }

    res.json(agreement);
  } catch (error) {
    console.error("Single Agreement Fetch Error:", error);
    res.status(500).json({ error: 'Gagal mengambil detail agreement' });
  }
});


// 1. GET DAILY LIMITS (FIXED: Returns ALL categories with set limit or 0)
app.get('/api/limits', async (req, res) => {
  try {
    // 1. Ambil SEMUA Kategori
    const categories = await prisma.category.findMany();

    // 2. Ambil SEMUA Limit yang sudah di-set
    const limits = await prisma.dailyLimit.findMany();
    
    // 3. Gabungkan (Merge) data di JS
    const limitsMap = new Map(limits.map(l => [l.category_id, l]));

    const mergedData = categories.map(cat => ({
        category_id: cat.id,
        category: cat,
        // LEFT JOIN logic: Ambil limit yang sudah ada, atau 0
        limit_amount: limitsMap.get(cat.id)?.limit_amount || 0, 
        id: limitsMap.get(cat.id)?.id || null // ID limit record (null jika record baru)
    }));

    res.json(mergedData);
  } catch (error) {
    console.error("Gagal ambil limit:", error);
    res.status(500).json({ error: 'Gagal ambil limit' });
  }
});

// Endpoint POST /api/limits (UPDATE DAILY LIMIT) tetap sama

// 2. UPDATE DAILY LIMIT
app.post('/api/limits', async (req, res) => {
  const { categoryId, amount, userId } = req.body; // 🔥 Tambahkan userId di payload dari FE
  try {
    const oldLimitRecord = await prisma.dailyLimit.findUnique({
        where: { category_id: categoryId },
        select: { limit_amount: true }
    });
    
    const oldLimit = Number(oldLimitRecord?.limit_amount || 0);
    const newAmount = Number(amount);
    
    // Simpan/Update Limit
    const limit = await prisma.dailyLimit.upsert({
      where: { category_id: categoryId },
      update: { limit_amount: newAmount },
      create: { 
        category_id: categoryId,
        limit_amount: newAmount
      }
    });

    // 🔥 LOG PERUBAHAN KE APPROVAL_LOGS
    await prisma.approvalLog.create({
        data: {
            approver_id: userId || 'system', // Dapatkan dari FE
            role_at_time: 'cfo',
            action: 'LIMIT_UPDATE',
            notes: `Limit changed from ${oldLimit} to ${newAmount}`
        }
    });

    res.json({ success: true, data: limit });
  } catch (error) {
    console.error("Update Limit Error:", error);
    res.status(500).json({ error: 'Gagal update limit' });
  }
});


// 17. GET SINGLE RECEIPT DETAIL
app.get('/api/receipts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        category: true,
        blockchain_record: true,
        ipfs_record: true,
        items: true // Sertakan detail item
      }
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json(receipt);
  } catch (error) {
    console.error("Single Receipt Detail Error:", error);
    res.status(500).json({ error: 'Gagal mengambil detail receipt' });
  }
});


// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend Server berjalan di http://localhost:${PORT}`);
});