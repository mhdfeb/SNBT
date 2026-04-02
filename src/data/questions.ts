import {
  CognitiveLevel,
  EditorialMetadata,
  ItemLifecycleStatus,
  Question,
  QuestionQualityMetadata,
} from '../types/quiz';
import { TPS_QUESTIONS } from './questions/tps';
import { LITERASI_ID_QUESTIONS } from './questions/literasi_id';
import { LITERASI_EN_QUESTIONS } from './questions/literasi_en';
import { MATEMATIKA_QUESTIONS } from './questions/matematika';
import { HOTS_QUESTIONS } from './questions/hots';
import { SNBT2025_QUESTIONS } from './questions/snbt2025';
import {
  SUBTEST_BLUEPRINTS,
  buildQuestionBankBySubtest,
  auditTryoutPackages,
  assessQuestionValidity,
} from './questionGovernance';

const DEFAULT_EDITORIAL_CHECKLIST = {
  stemClarity: true,
  optionQuality: true,
  singleBestAnswer: true,
  answerKeyRationale: true,
};

const QUESTION_EDITORIAL_METADATA: Record<string, EditorialMetadata> = {
  'pi-1': {
    author: 'Tim Konten SNBT',
    reviewer: 'Lead Reviewer TPS',
    reviewedAt: '2026-03-15',
    checklist: DEFAULT_EDITORIAL_CHECKLIST,
    revisionLog: [
      {
        revisionDate: '2026-03-15',
        author: 'Tim Konten SNBT',
        reviewer: 'Lead Reviewer TPS',
        changeSummary: 'Standardisasi format stem dan penjelasan kunci jawaban.',
      },
    ],
  },
};

type QuestionSeed = Omit<Question, 'qualityMetadata' | 'editorial'>;

const SUBTOPIC_BY_CONCEPT: Record<Question['concept'], string> = {
  'Penalaran Induktif': 'Pola, analogi, dan generalisasi',
  'Penalaran Deduktif': 'Silogisme, implikasi, dan kontraposisi',
  'Penalaran Kuantitatif': 'Estimasi, rasio, dan kuantifikasi',
  'Pengetahuan & Pemahaman Umum': 'Wawasan kebangsaan dan isu kontemporer',
  'Pemahaman Bacaan & Menulis': 'Analisis bacaan argumentatif',
  'Pengetahuan Kuantitatif': 'Aritmetika, perbandingan, dan persentase',
  'Literasi Bahasa Indonesia': 'Interpretasi teks bahasa Indonesia',
  'Literasi Bahasa Inggris': 'Reading comprehension bahasa Inggris',
  'Penalaran Matematika': 'Problem solving matematika kontekstual',
  'Penalaran Umum': 'Analisis logika dan argumen',
  'Pengetahuan Umum': 'Fakta sosial, sejarah, dan sains populer',
  'Pemahaman Bacaan': 'Menentukan ide pokok dan inferensi',
  'Literasi Teks': 'Koherensi, kohesi, dan struktur wacana',
  'Main Idea': 'Identifikasi gagasan utama paragraf',
  Inference: 'Penarikan simpulan implisit dari teks',
  Vocabulary: 'Makna kata dalam konteks',
  Bilangan: 'Operasi bilangan dan pola numerik',
  Aljabar: 'Persamaan, fungsi, dan manipulasi simbolik',
  Geometri: 'Bangun datar/ruang dan relasi sudut',
  Data: 'Statistika dasar dan interpretasi grafik',
};

const COGNITIVE_LEVEL_BY_DIFFICULTY: Record<Question['difficulty'], CognitiveLevel> = {
  easy: 'understand',
  medium: 'apply',
  trap: 'analyze',
};

