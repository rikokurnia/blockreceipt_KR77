
````markdown
# 🧾 BlockReceipt - Hackathon Project

Project ini menggunakan arsitektur **Monorepo**:
- **Frontend:** React + Vite (Root folder)
- **Backend:** Express + Prisma (Folder `web3-receipt-backend`)

---

## 🚀 Panduan Setup (Wajib untuk Developer Baru)

Ikuti langkah-langkah ini secara berurutan agar tidak terjadi error saat koneksi database.

### 1. Persiapan Environment
Pastikan kamu sudah menginstall:
- **Node.js** (v18 atau terbaru)
- **XAMPP** (Nyalakan modul **MySQL**, Apache tidak wajib)
- **Git**

### 2. Install Dependencies
Buka terminal di **root folder** project, lalu jalankan perintah berikut:

```bash
# 1. Install Library Frontend (di root)
npm install

# 2. Install Library Backend
cd web3-receipt-backend
npm install
````

### 3\. Setup Database Local (PENTING\!)

Kita menggunakan database lokal masing-masing. Jangan khawatir, database di laptopmu tidak akan merusak database teman tim lain.

1.  Buka **phpMyAdmin** (`http://localhost/phpmyadmin`) atau terminal MySQL kamu.
2.  Buat database baru dengan nama persis: **`block_receipt_v2`**.
3.  Masuk ke folder backend:
    ```bash
    cd web3-receipt-backend
    ```
4.  Buat file `.env` (atau copy dari `.env.example` jika ada) dan isi dengan konfigurasi berikut:
    ```env
    # Sesuaikan user/password jika XAMPP kamu menggunakan password
    # Default XAMPP biasanya user: root, password: (kosong)
    DATABASE_URL="mysql://root:@localhost:3306/block_receipt_v2"
    ```

### 4\. Isi Database (Migrate & Seed)

Masih di terminal folder `web3-receipt-backend`, jalankan perintah ini untuk membuat tabel dan mengisi data dummy awal:

```bash
# 1. Push struktur tabel ke database lokalmu
npx prisma db push

# 2. Isi data dummy (Vendor, User, Category, Agreement)
npx ts-node --esm prisma/seed.ts
```

*\> Jika muncul log "✅ Seeding selesai\!", berarti database kamu sudah siap.*

-----

## ▶️ Cara Menjalankan Aplikasi

Kamu membutuhkan **2 Terminal** yang berjalan secara bersamaan agar aplikasi berfungsi normal.

### Terminal 1: Backend Server

```bash
cd web3-receipt-backend
npx ts-node --esm src/server.ts
```

*\> Tunggu sampai muncul pesan: `🚀 Backend Server berjalan di http://localhost:4000`*

### Terminal 2: Frontend React

```bash
# Pastikan berada di root folder (jangan masuk ke backend)
npm run dev
```

*\> Buka browser di `http://localhost:5173`*

-----
