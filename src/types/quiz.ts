export type Difficulty = 'easy' | 'medium' | 'trap';
export type Category = 'TPS' | 'Literasi Indonesia' | 'Literasi Inggris' | 'Penalaran Matematika';
export type Concept = 
  | 'Penalaran Induktif' | 'Penalaran Deduktif' | 'Penalaran Kuantitatif'
  | 'Pengetahuan & Pemahaman Umum' | 'Pemahaman Bacaan & Menulis' | 'Pengetahuan Kuantitatif'
  | 'Literasi Bahasa Indonesia' | 'Literasi Bahasa Inggris' | 'Penalaran Matematika'
  | 'Penalaran Umum' | 'Pengetahuan Umum' | 'Pemahaman Bacaan'
  | 'Literasi Teks' | 'Main Idea' | 'Inference' | 'Vocabulary' | 'Bilangan' | 'Aljabar' | 'Geometri' | 'Data';

export type QuestionType = 'multiple_choice' | 'complex_multiple_choice' | 'short_answer';

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
  irtParams: {
    difficulty: number; // b parameter (-3 to 3)
    discrimination: number; // a parameter (0 to 2)
    guessing: number; // c parameter (0 to 0.25)
  };
}

export interface StudyMaterial {
  id: string;
  concept: Concept;
  category: Category;
  title: string;
  fullContent: string;
  summary: string;
  sources: { name: string; url: string }[];
}

export interface UserProgress {
  completedIds: string[];
  wrongIds: string[];
  streak: number;
  dailyProgress: { [date: string]: number };
  categoryStats: { [key in Category]: { correct: number; total: number } };
  currentDifficulty: Difficulty;
  reports: AssessmentReport[];
  materialMastery: { [concept: string]: number }; // 0-100 per concept
  drillHistory?: TargetedDrillResult[];
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
  mode: 'tryout' | 'mini' | 'daily' | 'category' | 'targeted';
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
  targetedMeta?: {
    concept: Concept;
    baselineAccuracy: number;
  };
}

export interface TargetedDrillResult {
  id: string;
  date: string;
  concept: Concept;
  baselineAccuracy: number;
  postAccuracy: number;
  delta: number;
  totalQuestions: number;
}
