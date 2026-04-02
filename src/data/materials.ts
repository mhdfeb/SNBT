import { StudyMaterial } from '../types/quiz';

const LEGACY_STUDY_MATERIALS: StudyMaterial[] = [
const PRIORITY_ORDER: StudyMaterial['priority'][] = ['high', 'medium', 'low'];

const getPriorityMeta = (index: number) => {
  const priority = PRIORITY_ORDER[index % PRIORITY_ORDER.length];
  if (priority === 'high') {
    return {
      priority,
      scoreImpact: 'Dampak skor tinggi: konsep ini sering muncul dan menentukan akurasi inti sub-tes.'
    };
  }
  if (priority === 'medium') {
    return {
      priority,
      scoreImpact: 'Dampak skor menengah: memperkuat konsistensi dan mengurangi salah karena jebakan umum.'
    };
  }
  return {
    priority,
    scoreImpact: 'Dampak skor pendukung: menjaga stabilitas nilai saat soal variasi muncul.'
  };
};

const BASE_STUDY_MATERIALS: Omit<StudyMaterial, 'studyBlocks' | 'priority' | 'scoreImpact' | 'quick30sSummary' | 'revisionNotes'>[] = [
  // ─── TPS ─────────────────────────────────────────────────────
  {
    id: 'tps-1',
    concept: 'Penalaran Induktif',
    category: 'TPS',
    title: 'Penalaran Induktif: Pola, Analogi & Figural',
    fullContent: `
# Penalaran Induktif — Memahami Pola dan Generalisasi

Penalaran induktif adalah kemampuan menarik kesimpulan umum dari pengamatan atau fakta-fakta khusus. Di SNBT 2026, sub-tes ini menyumbang **sekitar 10 soal** dan menguji kecepatan serta ketepatan mengenali pola.

---

## 1. Pola Bilangan dan Huruf

Aturan pola bisa berupa:
| Jenis Pola | Contoh | Aturan |
|---|---|---|
| Aritmatika | 2, 5, 8, 11, … | +3 setiap langkah |
| Geometri | 3, 6, 12, 24, … | ×2 setiap langkah |
| Kuadrat | 1, 4, 9, 16, … | n² |
| Bertingkat | 1, 2, 4, 7, 11, … | +1, +2, +3, +4 |
| Bolak-balik | 1, 5, 2, 6, 3, 7, … | Dua deret bergantian |

### Tips Cepat:
- Selalu hitung **selisih dua suku berturutan** terlebih dahulu.
- Jika selisihnya tidak konstan, hitung **selisih dari selisih** (pola bertingkat kedua).
- Untuk pola huruf, konversi ke angka (A=1, B=2, …, Z=26).

---

## 2. Analogi Kata (Hubungan Kata)

Temukan **hubungan paling spesifik** antara dua kata, lalu terapkan pada pilihan jawaban.

**Jenis hubungan yang sering muncul:**
- **Sebab–Akibat**: Api → Asap
- **Bagian–Keseluruhan**: Daun → Pohon
- **Alat–Fungsi**: Pena → Menulis
- **Objek–Tempat**: Ikan → Laut
- **Pelaku–Pekerjaan**: Dokter → Mengobati
- **Sinonim/Antonim**: Besar ↔ Kecil
- **Umum–Khusus**: Buah → Mangga

### Langkah Sistematis:
1. Nyatakan hubungan dalam kalimat: *"A adalah [hubungan] dari B"*
2. Uji kalimat tersebut pada setiap pilihan jawaban.
3. Pilih yang hubungannya **paling identik** (bukan hanya mirip).

---

## 3. Penalaran Figural (Pola Gambar)

Aspek yang biasa berubah antar gambar:
- **Rotasi** (90°, 180°, 270°, cermin)
- **Jumlah elemen** (bertambah atau berkurang)
- **Warna/arsir** (hitam↔putih, gradasi)
- **Posisi** (bergerak searah/berlawanan jarum jam)
- **Ukuran** (membesar atau mengecil)

### Strategi 30 Detik:
1. Identifikasi satu aspek per langkah, jangan sekaligus.
2. Cek pola di baris *dan* kolom (untuk matriks 3×3).
3. Gunakan eliminasi: buang pilihan yang jelas salah di satu aspek.

---

## 4. Ringkasan Kunci SNBT 2026

> **Target skor**: Selesaikan 10 soal Penalaran Induktif dalam ≤ 8 menit untuk waktu tersisa bisa digunakan di soal sulit.

- Latih pola campuran (bilangan + huruf bergantian).
- SNBT 2026 diprediksi memperbanyak **pola gambar 3D** dan **pola non-linier**.
- Jangan terpaku di satu soal > 1,5 menit — tandai dan lanjutkan.
    `,
    summary: 'Penalaran induktif menguji kemampuan mengenali pola bilangan, analogi kata, dan pola figural. Gunakan strategi identifikasi sistematis dan hindari terpaku di satu soal terlalu lama.',
    sources: [
      { name: 'Kemendikbudristek — Simulasi SNBT', url: 'https://simulasi-tes.bppp.kemdikbud.go.id/' },
      { name: 'SNPMB — Kisi-kisi Resmi 2026', url: 'https://snpmb.bppp.kemdikbud.go.id/' }
    ]
  },
  {
    id: 'tps-2',
    concept: 'Penalaran Deduktif',
    category: 'TPS',
    title: 'Penalaran Deduktif: Logika Formal & Silogisme',
    fullContent: `
# Penalaran Deduktif — Menarik Kesimpulan yang Pasti

Berbeda dengan induktif, penalaran deduktif menarik kesimpulan yang **pasti benar** selama premis-premisnya benar. SNBT 2026 menguji ini melalui soal silogisme, implikasi logis, dan analisis argumen.

---

## 1. Struktur Dasar Logika

### A. Silogisme Kategoris
Tiga bentuk pernyataan + kesimpulan:
\`\`\`
Semua A adalah B.        (Premis Mayor)
C adalah A.              (Premis Minor)
∴ C adalah B.            (Kesimpulan — PASTI BENAR)
\`\`\`

**Variasi pernyataan:**
| Simbol | Arti | Contoh |
|---|---|---|
| Semua A → B | Universal Positif | Semua mahasiswa belajar |
| Tidak ada A → B | Universal Negatif | Tidak ada burung berekor tikus |
| Sebagian A → B | Parsial Positif | Sebagian buah itu manis |
| Sebagian A ≠ B | Parsial Negatif | Sebagian ikan tidak bersisik |

---

### B. Logika Implikasi (Jika–Maka)

| Aturan | Bentuk | Validitas |
|---|---|---|
| **Modus Ponens** | P→Q, P terjadi → Q terjadi | ✅ VALID |
| **Modus Tollens** | P→Q, Q tidak → P tidak | ✅ VALID |
| **Affirming Consequent** | P→Q, Q terjadi → P terjadi | ❌ TIDAK VALID |
| **Denying Antecedent** | P→Q, P tidak → Q tidak | ❌ TIDAK VALID |

> **Hafalan penting**: Hanya dua yang valid — Ponens (ikuti arah) dan Tollens (tolak balik).

---

### C. Diagram Venn untuk Silogisme

Cara terbaik memvalidasi kesimpulan silogisme:
1. Gambar lingkaran untuk setiap himpunan.
2. Tandai hubungan dari premis (dalam, luar, atau beririsan).
3. Baca kesimpulan: apakah *pasti* atau hanya *mungkin* benar?

**Contoh**:
- "Semua A⊂B, C⊂A → C⊂B" ✅
- "Sebagian A=B, C⊂A → C mungkin B" (tidak pasti)

---

## 2. Jenis Soal Khas SNBT

### Soal Analisis Argumen
Diberikan paragraf argumen, diminta menilai apakah kesimpulan **kuat/lemah** atau **valid/tidak valid**.

**Langkah:**
1. Identifikasi *klaim* (kesimpulan penulis).
2. Identifikasi *premis/bukti* yang mendukung.
3. Cek apakah ada *logical gap* (lompatan logika yang tidak berdasar).

### Soal Isian Logika
"Jika Ani lebih tinggi dari Budi, dan Cici lebih pendek dari Ani, maka…"
→ Gambar garis tinggi badan untuk memvisualisasikan relasi.

---

## 3. Ringkasan Kunci SNBT 2026

> SNBT 2026 diprediksi menambahkan **soal evaluasi argumen** berbasis teks pendek (~3 kalimat), mirip GMAT/GRE Critical Reasoning.

- Kuasai 4 aturan implikasi — hanya 2 yang valid.
- Diagram Venn adalah alat visualisasi terbaik untuk silogisme.
- Pada soal "Mana yang TIDAK dapat disimpulkan?", cari pilihan yang hanya *mungkin* (bukan *pasti*) benar.
    `,
    summary: 'Penalaran deduktif menguji validitas silogisme dan implikasi logis. Hanya Modus Ponens dan Modus Tollens yang valid. Gunakan Diagram Venn untuk memvisualisasikan hubungan antar himpunan.',
    sources: [
      { name: 'Stanford Encyclopedia of Philosophy', url: 'https://plato.stanford.edu/entries/logic-classical/' },
      { name: 'SNPMB — Panduan Resmi', url: 'https://snpmb.bppp.kemdikbud.go.id/' }
    ]
  },
  {
    id: 'tps-3',
    concept: 'Penalaran Kuantitatif',
    category: 'TPS',
    title: 'Penalaran Kuantitatif: Perbandingan & Interpretasi Data',
    fullContent: `
# Penalaran Kuantitatif — Membaca Data & Membandingkan Kuantitas

Sub-tes ini menguji kemampuan menganalisis informasi numerik tanpa harus melakukan perhitungan rumit. Fokus utama adalah **penalaran**, bukan komputasi.

---

## 1. Perbandingan Kuantitas (Quantity Comparison)

Diberikan dua kolom (A dan B), tentukan mana yang lebih besar atau apakah keduanya sama.

**Strategi cepat:**
- **Sederhanakan**: Kurangi/bagi kedua sisi dengan nilai yang sama (positif).
- **Substitusi**: Coba nilai ekstrem (0, bilangan negatif, pecahan < 1).
- **Perkiraan**: Jika soal menggunakan aproksimasi, hitung perkiraan saja.

| Pilihan | Arti |
|---|---|
| A | Kolom A selalu lebih besar |
| B | Kolom B selalu lebih besar |
| C | Kedua kolom selalu sama |
| D | Tidak bisa ditentukan (tergantung nilai variabel) |

---

## 2. Interpretasi Grafik dan Tabel

### Jenis grafik yang diuji:
- **Grafik batang**: Bandingkan nilai kategori
- **Grafik garis**: Cari tren naik/turun, titik puncak/lembah
- **Diagram lingkaran (pie)**: Hitung proporsi dari persentase
- **Tabel data**: Baca data spesifik dan hitung selisih/rasio

### Pertanyaan khas:
- "Berapa persen kenaikan dari X ke Y?"
  → Rumus: \`(nilai_akhir - nilai_awal) / nilai_awal × 100%\`
- "Manakah kategori dengan pertumbuhan tertinggi?"
  → Hitung persentase pertumbuhan, BUKAN selisih absolut.
- "Berapa nilai rata-rata dari…?"
  → Jumlah semua nilai ÷ banyak data.

---

## 3. Soal Data Statistik Dasar

| Konsep | Definisi | Catatan |
|---|---|---|
| **Mean** | Jumlah ÷ n | Terpengaruh nilai ekstrem |
| **Median** | Nilai tengah setelah diurutkan | Tidak terpengaruh nilai ekstrem |
| **Modus** | Nilai paling sering muncul | Bisa lebih dari satu |
| **Range** | Nilai max – nilai min | Ukuran sebaran sederhana |

---

## 4. Soal Laju dan Campuran

- **Laju**: Jarak = Kecepatan × Waktu
- **Campuran**: Gunakan tabel berat × konsentrasi
- **Kerja Bersama**: Jika A selesai dalam *a* hari dan B dalam *b* hari → bersama = ab/(a+b) hari

---

## 5. Ringkasan Kunci SNBT 2026

> SNBT 2026 diprediksi memperbanyak soal **interpretasi grafik ganda** (dua grafik berbeda dalam satu soal) dan **statistika deskriptif terapan**.

- Latih membaca grafik dari laporan BPS, Bank Indonesia, atau infografis berita.
- Jangan menghitung persis jika soal bisa diselesaikan dengan estimasi.
- Pada soal perbandingan kuantitas dengan variabel, selalu coba nilai positif, nol, dan negatif.
    `,
    summary: 'Penalaran kuantitatif menguji interpretasi data dan perbandingan kuantitas—bukan kalkulasi rumit. Kuasai statistik dasar, grafik, dan teknik perbandingan cepat.',
    sources: [
      { name: 'BPS — Badan Pusat Statistik', url: 'https://www.bps.go.id/' },
      { name: 'Khan Academy — Data & Statistics', url: 'https://www.khanacademy.org/math/statistics-probability' }
    ]
  },
  {
    id: 'tps-4',
    concept: 'Pengetahuan & Pemahaman Umum',
    category: 'TPS',
    title: 'Pengetahuan & Pemahaman Umum: Kosakata & Logika Bahasa',
    fullContent: `
# Pengetahuan & Pemahaman Umum (PPU)

PPU menguji penguasaan bahasa Indonesia secara komprehensif: kosakata, ejaan, tata bahasa, dan kemampuan membaca cepat.

---

## 1. Sinonim & Antonim

### Strategi Cerdas:
1. **Gunakan konteks kalimat** — jangan cari padanan kata mentah, tapi cari kata yang bermakna sama dalam konteks tersebut.
2. **Metode eliminasi** — buang yang jelas tidak bersinonim/berantonim.
3. **Perhatikan nuansa** — "marah" dan "gusar" bersinonim, tapi "gusar" lebih halus.

### Kata-kata Penting yang Sering Muncul:
| Kata | Sinonim | Antonim |
|---|---|---|
| Proliferasi | Perkembangbiakan | Kepunahan |
| Korupsi | Penyalahgunaan | Kejujuran |
| Ambiguitas | Ketaksaan | Kejelasan |
| Konklusif | Meyakinkan | Tidak pasti |
| Disparitas | Kesenjangan | Kesetaraan |

---

## 2. Analogi Kata Lanjutan

Hubungan yang kompleks sering muncul di SNBT:
- **Gradasi**: Panas → Hangat → Suam → Dingin → Beku (urutan derajat)
- **Proses**: Biji → Bibit → Pohon (tahapan perkembangan)
- **Hierarki**: Prajurit → Sersan → Kapten (struktur pangkat)
- **Material-Produk**: Kapas → Kain → Baju

---

## 3. Pemahaman Bacaan (Reading Comprehension)

### Tipe Pertanyaan:
| Tipe | Kata Kunci | Strategi |
|---|---|---|
| **Ide Pokok** | "Topik/Tema..." | Cari kalimat utama (biasanya awal/akhir paragraf) |
| **Detail** | "Menurut teks..." | Scan kata kunci dalam teks |
| **Inferensi** | "Dapat disimpulkan..." | Cari implikasi logis dari teks |
| **Tujuan Penulis** | "Penulis bermaksud..." | Perhatikan kata-kata persuasif/informatif |
| **Makna Kata** | "Kata X berarti..." | Gunakan konteks kalimat di sekitarnya |

### Teknik Membaca Efisien:
1. **Baca pertanyaan dahulu** → tahu apa yang dicari.
2. **Skim teks** → pahami struktur dan topik.
3. **Scan jawaban** → cari bagian yang relevan.

---

## 4. Kaidah Bahasa (PUEBI)

### Penulisan Huruf Kapital:
- Nama diri, jabatan resmi, nama instansi, nama geografis.
- *Tidak* kapital untuk kata jabatan umum: "presiden pergi", bukan "Presiden pergi".

### Tanda Baca Penting:
- **Koma** sebelum konjungsi: "..., tetapi..." / "..., namun..."
- **Titik dua** sebelum rincian: "Syaratnya: ..."
- **Tanda hubung** untuk kata ulang: "anak-anak", "sayur-mayur"

### Kata Baku vs Tidak Baku:
| Tidak Baku | Baku |
|---|---|
| Analisa | Analisis |
| Praktek | Praktik |
| Ijin | Izin |
| Nopember | November |
| Apotik | Apotek |
| Syah | Sah |

---

## 5. Ringkasan Kunci SNBT 2026

> SNBT 2026 diprediksi menggunakan teks-teks dari **bidang ilmiah** (sains, ekonomi, sosial) yang lebih panjang dan padat, membutuhkan kosakata akademik yang lebih luas.

- Biasakan membaca Kompas, Tempo, dan artikel jurnal berbahasa Indonesia.
- Hafal daftar kata baku yang sering salah (KBBI Daring tersedia gratis).
- Tanda baca bukan hafalan, tapi **pemahaman fungsinya** — lebih tahan lama.
    `,
    summary: 'PPU menguji sinonim, antonim, analogi kata, pemahaman bacaan, dan kaidah bahasa. Kuasai konteks kosakata akademik dan pelajari aturan PUEBI secara fungsional.',
    sources: [
      { name: 'KBBI Daring — Kemendikbud', url: 'https://kbbi.kemdikbud.go.id/' },
      { name: 'PUEBI Daring', url: 'https://puebi.readthedocs.io/' }
    ]
  },
  {
    id: 'tps-5',
    concept: 'Pemahaman Bacaan & Menulis',
    category: 'TPS',
    title: 'Pemahaman Bacaan & Menulis: PUEBI & Kalimat Efektif',
    fullContent: `
# Pemahaman Bacaan & Menulis (PBM)

Sub-tes PBM menguji kemampuan memahami teks secara mendalam sekaligus menerapkan kaidah penulisan yang benar. Ini adalah salah satu sub-tes dengan soal terbanyak (20 soal).

---

## 1. Kalimat Efektif

Kalimat efektif memiliki ciri:
- **Kelengkapan**: Ada subjek dan predikat yang jelas.
- **Kehematan**: Tidak ada kata yang mubazir/berulang makna.
- **Kelogisan**: Ide tersusun secara masuk akal.
- **Kesatuan**: Satu kalimat menyampaikan satu gagasan utama.
- **Ketepatan**: Pilihan kata (diksi) sesuai konteks.

### Kesalahan Umum Kalimat Tidak Efektif:
| Kesalahan | Contoh Salah | Perbaikan |
|---|---|---|
| **Subjek ganda** | "Bagi mahasiswa yang rajin harus belajar" | "Mahasiswa yang rajin harus belajar" |
| **Pleonasme** | "naik ke atas" | "naik" atau "ke atas" |
| **Kontaminasi** | "disebabkan karena" | "disebabkan oleh" atau "karena" |
| **Ambigu** | "Ibu melihat anak yang menangis di jalan" | Perjelas siapa yang di jalan |

---

## 2. Koherensi dan Kohesi Paragraf

- **Kohesi**: Kepaduan *bentuk* — penggunaan konjungsi, kata ganti, dan pengulangan kata yang tepat.
- **Koherensi**: Kepaduan *makna* — setiap kalimat mendukung ide pokok paragraf.

### Konjungsi dan Fungsinya:
| Konjungsi | Fungsi |
|---|---|
| Namun, tetapi, akan tetapi | Pertentangan |
| Selain itu, di samping itu | Penambahan |
| Oleh karena itu, dengan demikian | Akibat/Kesimpulan |
| Pertama, kemudian, akhirnya | Urutan/Proses |
| Meskipun, walaupun | Konsesif (meski begitu) |

---

## 3. Jenis Teks dan Strukturnya

| Jenis Teks | Tujuan | Struktur |
|---|---|---|
| **Narasi** | Menceritakan kejadian | Orientasi → Komplikasi → Resolusi |
| **Deskripsi** | Menggambarkan objek/suasana | Identifikasi → Deskripsi Bagian |
| **Eksposisi** | Menjelaskan fakta | Tesis → Argumen → Penegasan |
| **Argumentasi** | Meyakinkan pembaca | Pendahuluan → Argumen → Kesimpulan |
| **Prosedur** | Memberi instruksi | Tujuan → Alat/Bahan → Langkah |

---

## 4. Strategi Mengerjakan Soal PBM

1. **Baca teks sekilas (3-4 detik)** — identifikasi topik dan jenis teks.
2. **Baca pertanyaan** — fokus pada kata kunci soal.
3. **Temukan jawaban di teks** — jangan mengandalkan ingatan atau pengetahuan luar.
4. **Cek kalimat sebelum & sesudah** — untuk soal kepaduan atau urutan kalimat.

### Tips Soal "Kalimat yang Tepat Disisipkan":
- Pastikan kalimat baru **tidak mengulang informasi** yang sudah ada.
- Cek keserasian kata penghubung di awal dan akhir kalimat baru.
- Kalimat baru harus mendukung **ide pokok** paragraf tersebut.

---

## 5. Ringkasan Kunci SNBT 2026

> SNBT 2026 PBM diprediksi menggunakan teks **ilmiah populer** (sains, teknologi, lingkungan) yang lebih padat dengan soal yang meminta penyusunan ulang kalimat acak dan identifikasi kalimat yang tidak padu.

- Latih mengenali kalimat tidak efektif dalam tulisan sehari-hari.
- Perbanyak membaca teks ilmiah populer untuk terbiasa dengan gaya bahasa akademik.
- Soal urutan paragraf: cari kalimat pembuka yang umum dan kalimat penutup yang menyimpulkan.
    `,
    summary: 'PBM menguji kalimat efektif, koherensi paragraf, jenis teks, dan kaidah bahasa. Kuasai ciri kalimat tidak efektif dan fungsi konjungsi untuk menjawab soal dengan cepat.',
    sources: [
      { name: 'PUEBI Daring', url: 'https://puebi.readthedocs.io/' },
      { name: 'Badan Bahasa Kemdikbud', url: 'https://badanbahasa.kemdikbud.go.id/' }
    ]
  },
  {
    id: 'tps-6',
    concept: 'Pengetahuan Kuantitatif',
    category: 'TPS',
    title: 'Pengetahuan Kuantitatif: Aljabar, Bilangan & Geometri Dasar',
    fullContent: `
# Pengetahuan Kuantitatif — Fondasi Matematika SNBT

Sub-tes Pengetahuan Kuantitatif menguji pemahaman konsep matematika dasar yang diaplikasikan dalam pemecahan masalah. Fokusnya pada **pemodelan** dan **penalaran**, bukan sekadar hitungan.

---

## 1. Sistem Bilangan

### Sifat Bilangan Penting:
- **Bilangan Prima**: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47…
- **KPK** (Kelipatan Persekutuan Terkecil): Pangkatkan faktor prima **terbesar**.
- **FPB** (Faktor Persekutuan Terbesar): Pangkatkan faktor prima **terkecil**.

### Tips Pembagian Cepat:
| Habis dibagi | Syarat |
|---|---|
| 2 | Digit terakhir genap |
| 3 | Jumlah digit habis dibagi 3 |
| 4 | Dua digit terakhir habis dibagi 4 |
| 5 | Digit terakhir 0 atau 5 |
| 9 | Jumlah digit habis dibagi 9 |

---

## 2. Aljabar & Persamaan

### Persamaan Linear Satu Variabel:
Isolasi variabel di satu sisi. Perhatikan perubahan tanda saat memindah ruas.

### Sistem Persamaan Dua Variabel:
- **Metode Substitusi**: Nyatakan satu variabel dari persamaan pertama, substitusi ke yang kedua.
- **Metode Eliminasi**: Kalikan persamaan agar koefisien satu variabel sama, lalu kurangi.

### Identitas Aljabar yang Wajib Hafal:
\`\`\`
(a + b)² = a² + 2ab + b²
(a - b)² = a² - 2ab + b²
(a + b)(a - b) = a² - b²
(a + b)³ = a³ + 3a²b + 3ab² + b³
\`\`\`

---

## 3. Eksponen & Logaritma

### Sifat Eksponen:
\`\`\`
aᵐ × aⁿ = aᵐ⁺ⁿ
aᵐ ÷ aⁿ = aᵐ⁻ⁿ
(aᵐ)ⁿ = aᵐⁿ
a⁰ = 1 (a ≠ 0)
a⁻ⁿ = 1/aⁿ
\`\`\`

### Sifat Logaritma:
\`\`\`
log(ab) = log a + log b
log(a/b) = log a - log b
log(aⁿ) = n × log a
\`\`\`

---

## 4. Geometri Dasar

| Bangun | Luas | Keliling |
|---|---|---|
| Persegi | s² | 4s |
| Persegi panjang | p × l | 2(p + l) |
| Segitiga | ½ × a × t | Jumlah sisi |
| Lingkaran | πr² | 2πr |
| Trapesium | ½(a + b) × t | Jumlah sisi |

### Volume Bangun Ruang:
| Bangun | Volume |
|---|---|
| Kubus | s³ |
| Balok | p × l × t |
| Tabung | πr²t |
| Kerucut | ⅓πr²t |
| Bola | ⁴⁄₃πr³ |

---

## 5. Ringkasan Kunci SNBT 2026

> SNBT 2026 diprediksi memperbanyak soal **pemodelan aljabar** dari narasi cerita dan soal **geometri kombinasi** (bangun gabungan yang memerlukan kreativitas penguraian).

- Hafal kuadrat 1–25 dan pangkat dua 2–10 untuk mempercepat kalkulasi.
- Gunakan teknik **substitusi nilai permisalan** untuk soal abstrak.
- Jangan lupa satuan — sering ada jebakan konversi (cm ke m, dst).
    `,
    summary: 'Pengetahuan Kuantitatif mencakup bilangan, aljabar, eksponen, dan geometri dasar. Fokus pada pemodelan masalah nyata, bukan sekadar kalkulasi teknis.',
    sources: [
      { name: 'Khan Academy — Algebra', url: 'https://www.khanacademy.org/math/algebra' },
      { name: 'Math Planet', url: 'https://www.mathplanet.com/' }
    ]
  },

  // ─── LITERASI BAHASA INDONESIA ───────────────────────────────
  {
    id: 'lit-id-1',
    concept: 'Literasi Bahasa Indonesia',
    category: 'Literasi Indonesia',
    title: 'Literasi Bahasa Indonesia: Analisis Teks Mendalam',
    fullContent: `
# Literasi Bahasa Indonesia — Membedah Teks secara Kritis

Sub-tes Literasi Bahasa Indonesia (30 soal) adalah salah satu sub-tes **terpanjang dan tersulit** di SNBT. Teks yang digunakan biasanya bersifat ilmiah-populer, opini, atau sosial-budaya dengan panjang 400–800 kata.

---

## 1. Kompetensi yang Diuji

| Kompetensi | Bobot | Deskripsi |
|---|---|---|
| Menemukan Informasi | ~20% | Fakta eksplisit dalam teks |
| Menafsirkan Teks | ~35% | Makna tersirat, inferensi |
| Mengevaluasi Teks | ~30% | Validitas argumen, relevansi bukti |
| Merefleksikan Teks | ~15% | Hubungan teks dengan konteks luar |

---

## 2. Empat Level Pemahaman Bacaan

### Level 1 — Menemukan (Locate)
Pertanyaan: *"Menurut teks, kapan/di mana/siapa…?"*
→ Jawaban **tersurat** dalam teks. Scan paragraf yang relevan.

### Level 2 — Mengintegrasikan (Integrate)
Pertanyaan: *"Apa hubungan antara paragraf 2 dan 3?"*
→ Hubungkan dua bagian teks yang berbeda.

### Level 3 — Menafsirkan (Interpret)
Pertanyaan: *"Apa yang paling mungkin dimaksud penulis ketika…?"*
→ Simpulkan dari bukti implisit dalam teks.

### Level 4 — Mengevaluasi (Evaluate)
Pertanyaan: *"Apakah argumen penulis pada paragraf terakhir kuat?"*
→ Nilai kualitas dan konsistensi argumen.

---

## 3. Mengidentifikasi Ide Pokok & Simpulan

### Letak Kalimat Utama:
| Pola Paragraf | Letak Kalimat Utama |
|---|---|
| Deduktif | Awal paragraf |
| Induktif | Akhir paragraf |
| Campuran | Awal dan akhir (diulang) |
| Ineratif | Di tengah paragraf |
| Naratif | Tersebar (temukan tema) |

### Cara Menyimpulkan:
1. Gabungkan **ide pokok** setiap paragraf.
2. Cari **pernyataan yang paling umum** yang mencakup semua ide tersebut.
3. Pastikan simpulan tidak melampaui apa yang ada dalam teks.

---

## 4. Mengevaluasi Argumen

**Argumen yang kuat** memiliki:
- Klaim yang jelas
- Bukti/data yang relevan dan dapat diverifikasi
- Logika yang konsisten (tidak ada jebakan logika/fallacy)
- Menimbang sudut pandang lain

**Kelemahan argumen yang sering dimunculkan di soal:**
- *Generalisasi berlebihan*: Menyimpulkan hal besar dari sampel kecil
- *Korelasi ≠ Kausalitas*: A terjadi bersamaan B, bukan berarti A menyebabkan B
- *Slippery slope*: "Jika X, maka pasti Y, lalu Z…"
- *Ad hominem*: Menyerang pribadi bukan argumen

---

## 5. Struktur Teks Ilmiah Populer (Paling Sering Muncul)

\`\`\`
Paragraf 1: Latar belakang / konteks
Paragraf 2-3: Fakta/data pendukung
Paragraf 4: Analisis / interpretasi penulis
Paragraf 5: Kesimpulan / rekomendasi
\`\`\`

---

## 6. Ringkasan Kunci SNBT 2026

> SNBT 2026 diprediksi menyajikan teks **multimodal** (teks + grafik/tabel dalam satu soal) dan soal yang meminta **sintesis informasi dari dua teks berbeda** tentang topik yang sama.

- Latih membaca artikel Kompas, Tempo, National Geographic Indonesia.
- Jangan pernah menjawab berdasarkan pengetahuan luar — jawab berdasarkan teks.
- Untuk soal inferensi: pilihan jawaban yang paling "aman" (paling dekat dengan teks) biasanya benar.
    `,
    summary: 'Literasi Bahasa Indonesia menguji empat level pemahaman: menemukan, mengintegrasikan, menafsirkan, dan mengevaluasi teks. Fokus pada inferensi dan evaluasi argumen untuk soal-soal sulit.',
    sources: [
      { name: 'Badan Bahasa Kemdikbud', url: 'https://badanbahasa.kemdikbud.go.id/' },
      { name: 'SNPMB — Kisi-kisi 2026', url: 'https://snpmb.bppp.kemdikbud.go.id/' }
    ]
  },
  {
    id: 'lit-id-2',
    concept: 'Literasi Teks',
    category: 'Literasi Indonesia',
    title: 'Jenis & Struktur Teks: Eksposisi, Argumentasi, Narasi',
    fullContent: `
# Jenis & Struktur Teks dalam Literasi Bahasa Indonesia

Memahami jenis teks adalah kunci untuk menjawab soal tentang tujuan penulis, struktur teks, dan evaluasi argumen dengan lebih cepat.

---

## 1. Teks Eksposisi

**Tujuan**: Menjelaskan/memaparkan informasi atau gagasan secara objektif.

**Ciri Kebahasaan**:
- Kata kerja keadaan: *adalah, merupakan, terdiri dari*
- Fakta yang dapat diverifikasi
- Bahasa baku dan formal
- Tidak memihak

**Struktur**:
1. **Tesis** — Pernyataan umum tentang topik
2. **Rangkaian Argumen** — Fakta, data, penjelasan
3. **Penegasan Ulang** — Ringkasan/kesimpulan

**Contoh Topik**: Dampak perubahan iklim, perkembangan teknologi AI, sistem pendidikan.

---

## 2. Teks Argumentasi

**Tujuan**: Meyakinkan pembaca agar menerima pandangan penulis.

**Ciri Kebahasaan**:
- Kata-kata persuasif: *seharusnya, seyogianya, sudah saatnya*
- Mengakui pandangan lain tapi menyanggahnya
- Data/statistik digunakan untuk mendukung klaim

**Struktur**:
1. **Pendahuluan** — Latar belakang + tesis/klaim
2. **Tubuh Argumen** — Alasan 1, 2, 3 + bukti
3. **Sanggahan** — Akui pandangan lain, tapi bantah
4. **Kesimpulan** — Penegasan klaim + ajakan bertindak

---

## 3. Teks Eksplanasi

**Tujuan**: Menjelaskan proses/fenomena (mengapa & bagaimana terjadi).

**Ciri Kebahasaan**:
- Konjungsi kausalitas: *karena, sehingga, akibatnya*
- Konjungsi kronologis: *pertama, kemudian, akhirnya*
- Banyak kata teknis/ilmiah

**Struktur**:
1. **Identifikasi Fenomena** — Apa yang terjadi?
2. **Rangkaian Kejadian** — Urutan sebab-akibat
3. **Interpretasi** — Makna/dampak/kesimpulan

---

## 4. Teks Narasi

**Tujuan**: Menceritakan rangkaian kejadian dalam urutan waktu.

**Struktur**:
1. **Orientasi** — Siapa, kapan, di mana
2. **Komplikasi** — Konflik/masalah
3. **Resolusi** — Penyelesaian masalah
4. **Koda** (opsional) — Pesan moral/pelajaran

---

## 5. Cara Cepat Mengidentifikasi Jenis Teks

| Pertanyaan Kunci | Jenis Teks |
|---|---|
| "Bagaimana/Mengapa X terjadi?" | Eksplanasi |
| "Apa itu X dan bagaimana cara kerjanya?" | Eksposisi |
| "Kita harus/sebaiknya melakukan X" | Argumentasi |
| "Alkisah/Suatu hari…" | Narasi |

---

## 6. Ringkasan Kunci SNBT 2026

> SNBT 2026 diprediksi menyajikan **teks hibrid** yang menggabungkan eksposisi dan argumentasi dalam satu artikel, memerlukan kemampuan mengidentifikasi mana bagian yang faktual dan mana yang opini.

- Latih membedakan **fakta vs opini** dalam paragraf yang sama.
- Soal tentang "tujuan penulis" → selalu hubungkan dengan jenis teks.
- Soal tentang "sikap penulis" → cari kata-kata evaluatif (baik/buruk/perlu/harus).
    `,
    summary: 'Pahami struktur dan ciri kebahasaan empat jenis teks utama: eksposisi, argumentasi, eksplanasi, dan narasi. Kemampuan mengidentifikasi jenis teks mempercepat analisis soal literasi.',
    sources: [
      { name: 'Pedoman Umum Ejaan Bahasa Indonesia', url: 'https://puebi.readthedocs.io/' },
      { name: 'Badan Bahasa Kemdikbud', url: 'https://badanbahasa.kemdikbud.go.id/' }
    ]
  },

  // ─── LITERASI BAHASA INGGRIS ─────────────────────────────────
  {
    id: 'lit-en-1',
    concept: 'Literasi Bahasa Inggris',
    category: 'Literasi Inggris',
    title: 'English Literacy: Academic Reading & Critical Analysis',
    fullContent: `
# English Literacy — Academic Reading for SNBT 2026

The English Literacy sub-test (20 questions) uses academic texts from science, social issues, culture, and technology. The difficulty level is comparable to IELTS Academic Reading Band 6–7.

---

## 1. Core Reading Skills

### A. Main Idea & Topic Sentence
Every paragraph has a **controlling idea**. This is usually the first (or sometimes last) sentence.
- Ask yourself: *"What ONE thing is this paragraph about?"*
- The main idea of the entire passage = what the author is arguing/explaining overall.

### B. Supporting Details
These back up the main idea with:
- **Facts & statistics** (most reliable)
- **Expert opinions** (semi-reliable)
- **Examples & anecdotes** (illustrative, not proof)
- **Comparisons & contrasts**

### C. Inference & Implicit Meaning
The author implies something without stating it directly.
- Look for language like *"suggests," "implies," "indicates," "seems to"*
- Use evidence from the text — never guess from outside knowledge.

**Example**: *"Despite decades of investment, test scores remain stubbornly flat."*
→ Inference: Investment alone has not improved education outcomes.

---

## 2. Advanced Vocabulary Strategies

### Context Clue Types:
| Type | Marker | Example |
|---|---|---|
| **Definition** | "is/means/refers to" | "Osmosis, the movement of water across membranes, occurs..." |
| **Synonym** | "or," "i.e." | "The catalyst, or trigger, for the reaction..." |
| **Antonym** | "but," "however," "unlike" | "Unlike its inert neighbor, this element is highly reactive." |
| **Example** | "such as," "for instance" | "Predators, such as lions and wolves, dominate..." |
| **Inference** | General context | Figure out from the full sentence's meaning |

---

## 3. Author's Purpose & Tone

### Author's Purpose:
| Purpose | Signals | Text Type |
|---|---|---|
| **Inform** | Neutral language, facts | Exposition |
| **Persuade** | "should," "must," opinionated | Argumentation |
| **Entertain** | Narrative style, humor | Narrative |
| **Analyze** | Critical comparison | Academic essay |

### Author's Tone:
| Tone | Key Words |
|---|---|
| **Critical** | "fails to," "ignores," "overlooks" |
| **Optimistic** | "promising," "potential," "breakthrough" |
| **Cautious** | "may," "might," "could suggest" |
| **Objective** | No emotional language, balanced |

---

## 4. SNBT English Reading Strategy (20 Questions in 15 Minutes)

1. **Read the questions first** (~60 seconds) — know what to look for.
2. **Skim the passage** (~90 seconds) — identify topic, structure, and paragraph roles.
3. **Match & scan** — answer factual questions by scanning for keywords.
4. **Inference questions** — re-read the relevant paragraph carefully.
5. **Vocabulary questions** — use context clues, not memorized definitions.
6. **Never answer from outside knowledge** — always base it on the text.

---

## 5. SNBT 2026 Predictions

> The 2026 test is predicted to feature **longer passages** (~600–800 words) with **data integration** (graph or table alongside the reading passage), requiring students to connect text information with visual data.

- Practice IELTS Academic Reading past papers (freely available online).
- Focus on **science and social issue** topics — these are SNBT's preferred domains.
- Build vocabulary from academic word lists (AWL - Academic Word List).
    `,
    summary: 'English Literacy tests academic reading at IELTS Band 6–7 level. Master inference, vocabulary in context, and author\'s purpose. Use a strategic 5-step reading approach to manage time effectively.',
    sources: [
      { name: 'British Council — LearnEnglish', url: 'https://learnenglish.britishcouncil.org/' },
      { name: 'ETS — TOEFL Reading Resources', url: 'https://www.ets.org/toefl' }
    ]
  },
  {
    id: 'lit-en-2',
    concept: 'Inference',
    category: 'Literasi Inggris',
    title: 'English: Inference, Vocabulary & Grammar for Reading',
    fullContent: `
# Inference, Vocabulary & Grammar Essentials

---

## 1. Mastering Inference Questions

Inference = Reading between the lines. The correct answer is **not stated** in the text but is **logically supported** by it.

### Common Inference Question Stems:
- "What can be inferred from paragraph 3?"
- "The author implies that…"
- "Which of the following is most likely true based on the passage?"
- "What would the author probably agree with?"

### Trap Answers to Avoid:
- **Too strong**: "always," "never," "all," "impossible" — rarely the correct inference.
- **Too specific**: Adds details NOT in the text.
- **Outside scope**: True in general but not supported by THIS text.
- **Contradicts the text**: Directly opposite to what the text says.

### The "Goldilocks" Rule:
The right inference is not too broad, not too specific — just right, directly supported by textual evidence.

---

## 2. Academic Vocabulary (High-Frequency SNBT Words)

| Word | Meaning | Example in Context |
|---|---|---|
| **Subsequently** | After that | "The policy failed; subsequently, it was revised." |
| **Conversely** | On the other hand | "Urban areas grew; conversely, rural populations fell." |
| **Albeit** | Although | "The study was small, albeit significant." |
| **Proliferate** | Spread rapidly | "Misinformation tends to proliferate on social media." |
| **Mitigate** | Reduce/lessen | "The program aims to mitigate poverty." |
| **Undermine** | Weaken | "Corruption undermines public trust." |
| **Substantiate** | Provide evidence for | "Data substantiates the claim." |
| **Inconclusive** | Not definitive | "Results were inconclusive." |
| **Inherent** | Built-in, natural | "There is an inherent risk in the approach." |
| **Discrepancy** | Difference/inconsistency | "A discrepancy exists between the two reports." |

---

## 3. Grammar Patterns That Aid Reading

### Relative Clauses:
- "The study, **which was published in 2024**, found that…"
  → The study found something. (Middle clause = extra info, removable)

### Passive Voice:
- "The policy **was introduced** in 2020."
  → Emphasizes the policy, not who introduced it.

### Hedging Language (Very Common in Academic Texts):
- **Certainty**: "demonstrates," "proves," "shows"
- **Possibility**: "may," "might," "could," "suggests"
- **Condition**: "if... then," "provided that," "assuming"

Hedging language indicates the author's **level of confidence** in a claim.

---

## 4. Sentence Structure & Meaning

### Long Sentences: How to Parse Them
1. Find the **main subject** (who or what the sentence is about).
2. Find the **main verb** (what the subject does or is).
3. Remove subordinate clauses (between commas or starting with "which/that/who").
4. What remains is the core meaning.

**Example**:
*"The results, despite initial skepticism from the scientific community, have since been confirmed by three independent studies."*
→ Core: The results have been confirmed.

---

## 5. SNBT 2026 Predictions

> Expect **paired passage questions** where two short texts present different perspectives on the same issue, requiring you to compare arguments across texts.

- Study both sides of controversial topics (climate change, AI ethics, education reform).
- Practice reading academic abstracts from open-access journals.
- Focus on hedging language — it signals what the author is unsure about (often key to inference questions).
    `,
    summary: 'Master inference with the Goldilocks Rule: not too broad, not too specific. Build academic vocabulary and understand hedging language to tackle author purpose and tone questions.',
    sources: [
      { name: 'Academic Word List — Coxhead', url: 'https://www.victoria.ac.nz/lals/resources/academicwordlist/' },
      { name: 'IELTS Reading Practice', url: 'https://www.ielts.org/usa/ielts-for-test-takers/preparation' }
    ]
  },

  // ─── PENALARAN MATEMATIKA ────────────────────────────────────
  {
    id: 'mat-pm-1',
    concept: 'Aljabar',
    category: 'Penalaran Matematika',
    title: 'Penalaran Matematika: Aljabar, Fungsi & Persamaan',
    fullContent: `
# Penalaran Matematika — Aljabar & Fungsi

Sub-tes Penalaran Matematika (20 soal) menguji kemampuan **berpikir matematis** dan pemecahan masalah kontekstual. Aljabar adalah fondasi terbesar sub-tes ini.

---

## 1. Sistem Persamaan & Pertidaksamaan

### Persamaan Kuadrat:
\`\`\`
ax² + bx + c = 0
x = (-b ± √(b² - 4ac)) / 2a    ← Rumus ABC
\`\`\`

**Sifat akar persamaan kuadrat** (jika x₁ dan x₂ adalah akarnya):
- x₁ + x₂ = -b/a
- x₁ × x₂ = c/a

**Diskriminan (D = b² - 4ac)**:
- D > 0 → Dua akar real berbeda
- D = 0 → Dua akar real sama (kembar)
- D < 0 → Tidak ada akar real

---

### Pertidaksamaan Kuadrat:
Langkah: faktorkan, cari titik nol, buat garis bilangan, tentukan daerah solusi.

---

## 2. Fungsi dan Grafiknya

### Jenis Fungsi:
| Fungsi | Bentuk Umum | Grafik |
|---|---|---|
| Linear | f(x) = mx + b | Garis lurus |
| Kuadrat | f(x) = ax² + bx + c | Parabola |
| Eksponensial | f(x) = aˣ | Kurva tumbuh/luruh |
| Logaritma | f(x) = logₐ(x) | Kurva melambat |

### Cara Membaca Grafik:
- **Titik potong sumbu x**: f(x) = 0 → solusi persamaan
- **Titik potong sumbu y**: x = 0 → f(0)
- **Titik puncak parabola**: x = -b/2a, y = f(-b/2a)

---

## 3. Barisan & Deret

### Barisan Aritmatika:
- Suku ke-n: **aₙ = a₁ + (n-1)d**
- Jumlah n suku: **Sₙ = n/2 × (a₁ + aₙ)** atau **Sₙ = n/2 × (2a₁ + (n-1)d)**

### Barisan Geometri:
- Suku ke-n: **aₙ = a₁ × rⁿ⁻¹**
- Jumlah n suku: **Sₙ = a₁(rⁿ - 1) / (r - 1)** (r ≠ 1)
- Jumlah tak hingga (|r| < 1): **S∞ = a₁ / (1 - r)**

---

## 4. Matriks Dasar (SNBT 2026)

### Operasi Matriks:
\`\`\`
Penjumlahan: elemen + elemen (ukuran harus sama)
Perkalian Skalar: k × setiap elemen

Perkalian Matriks 2×2:
[a b] × [e f] = [ae+bg  af+bh]
[c d]   [g h]   [ce+dg  cf+dh]
\`\`\`

### Determinan & Invers 2×2:
\`\`\`
det(A) = ad - bc
A⁻¹ = 1/(ad-bc) × [d  -b]
                    [-c  a]
\`\`\`

---

## 5. Ringkasan Kunci SNBT 2026

> SNBT 2026 Penalaran Matematika diprediksi meningkatkan porsi soal **fungsi terapan** (pemodelan situasi nyata menggunakan fungsi) dan **barisan/deret dalam konteks keuangan** (bunga, investasi).

- Kuasai rumus-rumus kunci dengan memahaminya, bukan sekadar hafal.
- Soal cerita: ubah narasi menjadi persamaan matematika dulu sebelum hitung.
- Cek kewajaran jawaban — hasil negatif untuk "banyak orang" pasti salah.
    `,
    summary: 'Aljabar adalah inti Penalaran Matematika SNBT. Kuasai persamaan kuadrat, fungsi dan grafiknya, barisan-deret, serta operasi matriks dasar untuk menjangkau skor optimal.',
    sources: [
      { name: 'Khan Academy — Algebra', url: 'https://www.khanacademy.org/math/algebra' },
      { name: 'Matematika SMA Kemendikbud', url: 'https://buku.kemdikbud.go.id/' }
    ]
  },
  {
    id: 'mat-pm-2',
    concept: 'Geometri',
    category: 'Penalaran Matematika',
    title: 'Geometri & Trigonometri Terapan',
    fullContent: `
# Geometri & Trigonometri — Aplikasi dalam SNBT 2026

Geometri dan trigonometri menyumbang sekitar **5–7 soal** dari 20 soal Penalaran Matematika. Fokus utama adalah aplikasi dalam konteks nyata, bukan sekadar rumus abstrak.

---

## 1. Geometri Bidang Datar

### Kesebangunan & Kekongruenan:
Dua bangun **sebangun** jika sudut-sudut bersesuaian sama dan sisi-sisi bersesuaian proporsional.

**Teorema Pythagoras & Triple Pythagoras:**
\`\`\`
a² + b² = c²    (c = sisi miring)

Triple Pythagoras: (3,4,5) (5,12,13) (8,15,17) (7,24,25)
\`\`\`

### Lingkaran:
- **Sudut Pusat** = 2 × **Sudut Keliling** (menghadap busur sama)
- **Sudut dalam lingkaran** = ½ × (jumlah busur yang diapit)
- Panjang busur = (θ/360°) × 2πr
- Luas juring = (θ/360°) × πr²

---

## 2. Geometri Ruang

| Bangun | Volume | Luas Permukaan |
|---|---|---|
| Kubus (s) | s³ | 6s² |
| Balok (p,l,t) | plt | 2(pl + lt + pt) |
| Tabung (r,t) | πr²t | 2πr(r + t) |
| Kerucut (r,t,s) | ⅓πr²t | πr(r + s) |
| Bola (r) | 4/3 πr³ | 4πr² |

### Bangun Kombinasi:
Pisahkan menjadi bangun-bangun dasar yang sudah dikenal → jumlahkan volumenya.

---

## 3. Trigonometri Dasar

### Rasio Trigonometri di Segitiga Siku-Siku:
\`\`\`
sin α = sisi depan / hipotenusa
cos α = sisi samping / hipotenusa
tan α = sisi depan / sisi samping
\`\`\`

**Mnemonik**: "SOH CAH TOA"

### Nilai Sudut Istimewa:
| Sudut | sin | cos | tan |
|---|---|---|---|
| 0° | 0 | 1 | 0 |
| 30° | ½ | ½√3 | ⅓√3 |
| 45° | ½√2 | ½√2 | 1 |
| 60° | ½√3 | ½ | √3 |
| 90° | 1 | 0 | ∞ |

### Aturan Sinus & Cosinus (untuk segitiga sembarang):
\`\`\`
Aturan Sinus:  a/sin A = b/sin B = c/sin C
Aturan Cosinus: a² = b² + c² - 2bc·cos A
\`\`\`

---

## 4. Aplikasi Trigonometri

### Sudut Elevasi & Depresi:
- **Sudut Elevasi**: Dilihat dari bawah ke atas (tan α = tinggi/jarak horizontal)
- **Sudut Depresi**: Dilihat dari atas ke bawah

### Contoh Soal Terapan:
*Sebuah menara setinggi 50 m dilihat dari titik A di tanah. Sudut elevasi puncak menara dari A adalah 30°. Berapa jarak A dari kaki menara?*
→ tan 30° = 50/jarak → jarak = 50/(1/√3) = 50√3 m

---

## 5. Ringkasan Kunci SNBT 2026

> SNBT 2026 diprediksi memperbanyak soal geometri dalam **konteks arsitektur, konstruksi, dan navigasi** — siswa harus mengubah situasi nyata menjadi model geometri.

- Hafal triple Pythagoras — menghemat waktu menghitung akar.
- Sketsa selalu membantu, terutama untuk soal bangun ruang.
- Sudut istimewa trigonometri wajib hafal di luar kepala.
    `,
    summary: 'Geometri dan trigonometri SNBT berfokus pada aplikasi kontekstual. Kuasai teorema Pythagoras, rumus bangun ruang, dan nilai sudut istimewa trigonometri untuk efisiensi pengerjaan.',
    sources: [
      { name: 'Khan Academy — Geometry', url: 'https://www.khanacademy.org/math/geometry' },
      { name: 'Khan Academy — Trigonometry', url: 'https://www.khanacademy.org/math/trigonometry' }
    ]
  },
  {
    id: 'mat-pm-3',
    concept: 'Data',
    category: 'Penalaran Matematika',
    title: 'Statistika, Peluang & Analisis Data SNBT 2026',
    fullContent: `
# Statistika & Peluang — Penalaran Berbasis Data

Statistika dan peluang menyumbang sekitar **4–6 soal** di SNBT dan menjadi topik yang terus meningkat porsinya setiap tahun.

---

## 1. Statistika Deskriptif

### Ukuran Pemusatan:
| Ukuran | Formula | Keunggulan | Kelemahan |
|---|---|---|---|
| **Mean** | Σxᵢ / n | Memperhitungkan semua nilai | Terpengaruh outlier |
| **Median** | Nilai tengah (setelah diurutkan) | Tidak terpengaruh outlier | Tidak mempertimbangkan semua nilai |
| **Modus** | Nilai paling sering | Untuk data kategorikal | Bisa ada banyak modus |

### Ukuran Penyebaran:
| Ukuran | Formula | Arti |
|---|---|---|
| **Range** | Nilai max − min | Rentang total data |
| **Varians** | Σ(xᵢ − x̄)² / n | Rata-rata kuadrat deviasi |
| **Simpangan Baku** | √Varians | Seberapa jauh data dari rata-rata |

---

## 2. Distribusi Data

### Histogram & Frekuensi:
- **Frekuensi**: Berapa kali nilai muncul
- **Frekuensi Kumulatif**: Jumlah frekuensi sampai kelas tertentu
- **Frekuensi Relatif**: Frekuensi / Total data

### Kuartil:
- Q1 (Kuartil Bawah) = Median dari separuh bawah data
- Q2 = Median keseluruhan
- Q3 (Kuartil Atas) = Median dari separuh atas data
- **Jangkauan Interkuartil (IQR)** = Q3 − Q1

---

## 3. Peluang (Probabilitas)

### Rumus Dasar:
\`\`\`
P(A) = n(A) / n(S)
n(A) = banyak kejadian yang diinginkan
n(S) = banyak seluruh kejadian mungkin
\`\`\`

### Sifat Peluang:
- 0 ≤ P(A) ≤ 1
- P(A) + P(Aᶜ) = 1
- P(A ∪ B) = P(A) + P(B) − P(A ∩ B)

### Peluang Kejadian Saling Bebas:
P(A ∩ B) = P(A) × P(B)

### Peluang Bersyarat:
P(A|B) = P(A ∩ B) / P(B)
*(Peluang A terjadi, diketahui B sudah terjadi)*

---

## 4. Kombinatorika

### Aturan Dasar:
- **Aturan Perkalian**: Jika ada m cara untuk langkah 1 dan n cara untuk langkah 2 → m × n cara total.

### Permutasi (urutan penting):
\`\`\`
P(n,r) = n! / (n−r)!
\`\`\`

### Kombinasi (urutan tidak penting):
\`\`\`
C(n,r) = n! / (r! × (n−r)!)
\`\`\`

**Mnemonic**: Permutasi = Pizza (urutan topping penting), Kombinasi = Kopi (campuran, urutan tidak peduli).

---

## 5. Ringkasan Kunci SNBT 2026

> SNBT 2026 diprediksi menyajikan soal statistika dari **data riil** (misalnya data BPS, hasil survei) dan menguji kemampuan membaca kesimpulan yang **valid** dari data statistik tersebut.

- Pahami kapan menggunakan mean vs median (kunci: ada outlier atau tidak).
- Latih soal peluang bersyarat — ini sering menjadi soal berkesulitan tinggi.
- Kuasai perbedaan permutasi dan kombinasi — jangan sampai tertukar.
    `,
    summary: 'Statistika dan peluang SNBT mencakup ukuran pemusatan, penyebaran, probabilitas dasar, dan kombinatorika. Pahami kapan mean vs median lebih tepat digunakan dan kuasai peluang bersyarat.',
    sources: [
      { name: 'Khan Academy — Statistics & Probability', url: 'https://www.khanacademy.org/math/statistics-probability' },
      { name: 'BPS Indonesia — Data Statistik', url: 'https://www.bps.go.id/' }
    ]
  },

  // ─── PREDIKSI 2026 ───────────────────────────────────────────
  {
    id: 'pred-2026-1',
    concept: 'Penalaran Induktif',
    category: 'TPS',
    title: 'Prediksi 2026: TPS — Pola 3D & Evaluasi Argumen Baru',
    fullContent: `
# Prediksi SNBT 2026 — Sub-tes TPS

Berdasarkan analisis kisi-kisi resmi SNPMB, tren soal SNBT 2023–2025, dan benchmark internasional (GRE, SAT, PISA), berikut prediksi perubahan TPS 2026.

---

## Perubahan Utama yang Diprediksi

### 1. Penalaran Figural 3 Dimensi
SNBT 2025 sudah mulai memunculkan gambar isometrik. Pada 2026, diprediksi ada **2–3 soal figural 3D** yang memerlukan kemampuan rotasi mental (mental rotation).

**Cara Latihan:**
- Coba puzzle rubik dan soal spatial reasoning online.
- Bayangkan objek 3D dari sudut pandang berbeda.
- Kerjakan soal dari tes DAT (Dental Admission Test) spatial section.

---

### 2. Evaluasi Argumen Teks Pendek
Format baru: diberikan argumen singkat (2–4 kalimat), diminta menilai **kelemahan argumen**.

**Contoh Format:**
*"Kota X menurunkan pajak. Tahun berikutnya, pertumbuhan ekonomi meningkat. Oleh karena itu, penurunan pajak menyebabkan pertumbuhan ekonomi."*

Kelemahan: Ini adalah fallacy **post hoc ergo propter hoc** (setelah ini, maka karena ini) — korelasi bukan kausalitas.

---

### 3. Soal Analogi Gambar-Kata
Kombinasi antara analogi verbal dan figural: diberikan gambar + kata, diminta mencari pasangan yang analogis. Contoh: Gambar benih → Pohon :: Gambar embrio → ?

---

## Strategi Persiapan TPS 2026

| Area | Target Skor | Strategi |
|---|---|---|
| Penalaran Induktif | ≥ 8/10 | Latihan pola 3D, timed drill |
| Penalaran Deduktif | ≥ 8/10 | Hafalkan 4 aturan implikasi |
| Penalaran Kuantitatif | ≥ 8/15 | Latihan grafik BPS, soal perbandingan |
| PPU | ≥ 16/20 | Baca 1 artikel ilmiah/hari |
| PBM | ≥ 15/20 | Latihan kalimat efektif setiap hari |
| Pengetahuan Kuantitatif | ≥ 10/15 | Kuasai aljabar dasar dan geometri |
    `,
    summary: 'Prediksi TPS 2026 mencakup figural 3D baru, soal evaluasi argumen, dan kombinasi analogi gambar-kata. Persiapkan diri dengan latihan spatial reasoning dan kritis terhadap argumen.',
    sources: [
      { name: 'SNPMB — Kisi-kisi Resmi 2026', url: 'https://snpmb.bppp.kemdikbud.go.id/' },
      { name: 'Pusmendik Kemendikbud', url: 'https://pusmendik.kemdikbud.go.id/' }
    ]
  },
  {
    id: 'pred-2026-2',
    concept: 'Literasi Bahasa Indonesia',
    category: 'Literasi Indonesia',
    title: 'Prediksi 2026: Literasi Indonesia — Teks Multimodal & Sintesis',
    fullContent: `
# Prediksi 2026 — Literasi Bahasa Indonesia

---

## Tren Perubahan 2026

### 1. Teks Multimodal
Soal tidak hanya menggunakan teks tulis, tetapi **kombinasi teks + grafik/tabel/diagram**. Siswa diminta menghubungkan informasi visual dengan narasi.

**Contoh:** Teks tentang kemiskinan + tabel data BPS → "Berdasarkan teks dan tabel, manakah kesimpulan yang paling tepat?"

### 2. Sintesis Dua Teks
Dua teks pendek tentang topik yang sama (misalnya perubahan iklim) dari sudut pandang berbeda → siswa diminta membandingkan argumen dan menemukan persamaan/perbedaan.

### 3. Soal Retorika
Pertanyaan seperti: "Mengapa penulis memilih kata 'merajai' bukan 'menguasai' pada kalimat tersebut?" → Menguji pemahaman **efek stilistika** pilihan kata.

---

## Topik yang Diprediksi Dominan

| Topik | Relevansi |
|---|---|
| Lingkungan hidup & perubahan iklim | Isu global trending |
| Transformasi digital & teknologi | Relevansi nasional |
| Kesehatan masyarakat & pandemi | Pasca-COVID19 |
| Ketimpangan sosial-ekonomi | Isu pembangunan nasional |
| Pendidikan & literasi | Sesuai konteks SNBT |

---

## Strategi Menghadapi Perubahan

1. **Biasakan membaca teks + grafik** sekaligus (latih dari laporan lembaga pemerintah).
2. **Latih membandingkan dua artikel** tentang topik sama dari media berbeda.
3. **Perhatikan pilihan kata** saat membaca — penulis selalu punya alasan memilih diksi tertentu.
4. **Jangan terburu-buru** membaca grafik — bacalah judul, sumbu, dan legenda sebelum data.
    `,
    summary: 'Literasi Indonesia 2026 akan menghadirkan teks multimodal, sintesis dua teks, dan soal retorika. Latih membaca teks ilmiah bersamaan dengan data visual untuk persiapan optimal.',
    sources: [
      { name: 'SNPMB Resmi', url: 'https://snpmb.bppp.kemdikbud.go.id/' },
      { name: 'Badan Bahasa Kemendikbud', url: 'https://badanbahasa.kemdikbud.go.id/' }
    ]
  },
  {
    id: 'pred-2026-3',
    concept: 'Penalaran Matematika',
    category: 'Penalaran Matematika',
    title: 'Prediksi 2026: Matematika — Pemodelan & Aplikasi PISA',
    fullContent: `
# Prediksi 2026 — Penalaran Matematika

---

## Pergeseran Kurikulum: Menuju Matematika Terapan (PISA-Style)

SNBT 2026 diprediksi semakin mengadopsi pendekatan PISA (Programme for International Student Assessment), yaitu **matematika dalam konteks kehidupan nyata**.

---

## Topik yang Meningkat Porsinya

### 1. Pemodelan Matematika dari Narasi
Tidak ada soal langsung. Setiap soal dimulai dari cerita/situasi nyata, dan siswa harus membentuk model matematikanya sendiri.

**Contoh**: *"Sebuah perusahaan memproduksi x unit per hari dengan biaya Rp(2x² + 100x + 500) ribu. Berapa unit produksi untuk meminimalkan biaya rata-rata per unit?"*
→ Siswa harus memahami "biaya rata-rata" = total biaya / x, lalu minimalkan fungsi itu.

### 2. Konteks Keuangan & Ekonomi
- Bunga majemuk dan nilai waktu uang
- Analisis break-even point sederhana
- Interpretasi laporan keuangan sederhana (laba, rugi, margin)

### 3. Geometri Kontekstual
- Perencanaan tata ruang dan efisiensi lahan
- Navigasi dan penggunaan trigonometri dalam pemetaan
- Desain dan skala (arsitektur/engineering sederhana)

---

## Distribusi Prediksi Topik 2026

| Topik | Prediksi Soal | Tingkat Kesulitan |
|---|---|---|
| Aljabar & Fungsi | 5–6 | Sedang–Tinggi |
| Statistika & Peluang | 4–5 | Sedang |
| Geometri & Trigonometri | 4–5 | Sedang–Tinggi |
| Aritmatika Sosial | 3–4 | Sedang |
| Barisan & Deret | 2–3 | Sedang |

---

## Tips Persiapan

1. **Latihan soal PISA** (tersedia gratis di website OECD).
2. **Jangan hafal rumus** — pahami kapan dan mengapa rumus digunakan.
3. **Estimasi jawaban** dulu sebelum hitung → buang pilihan yang tidak masuk akal.
4. **Manajemen waktu**: 20 soal dalam 45 menit → rata-rata 2,25 menit/soal.
    `,
    summary: 'Matematika 2026 semakin berorientasi PISA: pemodelan dari situasi nyata, konteks keuangan, dan geometri terapan. Latih soal cerita dan pahami konsep di balik rumus.',
    sources: [
      { name: 'PISA Mathematics Framework', url: 'https://www.oecd.org/pisa/' },
      { name: 'Khan Academy — Applied Math', url: 'https://www.khanacademy.org/math' }
    ]
  },
  {
    id: 'pred-2026-4',
    concept: 'Literasi Bahasa Inggris',
    category: 'Literasi Inggris',
    title: 'Prediksi 2026: English Literacy — Academic & Digital Texts',
    fullContent: `
# Prediksi 2026 — Literasi Bahasa Inggris

---

## Tren Perubahan 2026

### 1. Teks Akademik Lebih Panjang & Padat
Dari rata-rata 400 kata → prediksi 600–800 kata per teks. Ini menuntut kecepatan membaca **minimal 200 kata per menit** sambil tetap memahami konten.

### 2. Paired Passages (Teks Berpasangan)
Dua teks pendek tentang topik sama → soal meminta membandingkan:
- Perspektif penulis masing-masing
- Bukti yang digunakan
- Simpulan yang bisa ditarik dari kedua teks

### 3. Data Integration
Teks akademik disajikan bersama **grafik, tabel, atau diagram** → soal menggabungkan pemahaman teks dan data visual.

---

## Topik Prioritas Latihan

| Topik | Contoh Teks |
|---|---|
| Ilmu lingkungan | Climate change adaptation strategies |
| Teknologi & masyarakat | AI impact on employment |
| Kesehatan global | Vaccine development and hesitancy |
| Sejarah & budaya | Colonialism's economic legacy |
| Pendidikan | Online learning effectiveness |

---

## Strategi Kecepatan Membaca

### Teknik SQ3R (Survey-Question-Read-Recite-Review):
1. **Survey**: Baca judul, subjudul, kalimat pertama setiap paragraf (30 detik).
2. **Question**: Ubah heading menjadi pertanyaan (sebelum membaca).
3. **Read**: Baca untuk menjawab pertanyaan itu (fokus, bukan kata per kata).
4. **Recite**: Ringkas setiap paragraf dalam 5 kata.
5. **Review**: Jawab pertanyaan soal berdasarkan catatan mental kamu.

### Vocabulary Building Plan:
- Minggu 1–2: Academic Word List (AWL) tier 1 (100 kata paling sering)
- Minggu 3–4: AWL tier 2 (100 kata berikutnya)
- Setiap hari: Baca 1 artikel berbahasa Inggris tanpa kamus → tebak dari konteks
    `,
    summary: 'English Literacy 2026 akan menggunakan teks lebih panjang, paired passages, dan data integration. Latih kecepatan membaca minimal 200 kata/menit dan bangun kosakata akademik secara sistematis.',
    sources: [
      { name: 'IELTS Academic Reading Practice', url: 'https://www.ielts.org/' },
      { name: 'Academic Word List', url: 'https://www.victoria.ac.nz/lals/resources/academicwordlist/' }
    ]
  }
];

type LearningBlockType = 'core_concept' | 'worked_example' | 'common_trap' | 'quick_drill';

const BLOCK_LABEL: Record<LearningBlockType, string> = {
  core_concept: 'Konsep Inti',
  worked_example: 'Worked Example',
  common_trap: 'Common Trap',
  quick_drill: 'Quick Drill',
};

const toBulletItems = (text: string, fallback: string[]): string[] => {
  const matches = Array.from(text.matchAll(/(?:^-|^\*|^\d+\.)\s+(.+)$/gm)).map(m => m[1].trim()).filter(Boolean);
  return matches.length >= 2 ? matches.slice(0, 4) : fallback;
};

const buildLearningBlocks = (material: StudyMaterial): StudyMaterial['learningBlocks'] => {
  const bullets = toBulletItems(material.fullContent, [
    `Fokus pada poin kunci ${material.concept}.`,
    'Gunakan eliminasi jawaban untuk menghemat waktu.',
    'Catat pola soal yang sering berulang.',
    'Review error umum sebelum mengerjakan soal berikutnya.',
  ]);

  return [
    {
      id: `${material.id}-core`,
      type: 'core_concept',
      title: `${BLOCK_LABEL.core_concept}: ${material.concept}`,
      content: material.summary,
      checkpoints: [
        { id: `${material.id}-core-c1`, prompt: 'Pilih strategi utama untuk tipe soal ini.', focus: 'strategi' },
        { id: `${material.id}-core-c2`, prompt: 'Identifikasi indikator kapan strategi dipakai.', focus: 'trigger' },
      ],
    },
    {
      id: `${material.id}-example`,
      type: 'worked_example',
      title: BLOCK_LABEL.worked_example,
      content: bullets.slice(0, 2).map((item, i) => `${i + 1}. ${item}`).join('\n'),
      checkpoints: [
        { id: `${material.id}-ex-c1`, prompt: 'Urutkan langkah penyelesaian paling efisien.', focus: 'langkah' },
        { id: `${material.id}-ex-c2`, prompt: 'Tentukan alasan langkah kritis di worked example.', focus: 'alasan' },
      ],
    },
    {
      id: `${material.id}-trap`,
      type: 'common_trap',
      title: BLOCK_LABEL.common_trap,
      content: bullets.slice(2, 4).map(item => `- ${item}`).join('\n'),
      checkpoints: [
        { id: `${material.id}-trap-c1`, prompt: 'Pilih jebakan yang paling sering bikin salah.', focus: 'jebakan' },
        { id: `${material.id}-trap-c2`, prompt: 'Tentukan tindakan pencegahan saat menemukan jebakan.', focus: 'mitigasi' },
      ],
    },
    {
      id: `${material.id}-drill`,
      type: 'quick_drill',
      title: BLOCK_LABEL.quick_drill,
      content: 'Latihan 30-60 detik: sebutkan langkah, cek jebakan, lalu jawab cepat.',
      checkpoints: [
        { id: `${material.id}-drill-c1`, prompt: 'Nilai kesiapan menjawab cepat (<60 detik).', focus: 'kecepatan' },
        { id: `${material.id}-drill-c2`, prompt: 'Konfirmasi akurasi setelah speed drill.', focus: 'akurasi' },
      ],
      quickRevision: 'Mode ulang cepat 30–60 detik: baca ringkasan, recall 1 jebakan, kerjakan 1 soal mental.',
    },
  ];
};

export const STUDY_MATERIALS: StudyMaterial[] = LEGACY_STUDY_MATERIALS.map(material => ({
  ...material,
  learningBlocks: buildLearningBlocks(material),
}));

const buildStudyBlocks = (material: Omit<StudyMaterial, 'studyBlocks' | 'priority' | 'scoreImpact' | 'quick30sSummary' | 'revisionNotes'>) => [
  {
    id: `${material.id}-core`,
    title: 'Blok 1 — Konsep Inti',
    coreConcept: `Pahami kerangka utama ${material.concept} sebelum latihan detail.`,
    workedExample: `Contoh worked-example: ubah satu soal ${material.concept} menjadi langkah 1) identifikasi informasi, 2) pilih strategi, 3) verifikasi hasil.`,
    commonMistakes: [
      'Langsung hitung tanpa memetakan informasi penting.',
      'Menghafal pola tanpa memahami alasan di balik langkah.',
      'Tidak mengecek ulang apakah jawaban menjawab pertanyaan.'
    ],
    quickExercise: `Latihan cepat: tulis 3 indikator bahwa soal ini termasuk ${material.concept}.`,
    strategyWhenToUse: `Gunakan strategi ini saat soal meminta inferensi/relasi dan informasi tidak diberikan secara eksplisit.`,
    checkpoints: [
      { question: 'Apa informasi minimum yang wajib ditandai dulu?', answer: 'Kata kunci, batasan, dan apa yang ditanya.' },
      { question: 'Strategi utama apa yang dipakai di blok ini?', answer: 'Identifikasi pola/relasi lalu validasi dengan eliminasi.' }
    ]
  },
  {
    id: `${material.id}-application`,
    title: 'Blok 2 — Worked Example ke Variasi Soal',
    coreConcept: 'Transfer strategi dari contoh ke bentuk soal baru dengan struktur serupa.',
    workedExample: 'Worked-example: setelah menyelesaikan contoh, ubah satu angka/istilah lalu cek apakah logika penyelesaian tetap sama.',
    commonMistakes: [
      'Terlalu terpaku pada angka persis dari contoh.',
      'Tidak membedakan soal yang terlihat mirip tetapi struktur logikanya berbeda.',
      'Melewatkan proses eliminasi opsi.'
    ],
    quickExercise: 'Latihan cepat: kerjakan 1 soal serupa dalam 90 detik dan tulis alasan tiap langkah.',
    strategyWhenToUse: 'Pakai saat menemukan soal baru yang bentuknya berbeda tetapi relasi antar unsur sama.',
    checkpoints: [
      { question: 'Apa tanda bahwa soal baru masih satu keluarga strategi?', answer: 'Relasi inti dan jenis inferensi yang diminta tetap sama.' },
      { question: 'Langkah verifikasi tercepat apa?', answer: 'Uji jawaban pada kondisi batas atau substitusi balik singkat.' },
      { question: 'Kapan harus pindah strategi?', answer: 'Saat 2 percobaan tidak memberi progres dalam ±45 detik.' }
    ]
  }
];

export const STUDY_MATERIALS: StudyMaterial[] = BASE_STUDY_MATERIALS.map((material, index) => {
  const { priority, scoreImpact } = getPriorityMeta(index);
  return {
    ...material,
    priority,
    scoreImpact,
    quick30sSummary: `${material.concept}: fokus pada pola inti, hindari jebakan umum, lalu cek jawaban dengan satu validasi cepat.`,
    revisionNotes: [
      'Review 1: ulangi blok konsep inti 24 jam setelah belajar pertama.',
      'Review 2: kerjakan checkpoint tanpa lihat catatan pada hari ke-3.',
      'Review 3: ulang soal variasi pada hari ke-7 dan catat pola salah.'
    ],
    studyBlocks: buildStudyBlocks(material)
  };
});
export const findMaterialByConcept = (concept: string): StudyMaterial | undefined =>
  STUDY_MATERIALS.find((m) => m.concept === concept);
