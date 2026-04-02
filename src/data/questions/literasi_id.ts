import { Question } from '../../types/quiz';
import { withBlueprintMetadata } from './quality';

export const LITERASI_ID_QUESTIONS: Question[] = withBlueprintMetadata([
  // --- Literasi Bahasa Indonesia ---
  {
    id: 'lit-id-1',
    category: 'Literasi Indonesia',
    concept: 'Literasi Bahasa Indonesia',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Teks: "Pemanasan global mengakibatkan mencairnya es di kutub. Hal ini menyebabkan kenaikan permukaan air laut yang mengancam kota-kota pesisir." Ide pokok paragraf tersebut adalah...',
    options: [
      'Mencairnya es di kutub utara',
      'Dampak pemanasan global terhadap permukaan laut',
      'Ancaman bagi kota pesisir',
      'Penyebab air laut naik',
      'Proses terjadinya pemanasan global'
    ],
    correctAnswer: 1,
    explanation: 'Teks menjelaskan hubungan sebab-akibat pemanasan global yang berujung pada kenaikan air laut.',
    irtParams: { difficulty: 0.2, discrimination: 1.2, guessing: 0.2 }
  },
  {
    id: 'lit-id-2',
    category: 'Literasi Indonesia',
    concept: 'Literasi Bahasa Indonesia',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Manakah kalimat yang mengandung majas personifikasi?',
    options: [
      'Wajahnya bersinar seperti rembulan.',
      'Angin malam membisikkan rahasia di telingaku.',
      'Dia bekerja keras membanting tulang.',
      'Suaranya menggelegar membelah angkasa.',
      'Rumahnya sangat besar seperti istana.'
    ],
    correctAnswer: 1,
    explanation: 'Personifikasi memberikan sifat manusia pada benda mati. "Angin membisikkan" adalah contohnya.',
    irtParams: { difficulty: 1.2, discrimination: 1.5, guessing: 0.2 }
  },
  {
    id: 'lit-id-3-new',
    category: 'Literasi Indonesia',
    concept: 'Literasi Bahasa Indonesia',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Teks: "Pemerintah berencana membangun bendungan baru untuk mengatasi kekeringan. Namun, warga khawatir pembangunan tersebut akan menenggelamkan lahan pertanian mereka." Konflik utama dalam teks adalah...',
    options: [
      'Kekeringan yang berkepanjangan',
      'Rencana pembangunan bendungan',
      'Ketidaksetujuan warga terhadap lokasi bendungan',
      'Kekhawatiran warga akan kehilangan lahan',
      'Kegagalan pemerintah dalam sosialisasi'
    ],
    correctAnswer: 3,
    explanation: 'Teks menyoroti pertentangan antara rencana pemerintah dan kekhawatiran warga akan dampak pada lahan mereka.',
    irtParams: { difficulty: 0.6, discrimination: 1.4, guessing: 0.2 }
  },
  {
    id: 'lit-id-4-new',
    category: 'Literasi Indonesia',
    concept: 'Literasi Bahasa Indonesia',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Teks: "Meskipun ekonomi digital tumbuh pesat, kesenjangan akses internet di daerah terpencil masih menjadi kendala serius bagi pemerataan kesejahteraan." Kalimat tersebut menyiratkan bahwa...',
    options: [
      'Ekonomi digital tidak bermanfaat bagi warga desa.',
      'Internet adalah satu-satunya faktor kesejahteraan.',
      'Pemerataan kesejahteraan terhambat oleh infrastruktur digital.',
      'Pemerintah gagal membangun jaringan internet.',
      'Warga daerah terpencil tidak butuh internet.'
    ],
    correctAnswer: 2,
    explanation: 'Teks menghubungkan kesenjangan akses (infrastruktur) dengan kendala pemerataan kesejahteraan.',
    irtParams: { difficulty: 1.4, discrimination: 1.6, guessing: 0.2 }
  },
  {
    id: 'lit-id-6',
    category: 'Literasi Indonesia',
    concept: 'Literasi Bahasa Indonesia',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Ciri khas dari teks prosedur adalah menggunakan kalimat...',
    options: ['Interogatif', 'Imperatif', 'Deklaratif', 'Eksklamatif', 'Persuasif'],
    correctAnswer: 1,
    explanation: 'Teks prosedur menggunakan kalimat imperatif (perintah) untuk memberikan instruksi.',
    irtParams: { difficulty: 1.2, discrimination: 1.3, guessing: 0.2 }
  }
]);
