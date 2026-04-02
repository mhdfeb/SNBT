# Deployment Guide (Vercel + Custom Domain)

## 1) Hosting yang dipilih
Project ini berbasis **Vite + React SPA**, jadi opsi paling cepat adalah **Vercel** dengan output statis `dist/`.

## 2) Hubungkan repository & set build
1. Login ke Vercel → **Add New Project**.
2. Import repository ini.
3. Pastikan build setting:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
4. Deploy pertama.

> Konfigurasi ini juga sudah disiapkan di `vercel.json`.

## 3) Domain & DNS
1. Beli/siapkan domain (Cloudflare, Namecheap, GoDaddy, dll).
2. Di Vercel Project → **Settings → Domains** → tambahkan domain utama, contoh `snbtku.id`.
3. Arahkan DNS sesuai instruksi Vercel:
   - `A` record root (`@`) ke `76.76.21.21`
   - `CNAME` untuk `www` ke `cname.vercel-dns.com`
4. Tunggu propagasi DNS (umumnya 5–30 menit, bisa sampai 24 jam).

## 4) SSL/TLS HTTPS
Setelah domain tervalidasi, Vercel akan mengaktifkan sertifikat SSL/TLS otomatis. Pastikan status domain menjadi **Valid Configuration**.

## 5) Environment produksi + smoke test
Tambahkan environment variable berikut di Vercel (**Project → Settings → Environment Variables**):

- `GEMINI_API_KEY` = API key produksi
- `VITE_APP_BASE_URL` = URL final, contoh `https://snbtku.id`
- `VITE_APP_VERSION` = tag rilis, contoh `2026.04.01`
- `VITE_ANALYTICS_ID` = Google Analytics Measurement ID, contoh `G-XXXXXXX`

### Smoke test setelah deploy
- Buka homepage, cek tidak ada error di console.
- Mulai quiz (mode mini/daily), jawab beberapa soal, submit.
- Buka halaman analytics/report, pastikan skor & chart tampil.
- Reload browser dan pastikan progress tetap ada (persistence via `localStorage`).
- Jalankan hard refresh untuk memastikan SPA rewrite tetap bekerja pada route aktif.
