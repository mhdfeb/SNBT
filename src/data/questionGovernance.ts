import { Question } from '../types/quiz';

export type ValidityStatus = 'valid_snbt_like' | 'needs_revision' | 'retired';

export interface BlueprintTopicRule {
  topic: string;
  minShare: number;
  maxShare: number;
}

export interface SubtestBlueprint {
  subtest: string;
  category: Question['category'];
  quota: number;
  stimulusTypes: Array<Question['type']>;
  readingLength: 'short' | 'medium' | 'long' | 'mixed';
  complexityTarget: {
    easy: number;
    medium: number;
    trap: number;
  };
  trapTypes: string[];
  topicRules: BlueprintTopicRule[];
}

export interface QuestionAudit {
  questionId: string;
  status: ValidityStatus;
  reasons: string[];
}

export interface TryoutAuditResult {
  subtest: string;
  quota: number;
  validCount: number;
  selectedIds: string[];
  flagged: QuestionAudit[];
  coverageOk: boolean;
}

const CONCEPT_TO_SUBTEST: Record<string, string> = {
  'Penalaran Umum': 'Penalaran Induktif',
  'Geometri': 'Penalaran Matematika',
};

const NEEDS_REVISION_IDS = new Set<string>([
  'pd-5', // valid logika formal tapi konteks premis faktual terlalu eksplisit
  'snbt25-1', // konsep terlalu umum, perlu stimulus lebih panjang
]);

const RETIRED_IDS = new Set<string>([
  'pk-1', // terlalu elementer untuk tekanan SNBT
]);

export const SUBTEST_BLUEPRINTS: SubtestBlueprint[] = [
  {
    subtest: 'Penalaran Induktif',
    category: 'TPS',
    quota: 10,
    stimulusTypes: ['multiple_choice', 'complex_multiple_choice'],
    readingLength: 'short',
    complexityTarget: { easy: 0.2, medium: 0.5, trap: 0.3 },
    trapTypes: ['pola semu', 'counter-example', 'generalisasi berlebih'],
    topicRules: [
      { topic: 'deret/pola', minShare: 0.4, maxShare: 0.7 },
      { topic: 'analogi/verbal', minShare: 0.2, maxShare: 0.4 },
      { topic: 'kaidah umum', minShare: 0.1, maxShare: 0.3 },
    ],
  },
  {
    subtest: 'Penalaran Deduktif',
    category: 'TPS',
    quota: 10,
    stimulusTypes: ['multiple_choice', 'complex_multiple_choice'],
    readingLength: 'medium',
    complexityTarget: { easy: 0.15, medium: 0.55, trap: 0.3 },
    trapTypes: ['fallacy', 'negasi keliru', 'konversi implikasi'],
    topicRules: [
      { topic: 'silogisme', minShare: 0.4, maxShare: 0.6 },
      { topic: 'implikasi', minShare: 0.3, maxShare: 0.5 },
      { topic: 'set/logika himpunan', minShare: 0.1, maxShare: 0.3 },
    ],
  },
  {
    subtest: 'Penalaran Kuantitatif',
    category: 'TPS',
    quota: 10,
    stimulusTypes: ['multiple_choice', 'short_answer'],
    readingLength: 'short',
    complexityTarget: { easy: 0.2, medium: 0.5, trap: 0.3 },
    trapTypes: ['persentase bertingkat', 'rasio menipu', 'satuan tersembunyi'],
    topicRules: [
      { topic: 'aljabar aritmetika', minShare: 0.3, maxShare: 0.5 },
      { topic: 'persentase/rasio', minShare: 0.2, maxShare: 0.4 },
      { topic: 'eksponen/log', minShare: 0.1, maxShare: 0.3 },
    ],
  },
  {
    subtest: 'Pengetahuan & Pemahaman Umum',
    category: 'TPS',
    quota: 20,
    stimulusTypes: ['multiple_choice'],
    readingLength: 'medium',
    complexityTarget: { easy: 0.15, medium: 0.55, trap: 0.3 },
    trapTypes: ['distraktor faktual mirip', 'ruang lingkup konsep'],
    topicRules: [
      { topic: 'wacana sosial', minShare: 0.3, maxShare: 0.5 },
      { topic: 'sains populer', minShare: 0.2, maxShare: 0.4 },
      { topic: 'civic/nilai', minShare: 0.2, maxShare: 0.3 },
    ],
  },
  {
    subtest: 'Pemahaman Bacaan & Menulis',
    category: 'TPS',
    quota: 20,
    stimulusTypes: ['multiple_choice', 'complex_multiple_choice'],
    readingLength: 'long',
    complexityTarget: { easy: 0.1, medium: 0.6, trap: 0.3 },
    trapTypes: ['inferensi lemah', 'rujukan kata ganti', 'parafrase menyesatkan'],
    topicRules: [
      { topic: 'main idea', minShare: 0.25, maxShare: 0.35 },
      { topic: 'inferensi', minShare: 0.25, maxShare: 0.35 },
      { topic: 'struktur kalimat', minShare: 0.15, maxShare: 0.25 },
    ],
  },
  {
    subtest: 'Pengetahuan Kuantitatif',
    category: 'TPS',
    quota: 15,
    stimulusTypes: ['multiple_choice', 'short_answer'],
    readingLength: 'medium',
    complexityTarget: { easy: 0.2, medium: 0.5, trap: 0.3 },
    trapTypes: ['interpretasi grafik', 'pemodelan salah', 'jebakan asumsi linear'],
    topicRules: [
      { topic: 'data & grafik', minShare: 0.35, maxShare: 0.5 },
      { topic: 'aritmetika sosial', minShare: 0.2, maxShare: 0.35 },
      { topic: 'probabilitas dasar', minShare: 0.1, maxShare: 0.2 },
    ],
  },
  {
    subtest: 'Literasi Bahasa Indonesia',
    category: 'Literasi Indonesia',
    quota: 30,
    stimulusTypes: ['multiple_choice', 'complex_multiple_choice'],
    readingLength: 'long',
    complexityTarget: { easy: 0.1, medium: 0.6, trap: 0.3 },
    trapTypes: ['implikatur', 'nuansa diksi', 'koherensi paragraf'],
    topicRules: [
      { topic: 'pemahaman teks', minShare: 0.4, maxShare: 0.6 },
      { topic: 'evaluasi argumen', minShare: 0.2, maxShare: 0.35 },
      { topic: 'kebahasaan', minShare: 0.15, maxShare: 0.25 },
    ],
  },
  {
    subtest: 'Literasi Bahasa Inggris',
    category: 'Literasi Inggris',
    quota: 20,
    stimulusTypes: ['multiple_choice', 'complex_multiple_choice'],
    readingLength: 'medium',
    complexityTarget: { easy: 0.1, medium: 0.6, trap: 0.3 },
    trapTypes: ['near-synonym trap', 'scope mismatch', 'tone mismatch'],
    topicRules: [
      { topic: 'main idea', minShare: 0.3, maxShare: 0.45 },
      { topic: 'inference', minShare: 0.25, maxShare: 0.4 },
      { topic: 'vocabulary in context', minShare: 0.15, maxShare: 0.25 },
    ],
  },
  {
    subtest: 'Penalaran Matematika',
    category: 'Penalaran Matematika',
    quota: 20,
    stimulusTypes: ['multiple_choice', 'short_answer'],
    readingLength: 'medium',
    complexityTarget: { easy: 0.15, medium: 0.55, trap: 0.3 },
    trapTypes: ['aljabar multi-langkah', 'restriksi domain', 'interpretasi geometri'],
    topicRules: [
      { topic: 'aljabar', minShare: 0.35, maxShare: 0.5 },
      { topic: 'geometri', minShare: 0.2, maxShare: 0.35 },
      { topic: 'data/probabilitas', minShare: 0.1, maxShare: 0.2 },
    ],
  },
];

