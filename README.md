# BlockReceipt Project

Project ini terdiri dari dua bagian utama:
1.  **Backend (`/web3-receipt-backend`)**: Dibuat dengan Node.js, Express, dan Prisma.
2.  **Frontend (`/web3-rico`)**: Dibuat dengan React (Vite).

Untuk menjalankan proyek ini secara lokal, Anda perlu menjalankan kedua bagian tersebut di terminal yang terpisah.

---

## 1. Menjalankan Backend

Backend menangani semua logika bisnis, interaksi database, dan koneksi ke API eksternal.

### Langkah-langkah:

1.  **Buka Terminal** dan masuk ke direktori backend:
    ```bash
    cd web3-receipt-backend
    ```

2.  **Buat File `.env`**:
    Buat file bernama `.env` di dalam direktori `web3-receipt-backend` dan isi dengan variabel berikut. Ganti nilainya dengan milik Anda.
    ```env
    # URL koneksi langsung ke database PostgreSQL Anda
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

    # API Key untuk layanan Pinata (jika digunakan)
    PINATA_API_KEY="YOUR_PINATA_API_KEY"

    # API Key untuk Google AI / Gemini (jika digunakan dari backend)
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Sinkronisasi Database**:
    Perintah ini akan menjalankan migrasi database Anda.
    ```bash
    npx dotenv -- npx prisma migrate dev
    ```

5.  **Jalankan Server Backend**:
    ```bash
    npm run dev
    ```
    Server backend sekarang akan berjalan di `http://localhost:4000`. Biarkan terminal ini tetap terbuka.

---

## 2. Menjalankan Frontend

Frontend adalah antarmuka pengguna (UI) yang Anda lihat di browser.

### Langkah-langkah:

1.  **Buka Terminal BARU** (biarkan terminal backend tetap berjalan) dan masuk ke direktori frontend:
    ```bash
    cd web3-rico
    ```

2.  **Buat File `.env`**:
    Buat file bernama `.env` di dalam direktori `web3-rico` dan isi dengan variabel berikut:
    ```env
    # Arahkan ke alamat backend lokal Anda
    VITE_API_BASE_URL="http://localhost:4000/api"

    # API Key untuk fitur scan AI Gemini di sisi klien
    VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Jalankan Server Frontend**:
    ```bash
    npm run dev
    ```
    Terminal akan memberikan URL untuk frontend, biasanya `http://localhost:5173`. Buka alamat ini di browser Anda.

---

Selesai! Sekarang frontend dan backend Anda sudah berjalan secara lokal dan terhubung satu sama lain.
