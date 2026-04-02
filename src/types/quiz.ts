export type Difficulty = 'easy' | 'medium' | 'trap';
export type Category = 'TPS' | 'Literasi Indonesia' | 'Literasi Inggris' | 'Penalaran Matematika';
export type Concept = 
  | 'Penalaran Induktif' | 'Penalaran Deduktif' | 'Penalaran Kuantitatif'
  | 'Pengetahuan & Pemahaman Umum' | 'Pemahaman Bacaan & Menulis' | 'Pengetahuan Kuantitatif'
  | 'Literasi Bahasa Indonesia' | 'Literasi Bahasa Inggris' | 'Penalaran Matematika'
  | 'Penalaran Umum' | 'Pengetahuan Umum' | 'Pemahaman Bacaan'
  | 'Literasi Teks' | 'Main Idea' | 'Inference' | 'Vocabulary' | 'Bilangan' | 'Aljabar' | 'Geometri' | 'Data';

export type QuestionType = 'multiple_choice' | 'complex_multiple_choice' | 'short_answer';
export type CognitiveLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
export type ItemLifecycleStatus = 'draft' | 'reviewed' | 'active' | 'deprecated';
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

export type QuestionValidityStatus = 'valid_snbt_like' | 'needs_revision' | 'retired';
export interface QuestionQualityMetadata {
  subtopic: string;
  cognitiveLevel: CognitiveLevel;
  targetDifficulty: Difficulty;
  competencyGoal: string;
  lifecycleStatus: ItemLifecycleStatus;
}

export interface Question {
  id: string;
  category: Category;
  concept: Concept;
  difficulty: Difficulty;
  qualityMetadata: QuestionQualityMetadata;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple_choice
  complexOptions?: ComplexOption[]; // For complex_multiple_choice
  shortAnswerCorrect?: number; // For short_answer (number only)
  correctAnswer?: number; // For multiple_choice (index)
  explanation: string;
  validityStatus?: QuestionValidityStatus;
  blueprint: QuestionBlueprint;
  irtParams: {
    difficulty: number; // b parameter (-3 to 3)
    discrimination: number; // a parameter (0 to 2)
    guessing: number; // c parameter (0 to 0.25)
  };
  editorial?: EditorialMetadata;
}

export interface EditorialChecklist {
  stemClarity: boolean;
  optionQuality: boolean;
  singleBestAnswer: boolean;
  answerKeyRationale: boolean;
}

export interface RevisionLogEntry {
  revisionDate: string;
  author: string;
  reviewer: string;
  changeSummary: string;
}

export interface EditorialMetadata {
  author: string;
  reviewer: string;
  reviewedAt: string;
  checklist: EditorialChecklist;
  revisionLog: RevisionLogEntry[];
}

export type QuestionBankItem = Omit<Question, 'qualityMetadata'>;

export interface DistractorOptionPerformance {
  optionIndex: number;
  selectedCount: number;
  selectedByIncorrect: number;
  selectedByCorrect: number;
}

