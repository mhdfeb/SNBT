import { QuestionBankItem } from '../../types/quiz';

export const TPS_QUESTIONS: QuestionBankItem[] = [
import { Question } from '../../types/quiz';
import { withBlueprintMetadata } from './quality';

export const TPS_QUESTIONS: Question[] = withBlueprintMetadata([
  // --- TPS: Penalaran Induktif ---
  {
    id: 'pi-1',
    category: 'TPS',
    concept: 'Penalaran Induktif',
    difficulty: 'easy',
    type: 'multiple_choice',
    question: 'Amati pola berikut: 3, 6, 12, 24, ... Angka selanjutnya adalah?',
    options: ['30', '36', '48', '60', '72'],
    correctAnswer: 2,
    explanation: 'Pola perkalian dua (x2). 24 x 2 = 48.',
    irtParams: { difficulty: -1.5, discrimination: 1.2, guessing: 0.2 }
  },
  {
    id: 'pi-2',
    category: 'TPS',
    concept: 'Penalaran Induktif',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Pola: 1, 4, 9, 16, 25, ... Angka ke-7 dari pola ini adalah?',
    options: ['36', '49', '64', '81', '100'],
    correctAnswer: 1,
    explanation: 'Pola bilangan kuadrat (n^2). Angka ke-7 adalah 7^2 = 49.',
    irtParams: { difficulty: 0.2, discrimination: 1.4, guessing: 0.2 }
  },
  {
    id: 'pi-3',
    category: 'TPS',
    concept: 'Penalaran Induktif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Pola: 2, 3, 5, 8, 13, 21, ... Dua angka selanjutnya adalah?',
    options: ['29, 42', '34, 55', '30, 45', '34, 50', '25, 38'],
    correctAnswer: 1,
    explanation: 'Deret Fibonacci (jumlah dua angka sebelumnya). 13+21=34, 21+34=55.',
    irtParams: { difficulty: 1.5, discrimination: 1.8, guessing: 0.2 }
  },
  {
    id: 'pi-4',
    category: 'TPS',
    concept: 'Penalaran Induktif',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Jika mawar merah harum, melati putih harum, dan kamboja kuning harum, maka kesimpulan induktifnya adalah...',
    options: [
      'Semua bunga berwarna merah harum',
      'Semua bunga yang harum berwarna putih',
      'Semua bunga mungkin harum',
      'Beberapa bunga tidak harum',
      'Hanya kamboja yang harum'
    ],
    correctAnswer: 2,
    explanation: 'Penalaran induktif menarik kesimpulan umum dari contoh-contoh khusus. Karena beberapa contoh bunga harum, maka disimpulkan semua bunga mungkin harum.',
    irtParams: { difficulty: 0.5, discrimination: 1.3, guessing: 0.2 }
  },
  {
    id: 'pi-5',
    category: 'TPS',
    concept: 'Penalaran Induktif',
    difficulty: 'easy',
    type: 'multiple_choice',
    question: 'Pola: A, D, G, J, ... Huruf selanjutnya adalah?',
    options: ['K', 'L', 'M', 'N', 'O'],
    correctAnswer: 2,
    explanation: 'Pola melompati dua huruf: A (bc) D (ef) G (hi) J (kl) M.',
    irtParams: { difficulty: -1.0, discrimination: 1.1, guessing: 0.2 }
  },
  {
    id: 'pi-6',
    category: 'TPS',
    concept: 'Penalaran Induktif',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Pola: 5, 11, 23, 47, ... Angka selanjutnya adalah?',
    options: ['94', '95', '96', '97', '98'],
    correctAnswer: 1,
    explanation: 'Pola: (n * 2) + 1. 47 * 2 + 1 = 95.',
    irtParams: { difficulty: 0.6, discrimination: 1.4, guessing: 0.2 }
  },
  {
    id: 'pi-7',
    category: 'TPS',
    concept: 'Penalaran Induktif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Pola: 1, 2, 6, 15, 31, ... Angka selanjutnya adalah?',
    options: ['47', '56', '62', '50', '45'],
    correctAnswer: 1,
    explanation: 'Pola selisih: +1, +4, +9, +16 (bilangan kuadrat). Selanjutnya +25. 31 + 25 = 56.',
    irtParams: { difficulty: 1.8, discrimination: 1.6, guessing: 0.2 }
  },
  {
    id: 'pi-8',
    category: 'TPS',
    concept: 'Penalaran Induktif',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Pola: 100, 95, 85, 70, ... Angka selanjutnya adalah?',
    options: ['60', '55', '50', '45', '40'],
    correctAnswer: 2,
    explanation: 'Pola pengurangan: -5, -10, -15. Selanjutnya -20. 70 - 20 = 50.',
    irtParams: { difficulty: 0.4, discrimination: 1.2, guessing: 0.2 }
  },

  // --- TPS: Penalaran Deduktif ---
  {
    id: 'pd-1',
    category: 'TPS',
    concept: 'Penalaran Deduktif',
    difficulty: 'easy',
    type: 'multiple_choice',
    question: 'Semua manusia fana. Socrates adalah manusia. Kesimpulan yang tepat adalah...',
    options: ['Socrates tidak fana', 'Socrates fana', 'Semua manusia adalah Socrates', 'Socrates adalah dewa', 'Tidak ada kesimpulan'],
    correctAnswer: 1,
    explanation: 'Silogisme: Semua A adalah B. C adalah A. Maka C adalah B.',
    irtParams: { difficulty: -2.0, discrimination: 1.0, guessing: 0.2 }
  },
  {
    id: 'pd-2',
    category: 'TPS',
    concept: 'Penalaran Deduktif',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Jika hari hujan, maka tanah basah. Tanah tidak basah. Kesimpulan yang tepat adalah...',
    options: ['Hari hujan', 'Hari tidak hujan', 'Tanah kering', 'Hujan turun kemarin', 'Mungkin hari hujan'],
    correctAnswer: 1,
    explanation: 'Modus Tollens: p → q, ~q ∴ ~p.',
    irtParams: { difficulty: 0.5, discrimination: 1.5, guessing: 0.2 }
  },
  {
    id: 'pd-3',
    category: 'TPS',
    concept: 'Penalaran Deduktif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Beberapa mahasiswa adalah aktivis. Semua aktivis pandai bicara. Kesimpulan yang tepat adalah...',
    options: [
      'Semua mahasiswa pandai bicara',
      'Beberapa mahasiswa pandai bicara',
      'Semua yang pandai bicara adalah mahasiswa',
      'Aktivis bukan mahasiswa',
      'Mahasiswa tidak pandai bicara'
    ],
    correctAnswer: 1,
    explanation: 'Karena beberapa mahasiswa adalah aktivis, dan semua aktivis pandai bicara, maka mahasiswa yang aktivis tersebut pasti pandai bicara.',
    irtParams: { difficulty: 1.2, discrimination: 1.6, guessing: 0.2 }
  },
  {
    id: 'pd-4',
    category: 'TPS',
    concept: 'Penalaran Deduktif',
    difficulty: 'medium',
    type: 'complex_multiple_choice',
    question: 'Premis: "Jika lampu menyala, maka ada aliran listrik. Lampu tidak menyala." Tentukan kebenaran pernyataan berikut:',
    complexOptions: [
      { statement: 'Pasti tidak ada aliran listrik.', correct: false },
      { statement: 'Mungkin ada aliran listrik tapi lampu rusak.', correct: true },
      { statement: 'Aliran listrik menyebabkan lampu menyala.', correct: true },
      { statement: 'Lampu menyala jika tidak ada listrik.', correct: false }
    ],
    explanation: 'Pernyataan 1 salah karena ~p tidak menjamin ~q (Denying the antecedent). Pernyataan 2 benar secara logika dunia nyata. Pernyataan 3 benar sesuai premis p→q.',
    irtParams: { difficulty: 0.8, discrimination: 1.4, guessing: 0.0 }
  },
  {
    id: 'pd-5',
    category: 'TPS',
    concept: 'Penalaran Deduktif',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Jika semua burung bisa terbang, dan penguin adalah burung, maka penguin bisa terbang. Pernyataan ini salah karena...',
    options: [
      'Premis pertama salah',
      'Premis kedua salah',
      'Kesimpulan tidak mengikuti premis',
      'Penguin bukan burung',
      'Burung tidak terbang'
    ],
    correctAnswer: 0,
    explanation: 'Logikanya valid (silogisme), tetapi premis pertama (semua burung bisa terbang) secara faktual salah karena ada burung yang tidak bisa terbang (seperti penguin).',
    irtParams: { difficulty: 0.7, discrimination: 1.5, guessing: 0.2 }
  },
  {
    id: 'pd-6',
    category: 'TPS',
    concept: 'Penalaran Deduktif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Jika semua X adalah Y, dan tidak ada Z yang merupakan Y, maka...',
    options: [
      'Semua X adalah Z',
      'Beberapa X adalah Z',
      'Tidak ada X yang merupakan Z',
      'Beberapa Z adalah X',
      'Semua Z adalah X'
    ],
    correctAnswer: 2,
    explanation: 'Jika X bagian dari Y, dan Z terpisah dari Y, maka X dan Z pasti terpisah.',
    irtParams: { difficulty: 1.5, discrimination: 1.7, guessing: 0.2 }
  },
  {
    id: 'pd-7',
    category: 'TPS',
    concept: 'Penalaran Deduktif',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Jika hari hari ini Selasa, maka besok Rabu. Besok bukan Rabu. Kesimpulan?',
    options: ['Hari ini Selasa', 'Hari ini bukan Selasa', 'Besok Selasa', 'Kemarin Senin', 'Tidak ada kesimpulan'],
    correctAnswer: 1,
    explanation: 'Modus Tollens: p -> q, ~q ∴ ~p.',
    irtParams: { difficulty: 0.3, discrimination: 1.1, guessing: 0.2 }
  },

  // --- TPS: Penalaran Kuantitatif ---
  {
    id: 'pk-1',
    category: 'TPS',
    concept: 'Penalaran Kuantitatif',
    difficulty: 'easy',
    type: 'multiple_choice',
    question: 'Jika 3x = 12, maka x + 5 = ...',
    options: ['4', '7', '9', '12', '15'],
    correctAnswer: 2,
    explanation: 'x = 12/3 = 4. Maka x + 5 = 4 + 5 = 9.',
    irtParams: { difficulty: -1.5, discrimination: 1.1, guessing: 0.2 }
  },
  {
    id: 'pk-2',
    category: 'TPS',
    concept: 'Penalaran Kuantitatif',
    difficulty: 'medium',
    type: 'short_answer',
    question: 'Berapakah nilai dari (2^3 * 2^2) / 2^4?',
    shortAnswerCorrect: 2,
    explanation: '2^(3+2) / 2^4 = 2^5 / 2^4 = 2^(5-4) = 2^1 = 2.',
    irtParams: { difficulty: 0.3, discrimination: 1.3, guessing: 0.0 }
  },
  {
    id: 'pk-3',
    category: 'TPS',
    concept: 'Penalaran Kuantitatif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Sebuah toko memberikan diskon 20% kemudian diskon lagi 10% dari harga setelah diskon pertama. Total diskon yang diberikan adalah...',
    options: ['30%', '28%', '25%', '32%', '22%'],
    correctAnswer: 1,
    explanation: 'Misal harga 100. Diskon 20% -> 80. Diskon 10% dari 80 -> 8. Total diskon = 20 + 8 = 28%.',
    irtParams: { difficulty: 1.6, discrimination: 1.7, guessing: 0.2 }
  },
  {
    id: 'pk-4-new',
    category: 'TPS',
    concept: 'Penalaran Kuantitatif',
    difficulty: 'easy',
    type: 'multiple_choice',
    question: 'Jika x + y = 10 dan x - y = 2, berapakah nilai x * y?',
    options: ['12', '20', '24', '16', '15'],
    correctAnswer: 2,
    explanation: '2x = 12 -> x = 6. y = 4. x * y = 24.',
    irtParams: { difficulty: -0.5, discrimination: 1.2, guessing: 0.2 }
  },
  {
    id: 'pk-5-new',
    category: 'TPS',
    concept: 'Penalaran Kuantitatif',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Jika p > q dan r < 0, maka pernyataan yang pasti benar adalah...',
    options: ['pr > qr', 'pr < qr', 'p+r > q+r', 'p/r > q/r', 'B dan C benar'],
    correctAnswer: 4,
    explanation: 'Mengalikan pertidaksamaan dengan bilangan negatif membalik tanda (pr < qr). Menambah bilangan yang sama tidak mengubah tanda (p+r > q+r).',
    irtParams: { difficulty: 0.9, discrimination: 1.4, guessing: 0.2 }
  },
  {
    id: 'pk-6-new',
    category: 'TPS',
    concept: 'Penalaran Kuantitatif',
    difficulty: 'easy',
    type: 'multiple_choice',
    question: 'Manakah yang lebih besar: 0.5 atau 1/3?',
    options: ['0.5', '1/3', 'Sama besar', 'Tidak bisa ditentukan', '0.33'],
    correctAnswer: 0,
    explanation: '0.5 = 1/2. 1/2 > 1/3.',
    irtParams: { difficulty: -1.0, discrimination: 1.0, guessing: 0.2 }
  },
  {
    id: 'pk-7-new',
    category: 'TPS',
    concept: 'Penalaran Kuantitatif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Jika 3 @ 4 = 25, 5 @ 12 = 169, dan 8 @ 15 = 289, maka berapakah nilai dari 7 @ 24?',
    options: ['525', '625', '676', '729', '441'],
    correctAnswer: 1,
    explanation: 'Simbol "@" dalam soal ini mendefinisikan operasi: x @ y = x² + y². \n3 @ 4 = 3² + 4² = 9 + 16 = 25. \n5 @ 12 = 5² + 12² = 25 + 144 = 169. \n8 @ 15 = 8² + 15² = 64 + 225 = 289. \nMaka, 7 @ 24 = 7² + 24² = 49 + 576 = 625.',
    irtParams: { difficulty: 1.5, discrimination: 1.8, guessing: 0.2 }
  },

  // --- TPS: Pengetahuan & Pemahaman Umum (PPU) ---
  {
    id: 'ppu-1',
    category: 'TPS',
    concept: 'Pengetahuan & Pemahaman Umum',
    difficulty: 'easy',
    type: 'multiple_choice',
    question: 'Sinonim dari kata "MANGKUS" adalah...',
    options: ['Efisien', 'Efektif', 'Berguna', 'Cepat', 'Tepat'],
    correctAnswer: 1,
    explanation: 'Mangkus berarti efektif (berhasil guna). Sangkil berarti efisien (berdaya guna).',
    irtParams: { difficulty: -0.5, discrimination: 1.2, guessing: 0.2 }
  },
  {
    id: 'ppu-2',
    category: 'TPS',
    concept: 'Pengetahuan & Pemahaman Umum',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Antonim dari kata "PROGRESIF" adalah...',
    options: ['Agresif', 'Regresif', 'Aktif', 'Pasif', 'Statis'],
    correctAnswer: 1,
    explanation: 'Progresif berarti maju, lawannya adalah regresif yang berarti mundur.',
    irtParams: { difficulty: 0.4, discrimination: 1.3, guessing: 0.2 }
  },
  {
    id: 'ppu-3',
    category: 'TPS',
    concept: 'Pengetahuan & Pemahaman Umum',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Manakah penulisan kata serapan yang benar menurut KBBI?',
    options: ['Analisa', 'Kwitansi', 'Apotik', 'Sistem', 'Praktek'],
    correctAnswer: 3,
    explanation: 'Baku: Analisis, Kuitansi, Apotek, Sistem, Praktik.',
    irtParams: { difficulty: 1.2, discrimination: 1.5, guessing: 0.2 }
  },
  {
    id: 'ppu-4-new',
    category: 'TPS',
    concept: 'Pengetahuan & Pemahaman Umum',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Apa arti dari kata "FILANTROPI"?',
    options: ['Cinta sesama manusia', 'Cinta alam', 'Cinta ilmu', 'Cinta seni', 'Cinta tanah air'],
    correctAnswer: 0,
    explanation: 'Filantropi adalah tindakan seseorang yang mencintai sesama manusia serta nilai kemanusiaan.',
    irtParams: { difficulty: 0.8, discrimination: 1.3, guessing: 0.2 }
  },
  {
    id: 'ppu-5-new',
    category: 'TPS',
    concept: 'Pengetahuan & Pemahaman Umum',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Kata "EKSKAVASI" paling dekat maknanya dengan...',
    options: ['Penelitian', 'Penggalian', 'Penemuan', 'Pelestarian', 'Pemugaran'],
    correctAnswer: 1,
    explanation: 'Ekskavasi adalah penggalian yang dilakukan di tempat yang mengandung benda purbakala.',
    irtParams: { difficulty: 1.2, discrimination: 1.3, guessing: 0.2 }
  },

  // --- TPS: Pemahaman Bacaan & Menulis (PBM) ---
  {
    id: 'pbm-1',
    category: 'TPS',
    concept: 'Pemahaman Bacaan & Menulis',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Kalimat manakah yang merupakan kalimat efektif?',
    options: [
      'Bagi para siswa-siswa diharapkan berkumpul.',
      'Para siswa diharapkan berkumpul.',
      'Untuk mempersingkat waktu, acara segera dimulai.',
      'Ia bekerja demi untuk keluarganya.',
      'Rumah di mana ia tinggal sangat besar.'
    ],
    correctAnswer: 1,
    explanation: 'Opsi B singkat dan padat. Opsi A pleonasme (para + siswa-siswa). Opsi C logisnya waktu dihemat bukan dipersingkat. Opsi D pleonasme (demi + untuk). Opsi E pengaruh bahasa asing (di mana).',
    irtParams: { difficulty: 0.6, discrimination: 1.4, guessing: 0.2 }
  },
  {
    id: 'pbm-2',
    category: 'TPS',
    concept: 'Pemahaman Bacaan & Menulis',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Penulisan kata depan yang benar adalah...',
    options: [
      'Ia pergi keluar kota.',
      'Buku itu diletakkan diatas meja.',
      'Mari kita makan di restoran.',
      'Surat itu dikirim kemana?',
      'Ia berdiri disamping saya.'
    ],
    correctAnswer: 2,
    explanation: 'Kata depan "di", "ke", "dari" ditulis terpisah dari kata yang mengikutinya jika menunjukkan tempat. "di restoran" benar.',
    irtParams: { difficulty: 1.3, discrimination: 1.5, guessing: 0.2 }
  },
  {
    id: 'pbm-3-new',
    category: 'TPS',
    concept: 'Pemahaman Bacaan & Menulis',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Manakah penulisan judul karangan yang benar?',
    options: [
      'Laporan Hasil Observasi Di Hutan Lindung',
      'Laporan Hasil Observasi di Hutan Lindung',
      'Laporan hasil observasi di hutan lindung',
      'Laporan Hasil Observasi Di hutan lindung',
      'LAPORAN HASIL OBSERVASI DI HUTAN LINDUNG'
    ],
    correctAnswer: 1,
    explanation: 'Kata depan "di" dalam judul tidak menggunakan huruf kapital kecuali di awal kalimat.',
    irtParams: { difficulty: 0.5, discrimination: 1.2, guessing: 0.2 }
  },
  {
    id: 'pbm-4-new',
    category: 'TPS',
    concept: 'Pemahaman Bacaan & Menulis',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Manakah kalimat yang tidak memiliki subjek?',
    options: [
      'Di dalam tas itu terdapat buku.',
      'Buku itu ada di dalam tas.',
      'Kepada para peserta diharapkan hadir tepat waktu.',
      'Peserta diharapkan hadir tepat waktu.',
      'A dan C benar.'
    ],
    correctAnswer: 2,
    explanation: 'Kalimat C diawali preposisi "Kepada" sehingga subjeknya hilang (menjadi keterangan). Kalimat A subjeknya "buku".',
    irtParams: { difficulty: 1.6, discrimination: 1.8, guessing: 0.2 }
  },

  // --- TPS: Pengetahuan Kuantitatif (PK) ---
  {
    id: 'pkq-1',
    category: 'TPS',
    concept: 'Pengetahuan Kuantitatif',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Jika x = 3 and y = 4, berapakah nilai dari √(x^2 + y^2)?',
    options: ['5', '7', '12', '25', '1'],
    correctAnswer: 0,
    explanation: '√(3^2 + 4^2) = √(9 + 16) = √25 = 5.',
    irtParams: { difficulty: 0.2, discrimination: 1.2, guessing: 0.2 }
  },
  {
    id: 'pkq-2',
    category: 'TPS',
    concept: 'Pengetahuan Kuantitatif',
    difficulty: 'trap',
    type: 'short_answer',
    question: 'Berapakah luas lingkaran dengan jari-jari 7 cm? (Gunakan π = 22/7)',
    shortAnswerCorrect: 154,
    explanation: 'Luas = π * r^2 = 22/7 * 7 * 7 = 22 * 7 = 154.',
    irtParams: { difficulty: 1.4, discrimination: 1.6, guessing: 0.0 }
  },
  {
    id: 'pkq-3-new',
    category: 'TPS',
    concept: 'Pengetahuan Kuantitatif',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Jika 2^x = 32, berapakah nilai x^2?',
    options: ['16', '25', '36', '49', '64'],
    correctAnswer: 1,
    explanation: '2^5 = 32, jadi x = 5. x^2 = 25.',
    irtParams: { difficulty: 0.4, discrimination: 1.3, guessing: 0.2 }
  },
  {
    id: 'pkq-4-new',
    category: 'TPS',
    concept: 'Pengetahuan Kuantitatif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Jika x^2 - 4x + 3 = 0, maka nilai dari x1 + x2 adalah...',
    options: ['-4', '4', '3', '-3', '1'],
    correctAnswer: 1,
    explanation: 'Rumus jumlah akar: -b/a = -(-4)/1 = 4.',
    irtParams: { difficulty: 1.1, discrimination: 1.5, guessing: 0.2 }
  }
]);
