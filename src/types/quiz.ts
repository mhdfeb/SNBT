export type Difficulty = 'easy' | 'medium' | 'trap';
export type Category = 'TPS' | 'Literasi Indonesia' | 'Literasi Inggris' | 'Penalaran Matematika';
export type Concept = 
  | 'Penalaran Induktif' | 'Penalaran Deduktif' | 'Penalaran Kuantitatif'
  | 'Pengetahuan & Pemahaman Umum' | 'Pemahaman Bacaan & Menulis' | 'Pengetahuan Kuantitatif'
  | 'Literasi Bahasa Indonesia' | 'Literasi Bahasa Inggris' | 'Penalaran Matematika'
  | 'Penalaran Umum' | 'Pengetahuan Umum' | 'Pemahaman Bacaan'
  | 'Literasi Teks' | 'Main Idea' | 'Inference' | 'Vocabulary' | 'Bilangan' | 'Aljabar' | 'Geometri' | 'Data';

export type QuestionType = 'multiple_choice' | 'complex_multiple_choice' | 'short_answer';
export type SourceValidity = 'verified' | 'reviewed' | 'draft';

export interface QuestionBlueprint {
  subtopic: string;
  cognitiveLevel: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
  competencyIndicator: string;
  sourceValidity: SourceValidity;
}

export interface ComplexOption {
  statement: string;
  correct: boolean; // True for Benar/Ya, False for Salah/Tidak
}

export interface Question {
  id: string;
  category: Category;
  concept: Concept;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple_choice
  complexOptions?: ComplexOption[]; // For complex_multiple_choice
  shortAnswerCorrect?: number; // For short_answer (number only)
  correctAnswer?: number; // For multiple_choice (index)
  explanation: string;
  blueprint: QuestionBlueprint;
  irtParams: {
    difficulty: number; // b parameter (-3 to 3)
    discrimination: number; // a parameter (0 to 2)
    guessing: number; // c parameter (0 to 0.25)
  };
}

export interface DistractorStat {
  optionIndex: number;
  selectedCount: number;
  selectedRate: number;
  isEffective: boolean;
}

export interface QuestionPerformanceStat {
  questionId: string;
  attempts: number;
  correctAttempts: number;
  pValue: number;
  highGroupAttempts: number;
  highGroupCorrect: number;
  lowGroupAttempts: number;
  lowGroupCorrect: number;
  discriminationIndex: number;
  optionSelections: number[];
  distractorStats: DistractorStat[];
  flags: string[];
  needsEditorialReview: boolean;
  lastUpdatedAt: string;
}

export interface StudyMaterial {
  id: string;
  concept: Concept;
  category: Category;
  title: string;
  fullContent: string;
  summary: string;
  priority?: 'high' | 'medium' | 'low';
  scoreImpact?: string;
  quick30sSummary?: string;
  revisionNotes?: string[];
  studyBlocks?: {
    id: string;
    title: string;
    coreConcept: string;
    workedExample: string;
    commonMistakes: string[];
    quickExercise: string;
    strategyWhenToUse: string;
    checkpoints: {
      question: string;
      answer: string;
    }[];
  }[];
  sources: { name: string; url: string }[];
}

export interface QuestionHistoryItem {
  attempts: number;
  correct: number;
  lastSeenAt: number;
  lastCorrectAt: number;
  wrongStreak: number;
}

export interface ConceptProfile {
  concept: Concept;
  attempts: number;
  correct: number;
  rollingAccuracy: number;
  confidence: number;
  recentTrend: 'up' | 'down' | 'stable';
  weaknessScore: number;
  lastSeenAt: number;
}

export interface UserProgress {
  completedIds: string[];
  wrongIds: string[];
  streak: number;
  dailyProgress: { [date: string]: number };
  categoryStats: { [key in Category]: { correct: number; total: number } };
  currentDifficulty: Difficulty;
  reports: AssessmentReport[];
  materialMastery: { [concept: string]: { correct: number; total: number } };
  materialMastery: { [concept: string]: number }; // 0-100 per concept
  questionHistory: { [questionId: string]: QuestionHistoryItem };
  conceptProfiles: { [concept: string]: ConceptProfile };
  remedialCycles: RemedialCycle[];
  questionPerformance: { [questionId: string]: QuestionPerformanceStat };
  lastRemedialConcepts?: {
    concept: string;
    accuracy: number;
    materialId?: string;
  }[];
}

export interface AssessmentReport {
  id: string;
  date: string;
  totalScore: number; // IRT Score (0-1000)
  categoryScores: { [key in Category]: number };
  nationalRank: number;
  totalParticipants: number;
  percentile: number;
  materialMastery: { [key in Concept]: number }; // 0-100
  recommendations: {
    ptn: string;
    prodi: string;
    chance: number; // 0-100
  }[];
  prioritizedWeakConcepts: { concept: Concept; score: number }[];
}

export interface RemedialCycle {
  id: string;
  concept: Concept;
  startedAt: string;
  materialReadAt?: string;
  completedAt?: string;
  baselineScore?: number;
  afterScore?: number;
  status: 'started' | 'material_pending' | 'needs_continue' | 'completed';
  remedialConcepts?: {
    concept: string;
    accuracy: number;
    materialId?: string;
  }[];
}

export interface PTN {
  id: string;
  name: string;
  location: string;
  logo: string;
  prodi: Prodi[];
}

export interface Prodi {
  id: string;
  name: string;
  passingGrade: number; // IRT Score
  capacity: number;
  applicants: number;
}

export interface QuizSession {
  mode: 'tryout' | 'mini' | 'daily' | 'drill15' | 'category';
  selectedCategory?: Category;
  questions: Question[];
  currentIdx: number;
  answers: { [questionId: string]: any }; // number for MC, boolean[] for Complex, number for Short
  marked: { [questionId: string]: boolean }; // "Ragu-ragu" state
  startTime: number;
  timePerQuestion: { [questionId: string]: number };
  isSubmitted: boolean;
  subTests?: {
    name: string;
    questionIndices: number[];
    timeLimit: number; // seconds
    expiresAt: number; // absolute timestamp (ms) when this sub-test timer expires; 0 = not yet started
  }[];
  currentSubTestIdx?: number;
  recommendation?: {
    generatedAt: number;
    mode: 'daily' | 'mini' | 'drill15';
    weakestConcepts: Concept[];
    strongestConcepts: Concept[];
    targetConcepts: Concept[];
    reasons: string[];
  };
  remedial?: {
    cycleId: string;
    concept: Concept;
    phase: 'baseline' | 'after';
  };
  packageId?: string;
}