const COMPETENCY_GOAL_BY_CATEGORY: Record<Question['category'], string> = {
  TPS: 'Menguji penalaran umum untuk pengambilan keputusan berbasis logika.',
  'Literasi Indonesia': 'Menguji kemampuan memahami, menilai, dan menyimpulkan teks Indonesia.',
  'Literasi Inggris': 'Menguji kemampuan reading comprehension akademik bahasa Inggris.',
  'Penalaran Matematika': 'Menguji pemodelan masalah kuantitatif dan justifikasi solusi matematika.',
};

const LIFECYCLE_OVERRIDES: Record<string, ItemLifecycleStatus> = {
  'pi-hots-1': 'reviewed',
  'pi-hots-2': 'reviewed',
  'pd-hots-1': 'reviewed',
  'snbt25-1': 'draft',
  'snbt25-2': 'draft',
  'snbt25-5': 'deprecated',
};

const FALLBACK_EDITORIAL_METADATA: EditorialMetadata = {
  author: 'Tim Konten SNBT',
  reviewer: 'Reviewer Belum Ditentukan',
  reviewedAt: '2026-01-01',
  checklist: DEFAULT_EDITORIAL_CHECKLIST,
  revisionLog: [
    {
      revisionDate: '2026-01-01',
      author: 'Tim Konten SNBT',
      reviewer: 'Reviewer Belum Ditentukan',
      changeSummary: 'Migrasi metadata editorial awal.',
    },
  ],
};

function inferLifecycleStatus(question: QuestionSeed): ItemLifecycleStatus {
  return LIFECYCLE_OVERRIDES[question.id] ?? 'active';
}

function buildQualityMetadata(question: QuestionSeed): QuestionQualityMetadata {
  return {
    subtopic: SUBTOPIC_BY_CONCEPT[question.concept],
    cognitiveLevel: COGNITIVE_LEVEL_BY_DIFFICULTY[question.difficulty],
    targetDifficulty: question.difficulty,
    competencyGoal: COMPETENCY_GOAL_BY_CATEGORY[question.category],
    lifecycleStatus: inferLifecycleStatus(question),
  };
}

function withQualityMetadata(questionBank: QuestionSeed[]): Question[] {
  return questionBank.map((question) => ({
    ...question,
    qualityMetadata: buildQualityMetadata(question),
    editorial: QUESTION_EDITORIAL_METADATA[question.id] ?? FALLBACK_EDITORIAL_METADATA,
  }));
}

function uniqueById(questionBank: QuestionSeed[]): QuestionSeed[] {
  return Array.from(new Map(questionBank.map((question) => [question.id, question])).values());
}

const QUESTION_SEEDS: QuestionSeed[] = uniqueById([
  ...TPS_QUESTIONS,
  ...LITERASI_ID_QUESTIONS,
  ...LITERASI_EN_QUESTIONS,
  ...MATEMATIKA_QUESTIONS,
  ...HOTS_QUESTIONS,
  ...SNBT2025_QUESTIONS,
]);

export const QUESTIONS: Question[] = withQualityMetadata(QUESTION_SEEDS);

export const QUESTIONS_BY_SUBTEST = buildQuestionBankBySubtest(QUESTIONS);

export const QUESTION_VALIDITY = Object.fromEntries(
  QUESTIONS.map((question) => [question.id, assessQuestionValidity(question)]),
);

export const TRYOUT_BLUEPRINT = SUBTEST_BLUEPRINTS;

export const TRYOUT_AUDIT = auditTryoutPackages(QUESTIONS);

// Bank simulasi ketat dipisahkan agar pola latihan harian tidak overfit ke soal ujian
export const SIMULATION_QUESTION_BANK: Question[] = withQualityMetadata([
  ...uniqueById([...HOTS_QUESTIONS, ...SNBT2025_QUESTIONS]),
]);

export const TRAINING_QUESTION_BANK: Question[] = withQualityMetadata([
  ...uniqueById([
    ...TPS_QUESTIONS,
    ...LITERASI_ID_QUESTIONS,
    ...LITERASI_EN_QUESTIONS,
    ...MATEMATIKA_QUESTIONS,
  ]),
]);
