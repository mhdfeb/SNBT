export type Difficulty = 'easy' | 'medium' | 'trap';
export type Category = 'TPS' | 'Literasi Indonesia' | 'Literasi Inggris' | 'Penalaran Matematika';

export type Concept =
  | 'Penalaran Induktif'
  | 'Penalaran Deduktif'
  | 'Penalaran Kuantitatif'
  | 'Pengetahuan & Pemahaman Umum'
  | 'Pemahaman Bacaan & Menulis'
  | 'Pengetahuan Kuantitatif'
  | 'Literasi Bahasa Indonesia'
  | 'Literasi Bahasa Inggris'
  | 'Penalaran Matematika'
  | 'Penalaran Umum'
  | 'Pengetahuan Umum'
  | 'Pemahaman Bacaan'
  | 'Literasi Teks'
  | 'Main Idea'
  | 'Inference'
  | 'Vocabulary'
  | 'Bilangan'
  | 'Aljabar'
  | 'Geometri'
  | 'Data';

export type QuestionType = 'multiple_choice' | 'complex_multiple_choice' | 'short_answer';
export type CognitiveLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
export type ItemLifecycleStatus = 'draft' | 'reviewed' | 'active' | 'deprecated';
export type SourceValidity = 'verified' | 'reviewed' | 'draft';
export type QuestionValidityStatus = 'valid_snbt_like' | 'needs_revision' | 'retired';

export interface QuestionBlueprint {
  subtopic: string;
  cognitiveLevel: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
  competencyIndicator: string;
  sourceValidity: SourceValidity;
}

export interface ComplexOption {
  statement: string;
  correct: boolean;
}

export interface QuestionQualityMetadata {
  subtopic: string;
  cognitiveLevel: CognitiveLevel;
  targetDifficulty: Difficulty;
  competencyGoal: string;
  lifecycleStatus: ItemLifecycleStatus;
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

export interface Question {
  id: string;
  category: Category;
  concept: Concept;
  difficulty: Difficulty;
  qualityMetadata: QuestionQualityMetadata;
  type: QuestionType;
  question: string;
  options?: string[];
  complexOptions?: ComplexOption[];
  shortAnswerCorrect?: number;
  correctAnswer?: number;
  explanation: string;
  validityStatus?: QuestionValidityStatus;
  blueprint: QuestionBlueprint;
  irtParams: {
    difficulty: number;
    discrimination: number;
    guessing: number;
  };
  editorial?: EditorialMetadata;
}

export type QuestionAnswer = number | boolean[] | null;

export type QuestionBankItem = Omit<Question, 'qualityMetadata'>;

export interface DistractorOptionPerformance {
  optionIndex: number;
  selectedCount: number;
  selectedByIncorrect: number;
  selectedByCorrect: number;
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
  discriminationProxy: number;
  distractorStats: DistractorOptionPerformance[] | DistractorStat[];
  distractorEffectiveness?: number;
  flaggedIssue?: string[];
  isExcludedFromAdaptive?: boolean;
  discriminationIndex?: number;
  optionSelections?: number[];
  flags?: string[];
  needsEditorialReview?: boolean;
  lastUpdatedAt?: string;
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
  learningBlocks?: {
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
  passingGrade: number;
  capacity: number;
  applicants: number;
}
