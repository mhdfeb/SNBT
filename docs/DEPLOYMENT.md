# Deployment Guide (Vercel + Custom Domain: `snbtnaik.id`)

## 1) Hosting yang dipilih
Project ini berbasis **Vite + React SPA**, jadi opsi paling cepat adalah **Vercel** dengan output statis `dist/`.

## 2) Hubungkan repository & set build
1. Login ke Vercel → **Add New Project**.
2. Import repository ini.
3. Pastikan build setting:
   - **Build Command**: `npm run build`
   - **Install Command**: `npm ci`
   - **Output Directory**: `dist`
4. Deploy pertama.

> Konfigurasi ini juga sudah disiapkan di `vercel.json`.

## 3) Tambahkan domain di Vercel
1. Buka **Project Settings → Domains**.
2. Tambahkan kedua domain:
   - `snbtnaik.id`
   - `www.snbtnaik.id`

## 4) Atur DNS di registrar/domain host
Tambahkan record DNS berikut:

- `A` record `@` → `76.76.21.21`
- `CNAME` `www` → `cname.vercel-dns.com`

Tunggu propagasi DNS (umumnya 5–30 menit, bisa sampai 24 jam).

## 5) SSL/TLS HTTPS
Setelah domain tervalidasi, Vercel akan mengaktifkan sertifikat SSL/TLS otomatis. Pastikan status domain menjadi **Valid Configuration**.

## 6) Environment produksi + smoke test
Tambahkan environment variable berikut di Vercel (**Project → Settings → Environment Variables**):

- `GEMINI_API_KEY` = API key produksi
- `VITE_APP_BASE_URL` = `https://snbtnaik.id`
- `VITE_APP_VERSION` = tag rilis, contoh `2026.04.02`
- `VITE_ANALYTICS_ID` = Google Analytics Measurement ID (opsional), contoh `G-XXXXXXX`

### Smoke test setelah deploy
Lakukan smoke test setelah status domain menunjukkan **Valid Configuration**:

- Buka homepage, cek tidak ada error di console.
- Jalankan quiz dari awal sampai selesai.
- Submit report dan pastikan data berhasil diproses.
- Refresh browser, pastikan progress tetap ada (persist via `localStorage`).
- Uji deep link route SPA (akses langsung URL non-root), pastikan tetap load normal.

## 7) SOP redeploy cepat (cek commit + clear build cache)
Gunakan checklist ini saat ingin memastikan deployment aktif benar-benar memakai commit terbaru:

1. Buka **Vercel → Project → Deployments**.
2. Cek deployment yang aktif (`Production`) lalu cocokkan **commit hash**-nya dengan commit terbaru di GitHub (branch produksi).
3. Dari deployment/commit terbaru, klik **Redeploy** lalu **matikan opsi build cache** (clear cache / without build cache).
4. Setelah selesai build, buka **Build Logs** dan pastikan tidak ada error **TypeScript** atau **syntax** sebelum verifikasi di domain produksi.
