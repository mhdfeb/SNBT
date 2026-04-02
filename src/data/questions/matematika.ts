import { withBlueprintMetadata } from './quality';
import type { Question } from '../../types/quiz';

export const MATEMATIKA_QUESTIONS: Question[] = withBlueprintMetadata([
  // --- Penalaran Matematika ---
  {
    id: 'pm-1',
    category: 'Penalaran Matematika',
    concept: 'Penalaran Matematika',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Sebuah tangki air berbentuk tabung dengan jari-jari 1m dan tinggi 2m. Jika tangki tersebut diisi air hingga setengahnya, berapakah volume air tersebut? (Gunakan π = 3.14)',
    options: ['3.14 m^3', '6.28 m^3', '1.57 m^3', '12.56 m^3', '4.71 m^3'],
    correctAnswer: 0,
    explanation: 'Volume tabung = π * r^2 * h = 3.14 * 1^2 * 2 = 6.28 m^3. Setengahnya adalah 3.14 m^3.',
    irtParams: { difficulty: 0.5, discrimination: 1.4, guessing: 0.2 }
  },
  {
    id: 'pm-2',
    category: 'Penalaran Matematika',
    concept: 'Penalaran Matematika',
    difficulty: 'trap',
    type: 'short_answer',
    question: 'Jika rata-rata dari lima bilangan adalah 20, dan empat bilangan di antaranya adalah 15, 18, 22, dan 25, berapakah bilangan kelima?',
    shortAnswerCorrect: 20,
    explanation: 'Total = 5 * 20 = 100. Jumlah empat bilangan = 15 + 18 + 22 + 25 = 80. Bilangan kelima = 100 - 80 = 20.',
    irtParams: { difficulty: 1.2, discrimination: 1.6, guessing: 0.0 }
  },
  {
    id: 'pm-3-new',
    category: 'Penalaran Matematika',
    concept: 'Penalaran Matematika',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Sebuah toko memberikan diskon 50% + 20%. Jika harga awal barang adalah 100.000, berapakah harga akhirnya?',
    options: ['30.000', '40.000', '50.000', '70.000', '80.000'],
    correctAnswer: 1,
    explanation: 'Diskon 50% -> 50.000. Diskon 20% dari 50.000 -> 10.000. Harga akhir = 50.000 - 10.000 = 40.000.',
    irtParams: { difficulty: 0.7, discrimination: 1.4, guessing: 0.2 }
  },
  {
    id: 'pm-4-new',
    category: 'Penalaran Matematika',
    concept: 'Penalaran Matematika',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Sebuah kotak berisi 5 bola merah dan 3 bola biru. Jika diambil 2 bola sekaligus secara acak, peluang terambilnya 2 bola merah adalah...',
    options: ['5/28', '10/28', '15/28', '20/28', '25/28'],
    correctAnswer: 1,
    explanation: 'Kombinasi 2 dari 5 = 10. Kombinasi 2 dari 8 = 28. Peluang = 10/28.',
    irtParams: { difficulty: 1.7, discrimination: 1.9, guessing: 0.2 }
  },
  {
    id: 'pm-11',
    category: 'Penalaran Matematika',
    concept: 'Penalaran Matematika',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Berapakah jumlah sudut dalam sebuah segitiga?',
    options: ['90 derajat', '180 derajat', '270 derajat', '360 derajat', '450 derajat'],
    correctAnswer: 1,
    explanation: 'Jumlah sudut dalam segitiga selalu 180 derajat.',
    irtParams: { difficulty: 0.7, discrimination: 1.1, guessing: 0.2 }
  },
  {
    id: 'pm-12',
    category: 'Penalaran Matematika',
    concept: 'Penalaran Matematika',
    difficulty: 'medium',
    type: 'short_answer',
    question: 'Jika sebuah baju seharga Rp 200.000 didiskon 25%, berapakah harga akhirnya?',
    shortAnswerCorrect: 150000,
    explanation: 'Diskon = 0.25 * 200.000 = 50.000. Harga akhir = 150.000.',
    irtParams: { difficulty: 1.0, discrimination: 1.3, guessing: 0.0 }
  },
  {
    id: 'pm-13',
    category: 'Penalaran Matematika',
    concept: 'Penalaran Matematika',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Berapakah peluang munculnya angka genap pada pelemparan sebuah dadu?',
    options: ['1/6', '1/3', '1/2', '2/3', '5/6'],
    correctAnswer: 2,
    explanation: 'Angka genap: 2, 4, 6 (ada 3). Total sisi: 6. Peluang = 3/6 = 1/2.',
    irtParams: { difficulty: 1.3, discrimination: 1.5, guessing: 0.2 }
  }
]);