export function resolveSubtest(question: Question): string {
  return CONCEPT_TO_SUBTEST[question.concept] ?? question.concept;
}

export function assessQuestionValidity(question: Question): QuestionAudit {
  const reasons: string[] = [];

  if (RETIRED_IDS.has(question.id)) {
    reasons.push('retired_by_editorial_decision');
    return { questionId: question.id, status: 'retired', reasons };
  }

  if (NEEDS_REVISION_IDS.has(question.id)) reasons.push('manual_needs_revision');

  if (question.difficulty === 'easy' && question.irtParams.difficulty <= -1.5) {
    reasons.push('too_easy_for_tryout_pressure');
  }

  if (question.question.length < 45 && question.category !== 'TPS') {
    reasons.push('stimulus_too_short_for_literacy_or_math_reasoning');
  }

  if (question.type === 'multiple_choice' && (!question.options || question.options.length < 4)) {
    reasons.push('distractor_count_below_standard');
  }

  if (question.explanation.trim().length < 35) {
    reasons.push('rationale_too_brief_potential_ambiguity');
  }

  if (reasons.length === 0) {
    return { questionId: question.id, status: 'valid_snbt_like', reasons };
  }

  const forcedRevisionOnly = reasons.every(reason =>
    ['manual_needs_revision', 'too_easy_for_tryout_pressure', 'stimulus_too_short_for_literacy_or_math_reasoning', 'rationale_too_brief_potential_ambiguity'].includes(reason)
  );

  return {
    questionId: question.id,
    status: forcedRevisionOnly ? 'needs_revision' : 'retired',
    reasons,
  };
}

export function buildQuestionBankBySubtest(questions: Question[]) {
  return questions.reduce<Record<string, Question[]>>((acc, q) => {
    const subtest = resolveSubtest(q);
    if (!acc[subtest]) acc[subtest] = [];
    acc[subtest].push(q);
    return acc;
  }, {});
}

export function auditTryoutPackages(questions: Question[]): TryoutAuditResult[] {
  const grouped = buildQuestionBankBySubtest(questions);

  return SUBTEST_BLUEPRINTS.map((blueprint) => {
    const pool = grouped[blueprint.subtest] ?? [];
    const audits = pool.map(assessQuestionValidity);
    const valid = pool.filter((q) => assessQuestionValidity(q).status === 'valid_snbt_like');

    return {
      subtest: blueprint.subtest,
      quota: blueprint.quota,
      validCount: valid.length,
      selectedIds: valid.slice(0, blueprint.quota).map((q) => q.id),
      flagged: audits.filter((a) => a.status !== 'valid_snbt_like'),
      coverageOk: valid.length >= Math.max(1, Math.floor(blueprint.quota * 0.4)),
    };
  });
}

export function getValidQuestionsForSubtest(questions: Question[], subtest: string): Question[] {
  return questions.filter((q) => resolveSubtest(q) === subtest && assessQuestionValidity(q).status === 'valid_snbt_like');
}
