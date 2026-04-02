<div align="center">
  <img width="1200" height="475" alt="SNBT Platform Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SNBT Practice Arena

Aplikasi latihan SNBT berbasis React + Vite dengan question bank terstruktur, mode tryout/simulasi, dan analitik progres belajar.

## Menjalankan Lokal

**Prasyarat:** Node.js 20.11.x (disarankan konsisten di semua environment CI/CD).

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Default dev server: `http://localhost:5000`.

## Quality Checks

```bash
npm run typecheck
npm run build
```

## Environment Variables

Wajib diisi:

- `GEMINI_API_KEY`
- `VITE_APP_BASE_URL`
- `VITE_APP_VERSION`

Opsional:

- `VITE_ANALYTICS_ID`

Lihat contoh lengkap di `.env.example`.

## Deploy (Vercel)

Konfigurasi deploy ada di `vercel.json`:

- install command: `npm ci`
- build command: `npm run build` (juga tersedia alias `npm run vercel-build`)
- output directory: `dist`
- SPA rewrite ke `index.html`

Panduan detail deployment: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).


## Stabilization Baseline

- Branch stabilisasi: `stabilization/baseline-build`.
- Baseline dipatok dari commit terakhir yang lolos build internal sebelum branch ini dibuat.
- Dependency dikunci melalui `package-lock.json` dan instalasi wajib menggunakan `npm ci`.
