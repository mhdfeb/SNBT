import { Question } from '../../types/quiz';
import { withBlueprintMetadata } from './quality';

export const SNBT2025_QUESTIONS: Question[] = withBlueprintMetadata([
  {
    id: 'snbt25-1',
    category: 'TPS',
    concept: 'Penalaran Umum',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Jika x @ y = (x + y) * (x - y), maka nilai dari 10 @ 8 adalah...',
    options: ['36', '18', '2', '80', '64'],
    correctAnswer: 0,
    explanation: '10 @ 8 = (10 + 8) * (10 - 8) = 18 * 2 = 36.',
    irtParams: { difficulty: 0.5, discrimination: 1.4, guessing: 0.2 }
  },
  {
    id: 'snbt25-2',
    category: 'Literasi Indonesia',
    concept: 'Literasi Bahasa Indonesia',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Teks: "Penggunaan kendaraan listrik di Indonesia diprediksi akan meningkat tajam pada tahun 2026 seiring dengan bertambahnya infrastruktur stasiun pengisian daya." Kalimat tersebut mengandung makna...',
    options: [
      'Kepastian penggunaan kendaraan listrik',
      'Prediksi masa depan berdasarkan kondisi infrastruktur',
      'Kritik terhadap lambatnya pembangunan infrastruktur',
      'Himbauan untuk beralih ke kendaraan listrik',
      'Laporan statistik penggunaan kendaraan saat ini'
    ],
    correctAnswer: 1,
    explanation: 'Kata "diprediksi" dan "seiring dengan" menunjukkan adanya perkiraan masa depan yang didasarkan pada suatu kondisi (infrastruktur).',
    irtParams: { difficulty: 1.2, discrimination: 1.6, guessing: 0.2 }
  },
  {
    id: 'snbt25-3',
    category: 'Penalaran Matematika',
    concept: 'Geometri',
    difficulty: 'trap',
    type: 'short_answer',
    question: 'Sebuah taman berbentuk lingkaran memiliki keliling 88 meter. Berapakah luas taman tersebut? (Gunakan π = 22/7)',
    shortAnswerCorrect: 616,
    explanation: 'K = 2πr -> 88 = 2 * 22/7 * r -> 88 = 44/7 * r -> r = 14. Luas = πr^2 = 22/7 * 14 * 14 = 22 * 2 * 14 = 616.',
    irtParams: { difficulty: 1.5, discrimination: 1.8, guessing: 0.0 }
  },
  {
    id: 'snbt25-4',
    category: 'TPS',
    concept: 'Penalaran Kuantitatif',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Jika 2^x = 32 dan 3^y = 81, maka nilai dari x + y adalah...',
    options: ['8', '9', '10', '11', '12'],
    correctAnswer: 1,
    explanation: '2^x = 32 -> 2^5 = 32, jadi x = 5. 3^y = 81 -> 3^4 = 81, jadi y = 4. x + y = 5 + 4 = 9.',
    irtParams: { difficulty: 0.4, discrimination: 1.2, guessing: 0.2 }
  },
  {
    id: 'snbt25-5',
    category: 'Literasi Inggris',
    concept: 'Literasi Bahasa Inggris',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Passage: "The rapid urbanization in developing countries has led to significant environmental challenges, including air pollution and loss of green spaces." What is the main idea of the passage?',
    options: [
      'The benefits of urbanization',
      'Environmental issues caused by rapid urbanization',
      'The importance of green spaces',
      'Urban planning in developing countries',
      'Air pollution statistics'
    ],
    correctAnswer: 1,
    explanation: 'The passage focuses on how rapid urbanization leads to environmental challenges like pollution and loss of green spaces.',
    irtParams: { difficulty: 1.1, discrimination: 1.5, guessing: 0.2 }
  }
]);
