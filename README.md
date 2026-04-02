<div align="center">
  <img width="1200" height="475" alt="SNBT Platform Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SNBT Practice App

Aplikasi latihan SNBT berbasis **React + Vite** dengan mode quiz, analytics/report, dan penyimpanan progress lokal.

## Overview

Platform ini dibuat untuk membantu calon mahasiswa meningkatkan peluang lolos PTN melalui:
- tryout SNBT terstruktur,
- evaluasi kelemahan per konsep,
- dan materi belajar remedial yang terarah.

## Setup

**Prasyarat minimum toolchain:** **Node.js 20+**.

1. Install dependency:
   ```bash
   npm install
   ```
2. Salin contoh environment:
   ```bash
   cp .env.example .env.local
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```
4. Buka URL lokal yang ditampilkan terminal (default: `http://localhost:5000`).

## Build

```bash
npm run build
npm run preview
```

## Deploy

Panduan publish ke Vercel + custom domain + HTTPS + smoke test tersedia di: **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**.

## Troubleshooting singkat

1. **Build gagal karena conflict merge**
   - Cek marker conflict:
     ```bash
     rg -n '^(<<<<<<<|=======|>>>>>>>)' .
     ```
   - Selesaikan semua conflict, lalu jalankan ulang:
     ```bash
     npm run build
     ```

2. **App gagal jalan karena env vars wajib belum diisi**
   - Pastikan `.env.local` sudah dibuat dari `.env.example`.
   - Isi minimal variabel wajib berikut:
     - `GEMINI_API_KEY`
     - `VITE_APP_BASE_URL`
     - `VITE_APP_VERSION`

## Owner / Contact

Aplikasi ini dikelola sebagai **platform pribadi**.

- **Owner:** Pemilik Pribadi
- **Kontak:** isi email/WA bisnis
