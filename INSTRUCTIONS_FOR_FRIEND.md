# Instruksi Update Proyek BlockReceipt

Hai, ini adalah ringkasan perubahan besar dan file-file penting yang perlu kamu perbarui di repositorimu agar sesuai dengan versi yang sudah diperbaiki.

## Perubahan Struktur Proyek

Struktur proyek telah dirapikan. Hanya ada **SATU** backend sekarang.

1.  **Backend yang Benar:** Semua kode backend sekarang terkonsolidasi di direktori level atas: `/web3-receipt-backend`.
2.  **Backend yang Dihapus:** Direktori backend yang ada di dalam `/web3-rico/web3-receipt-backend` telah **dihapus** untuk menghindari kebingungan.

Pastikan kamu menghapus direktori `/web3-rico/web3-receipt-backend` di proyekmu dan mengganti semua isinya dengan yang ada di `/web3-receipt-backend` dari repo ini.

## File Penting yang Berubah & Konfigurasi

Berikut adalah file-file kunci yang telah diubah dan perlu kamu perhatikan. Cukup salin-timpa (overwrite) saja file-file ini di proyekmu.

### Perubahan di Backend (`/web3-receipt-backend`)

1.  **`.env`**
    *   File ini **wajib ada** untuk development lokal.
    *   Pastikan isinya ada `DATABASE_URL`, `PINATA_API_KEY`, dan `GEMINI_API_KEY`.
    *   `DATABASE_URL` yang kita gunakan untuk lokal adalah koneksi langsung ke Supabase (port `5432`). Di Railway, variabel ini akan otomatis di-overwrite oleh Railway.

2.  **`package.json`**
    *   Script `dev` telah diubah untuk menggunakan `dotenv-cli` agar file `.env` selalu terbaca saat development. (`"dev": "npx dotenv -- npx ts-node src/server.ts"`)

3.  **`prisma.config.ts`**
    *   File ini dinonaktifkan (diubah nama menjadi `.bak`) karena menyebabkan konflik koneksi database. Sebaiknya hapus atau nonaktifkan juga di proyekmu.

### Perubahan di Frontend (`/web3-rico`)

1.  **`.env`**
    *   File ini **wajib ada** untuk development lokal frontend.
    *   Harus berisi `VITE_API_BASE_URL` yang menunjuk ke backend lokal (`http://localhost:4000/api`).
    *   Harus berisi `VITE_GEMINI_API_KEY` agar fitur scan AI Gemini berfungsi.

2.  **`/src/pages/UploadReceipt.jsx`**
    *   Logika validasi untuk "Price Match" dan "Quantity Check" telah diperbaiki.
    *   Bug "stale state" yang membuat validasi tidak real-time telah diperbaiki menggunakan `useCallback`.
    *   Bug `useCallback is not defined` telah diperbaiki.
    *   Logika untuk menonaktifkan tombol "Approve" sekarang sudah benar.

3.  **`/src/pages/VendorDashboard.jsx`**
    *   Bug `TypeError: receiptsData.filter is not a function` telah diperbaiki. Kode sekarang sudah benar dalam memproses data dari API.

## Konfigurasi Environment di Server

### Di Railway (untuk Backend)
Pastikan di pengaturan environment variables layanan backend, variabel berikut sudah diatur:
- `DATABASE_URL` (disediakan otomatis oleh addon Postgres Railway)
- `PINATA_API_KEY`
- `GEMINI_API_KEY`

### Di Vercel (untuk Frontend)
Pastikan di pengaturan environment variables proyek frontend, variabel berikut sudah diatur:
- `VITE_API_BASE_URL` (diisi dengan URL publik dari backend Railway, contoh: `https://web3-receipt-backend-production.up.railway.app/api`)
- `VITE_GEMINI_API_KEY`

Dengan mengikuti ini, seharusnya proyek temanmu akan ter-update dan berjalan dengan baik di Vercel dan Railway.