export interface ItemPerformance {
  attempts: number;
  correct: number;
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
  discriminationProxy: number;
  distractorStats: DistractorOptionPerformance[];
  distractorEffectiveness: number;
  flaggedIssue: string[];
  isExcludedFromAdaptive: boolean;
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
  learningBlocks: {
    id: string;
    type: 'core_concept' | 'worked_example' | 'common_trap' | 'quick_drill';
    title: string;
    content: string;
    checkpoints: {
      id: string;
      prompt: string;
      focus: string;
    }[];
    quickRevision?: string;
  }[];
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

export interface UserTarget {
  ptnId: string;
  prodiId: string;
}

export interface SubTestHistoryEntry {
  date: string;
  scores: { [key in Category]: number };
  consistency: number; // 0-100, semakin tinggi semakin stabil
}

export interface UserProgress {
  storageVersion: number;
  completedIds: string[];
  wrongIds: string[];
  streak: number;
  qualityStreak: number;
  qualityDays: { [date: string]: boolean };
  dailyProgress: { [date: string]: number };
  categoryStats: { [key in Category]: { correct: number; total: number } };
  currentDifficulty: Difficulty;
  reports: AssessmentReport[];
  materialMastery: { [concept: string]: { correct: number; total: number } };
  materialMastery: { [concept: string]: number }; // 0-100 per concept
  subTestHistory: { [subTestName: string]: SubTestHistoryEntry[] };
  questionUsage: { [questionId: string]: { shownCount: number; lastShownAt: string | null } };
  questionPerformance: { [questionId: string]: { attempts: number; wrong: number } };
  target?: UserTarget;
  subTestHistory: SubTestHistoryEntry[];
  conceptLastSeen: { [concept: string]: string }; // ISO datetime
  conceptHistory?: { [concept: string]: boolean[] };
  conceptReviewState?: {
    [concept: string]: {
      nextReviewAt: string;
      intervalDays: number;
      easeFactor: number;
      lastReviewedAt: string;
    };
  };
  strategyOutcomes?: {
    [key in QuizStrategy]?: {
      attempts: number;
      correct: number;
      total: number;
      avgAccuracy: number;
    };
  };
}

export type QuizStrategy = 'remediation' | 'retention' | 'exam_simulation';

export interface SessionRecommendation {
  strategy: QuizStrategy;
  reason: string;
  weight: number;
  itemPerformance: Record<string, ItemPerformance>;
  conceptMetrics: { [key in Concept]?: ConceptLongitudinalMetrics };
}

export interface ConceptLongitudinalMetrics {
  totalAttempts: number;
  totalCorrect: number;
  rollingAccuracy: number; // 0-1 EWMA
  recentTrend: number; // -1 to 1 (positive = improving)
  confidenceBand: {
    low: number; // 0-1
    high: number; // 0-1
  };
  history: Array<{
    date: string;
    accuracy: number; // 0-1
    sampleSize: number;
  }>;
  lastUpdated: string;
}

export type ConceptStatus = 'Strong' | 'Watchlist' | 'Critical' | 'Insufficient Data';

export interface ConceptEvaluation {
  concept: Concept;
  status: ConceptStatus;
  rollingAccuracy: number;
  sampleSize: number;
  recentTrend: number;
  confidenceBand: {
    low: number;
    high: number;
  };
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

export interface SimulationAnalysis {
  accuracy: number; // 0-100
  speed: number; // 0-100
  stability: number; // 0-100
  panicZones: {
    label: string;
    type: 'time' | 'concept';
    drop: number; // performance drop percentage
  }[];
  remedialPlan: {
    weekStart: string;
    focusConcepts: Concept[];
    actions: string[];
  };
}

export interface SubTestHistoryEntry {
  date: string;
  score: number; // IRT score (0-1000)
  sessionId: string;
}

export type ReadinessLevel = 'Aman' | 'Waspada' | 'Kritis';

export interface AssessmentReport {
  id: string;
  date: string;
  totalScore: number; // IRT Score (0-1000)
  questionCount?: number;
  correctCount?: number;
  categoryScores: { [key in Category]: number };
  readinessScore: number; // trend-aware readiness (0-1000)
  readinessBySubTest: {
    subTest: string;
    score: number;
    trend: number;
    stability: number;
    readiness: ReadinessLevel;
    sampleSize: number;
  }[];
  nationalRank: number;
  totalParticipants: number;
  percentile: number;
  materialMastery: { [key in Concept]: number }; // 0-100
  conceptEvaluations: ConceptEvaluation[];
  recommendations: {
    ptn: string;
    prodi: string;
    chance: number; // 0-100
  }[];
  simulationAnalysis?: SimulationAnalysis;
  readinessIndex: number;
  trendSessions: number;
  consistency: number;
  gapBySubTest: { [key in Category]: number };
  focusRecommendations: string[];
  target?: {
    ptn: string;
    prodi: string;
    passingGrade: number;
  };
  performancePrediction?: {
    scoreRange: [number, number];
    confidenceLevel: 'Low' | 'Medium' | 'High';
    summary: string;
  };
  stabilityAnalysis?: {
    level: 'Stabil' | 'Perlu Monitoring' | 'Tidak Stabil';
    flags: string[];
  };
  weaknessPriorities?: {
    domain: string;
    accuracy: number;
    priority: 'Kritis' | 'Tinggi' | 'Sedang';
    recommendation: string;
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
  mode: 'tryout' | 'mini' | 'daily' | 'category' | 'simulation';
  mode: 'tryout' | 'mini' | 'daily' | 'drill15' | 'category';
  selectedCategory?: Category;
  questions: Question[];
  recommendations?: { [questionId: string]: SessionRecommendation };
  strategy?: QuizStrategy;
  currentIdx: number;
  answers: { [questionId: string]: any }; // number for MC, boolean[] for Complex, number for Short
  marked: { [questionId: string]: boolean }; // "Ragu-ragu" state
  answerTimeline?: { [questionId: string]: number[] }; // timestamps for answer changes
  startTime: number;
  timePerQuestion: { [questionId: string]: number };
  questionStartedAt: number;
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
