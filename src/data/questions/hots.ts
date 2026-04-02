import { QuestionBankItem } from '../../types/quiz';

export const HOTS_QUESTIONS: QuestionBankItem[] = [
import { Question } from '../../types/quiz';
import { withBlueprintMetadata } from './quality';

export const HOTS_QUESTIONS: Question[] = withBlueprintMetadata([
  // --- HOTS: Penalaran Induktif ---
  {
    id: 'pi-hots-1',
    category: 'TPS',
    concept: 'Penalaran Induktif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Perhatikan urutan: 2, 6, 12, 20, 30, ... Pola apa yang paling tepat menggambarkan urutan ini?',
    options: [
      'n^2 + n',
      '2n + 4',
      'n^2 + 1',
      'n(n+1)',
      'Opsi A dan D benar'
    ],
    correctAnswer: 4,
    explanation: 'Pola adalah n(n+1) atau n^2 + n. Untuk n=1: 1(2)=2. n=2: 2(3)=6. n=3: 3(4)=12. n=4: 4(5)=20. n=5: 5(6)=30.',
    irtParams: { difficulty: 2.5, discrimination: 2.0, guessing: 0.2 }
  },
  {
    id: 'pi-hots-2',
    category: 'TPS',
    concept: 'Penalaran Induktif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Amati pola: 1, 3, 7, 15, 31, ... Berapakah selisih antara angka ke-7 dan angka ke-6?',
    options: ['32', '64', '128', '63', '127'],
    correctAnswer: 1,
    explanation: 'Pola adalah 2^n - 1. Angka ke-6 adalah 2^6 - 1 = 63. Angka ke-7 adalah 2^7 - 1 = 127. Selisihnya adalah 127 - 63 = 64. Atau perhatikan pola selisih: +2, +4, +8, +16, +32... selisih berikutnya adalah 64.',
    irtParams: { difficulty: 2.2, discrimination: 1.8, guessing: 0.2 }
  },
  // --- HOTS: Penalaran Deduktif ---
  {
    id: 'pd-hots-1',
    category: 'TPS',
    concept: 'Penalaran Deduktif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Jika semua politisi jujur, maka negara akan makmur. Negara tidak makmur. Namun, diketahui bahwa beberapa politisi sebenarnya jujur. Kesimpulan yang paling logis adalah...',
    options: [
      'Semua politisi tidak jujur',
      'Beberapa politisi tidak jujur',
      'Kejujuran politisi tidak menjamin kemakmuran',
      'Negara akan makmur jika semua politisi jujur',
      'Tidak ada hubungan antara kejujuran dan kemakmuran'
    ],
    correctAnswer: 1,
    explanation: 'Dari "Jika semua jujur -> makmur" dan "Tidak makmur", kita simpulkan "Tidak semua politisi jujur". Karena diketahui "Beberapa jujur", maka kesimpulan yang pasti adalah "Beberapa politisi tidak jujur".',
    irtParams: { difficulty: 2.8, discrimination: 2.2, guessing: 0.2 }
  },
  {
    id: 'pd-hots-2',
    category: 'TPS',
    concept: 'Penalaran Deduktif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Premis 1: Jika semua kucing suka ikan, maka tidak ada anjing yang suka ikan. Premis 2: Ada anjing yang suka ikan. Kesimpulan yang paling tepat adalah...',
    options: [
      'Semua kucing tidak suka ikan',
      'Beberapa kucing tidak suka ikan',
      'Semua anjing suka ikan',
      'Kucing dan anjing sama-sama suka ikan',
      'Tidak ada kesimpulan yang valid'
    ],
    correctAnswer: 1,
    explanation: 'Menggunakan Modus Tollens: p → q, ~q ∴ ~p. p = "Semua kucing suka ikan", q = "Tidak ada anjing yang suka ikan". Karena ada anjing yang suka ikan (~q), maka kesimpulannya adalah "Tidak semua kucing suka ikan", yang berarti "Beberapa kucing tidak suka ikan".',
    irtParams: { difficulty: 2.5, discrimination: 2.0, guessing: 0.2 }
  },
  // --- HOTS: Pengetahuan Kuantitatif ---
  {
    id: 'pk-hots-1',
    category: 'TPS',
    concept: 'Pengetahuan Kuantitatif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Jika f(x) = ax + b, f(1) = 5, dan f(2) = 8, berapakah nilai f(10)?',
    options: ['29', '32', '35', '38', '41'],
    correctAnswer: 1,
    explanation: 'f(1)=a+b=5. f(2)=2a+b=8. Kurangkan: a=3. Maka b=2. f(x)=3x+2. f(10)=3(10)+2=32.',
    irtParams: { difficulty: 2.0, discrimination: 1.8, guessing: 0.2 }
  },
  {
    id: 'pk-hots-2',
    category: 'TPS',
    concept: 'Penalaran Kuantitatif',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Pekerjaan membangun jembatan dapat diselesaikan oleh 12 orang dalam waktu 20 hari. Setelah bekerja selama 8 hari, pekerjaan terhenti selama 4 hari. Agar jembatan selesai tepat waktu, berapa banyak tambahan pekerja yang diperlukan?',
    options: ['4 orang', '6 orang', '8 orang', '10 orang', '12 orang'],
    correctAnswer: 1,
    explanation: 'Total beban kerja = 12 * 20 = 240 orang-hari. Sisa beban setelah 8 hari = 240 - (12 * 8) = 240 - 96 = 144 orang-hari. Sisa waktu normal = 20 - 8 = 12 hari. Karena terhenti 4 hari, sisa waktu tersedia = 12 - 4 = 8 hari. Pekerja yang dibutuhkan = 144 / 8 = 18 orang. Tambahan pekerja = 18 - 12 = 6 orang.',
    irtParams: { difficulty: 2.3, discrimination: 1.9, guessing: 0.2 }
  },
  // --- HOTS: Penalaran Matematika ---
  {
    id: 'pm-hots-1',
    category: 'Penalaran Matematika',
    concept: 'Penalaran Matematika',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Dalam sebuah kelas, 60% siswa adalah perempuan. Jika 25% dari siswa laki-laki menyukai basket dan ada 6 siswa laki-laki yang menyukai basket, berapakah total siswa di kelas tersebut?',
    options: ['40', '60', '80', '100', '120'],
    correctAnswer: 1,
    explanation: 'Laki-laki = 40%. 25% dari Laki-laki = 6 -> Laki-laki = 6 / 0.25 = 24. Jika 40% = 24, maka 100% = 24 / 0.4 = 60.',
    irtParams: { difficulty: 2.4, discrimination: 2.1, guessing: 0.2 }
  },
  {
    id: 'pm-hots-2',
    category: 'Penalaran Matematika',
    concept: 'Geometri',
    difficulty: 'trap',
    type: 'short_answer',
    question: 'Sebuah tabung memiliki jari-jari r dan tinggi h. Jika jari-jari tabung tersebut diperbesar menjadi 2r dan tingginya diperkecil menjadi 1/2h, berapakah perbandingan volume tabung baru terhadap volume tabung lama? (Tuliskan dalam angka saja, misal jika perbandingannya 2:1 tulis 2)',
    shortAnswerCorrect: 2,
    explanation: 'V_lama = πr^2h. V_baru = π(2r)^2(1/2h) = π(4r^2)(1/2h) = 2πr^2h. V_baru / V_lama = 2.',
    irtParams: { difficulty: 2.6, discrimination: 2.3, guessing: 0.0 }
  },
  {
    id: 'li-hots-1',
    category: 'Literasi Indonesia',
    concept: 'Literasi Bahasa Indonesia',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Teks: "Meskipun pemerintah telah mengalokasikan dana besar untuk subsidi energi, efektivitasnya masih dipertanyakan karena distribusi yang tidak tepat sasaran." Kalimat tersebut menyiratkan bahwa...',
    options: [
      'Pemerintah gagal dalam mengelola dana subsidi',
      'Subsidi energi tidak diperlukan lagi',
      'Dana besar menjamin keberhasilan program',
      'Distribusi adalah faktor kunci efektivitas subsidi',
      'Masyarakat tidak puas dengan subsidi energi'
    ],
    correctAnswer: 3,
    explanation: 'Kalimat tersebut menekankan bahwa meskipun dana besar, efektivitas dipertanyakan KARENA distribusi tidak tepat sasaran. Ini menyiratkan bahwa distribusi adalah faktor penentu efektivitas.',
    irtParams: { difficulty: 2.2, discrimination: 1.8, guessing: 0.2 }
  }
]);
