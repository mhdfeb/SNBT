import { Question, QuestionQualityMetadata, CognitiveLevel, ItemLifecycleStatus } from '../types/quiz';
import { TPS_QUESTIONS } from './questions/tps';
import { LITERASI_ID_QUESTIONS } from './questions/literasi_id';
import { LITERASI_EN_QUESTIONS } from './questions/literasi_en';
import { MATEMATIKA_QUESTIONS } from './questions/matematika';
import { HOTS_QUESTIONS } from './questions/hots';
import { SNBT2025_QUESTIONS } from './questions/snbt2025';

type QuestionSeed = Omit<Question, 'qualityMetadata'>;

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
  'Inference': 'Penarikan simpulan implisit dari teks',
  'Vocabulary': 'Makna kata dalam konteks',
  'Bilangan': 'Operasi bilangan dan pola numerik',
  'Aljabar': 'Persamaan, fungsi, dan manipulasi simbolik',
  'Geometri': 'Bangun datar/ruang dan relasi sudut',
  'Data': 'Statistika dasar dan interpretasi grafik'
};

const COGNITIVE_LEVEL_BY_DIFFICULTY: Record<Question['difficulty'], CognitiveLevel> = {
  easy: 'understand',
  medium: 'apply',
  trap: 'analyze'
};

const COMPETENCY_GOAL_BY_CATEGORY: Record<Question['category'], string> = {
  TPS: 'Menguji penalaran umum untuk pengambilan keputusan berbasis logika.',
  'Literasi Indonesia': 'Menguji kemampuan memahami, menilai, dan menyimpulkan teks Indonesia.',
  'Literasi Inggris': 'Menguji kemampuan reading comprehension akademik bahasa Inggris.',
  'Penalaran Matematika': 'Menguji pemodelan masalah kuantitatif dan justifikasi solusi matematika.'
};

const LIFECYCLE_OVERRIDES: Record<string, ItemLifecycleStatus> = {
  'pi-hots-1': 'reviewed',
  'pi-hots-2': 'reviewed',
  'pd-hots-1': 'reviewed',
  'snbt25-1': 'draft',
  'snbt25-2': 'draft',
  'snbt25-5': 'deprecated'
};

function inferLifecycleStatus(question: QuestionSeed): ItemLifecycleStatus {
  if (LIFECYCLE_OVERRIDES[question.id]) return LIFECYCLE_OVERRIDES[question.id];
  return 'active';
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
  }));
}

export const QUESTIONS: Question[] = withQualityMetadata([
  ...TPS_QUESTIONS,
  ...LITERASI_ID_QUESTIONS,
  ...LITERASI_EN_QUESTIONS,
  ...MATEMATIKA_QUESTIONS,
  ...HOTS_QUESTIONS,
  ...SNBT2025_QUESTIONS
]);
