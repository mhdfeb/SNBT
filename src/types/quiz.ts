export * from './question';
export * from './progress';
export * from './report';

import type { Category, Concept, Question, QuestionAnswer } from './question';
import type { QuizStrategy, SessionRecommendation } from './report';

export interface QuizSession {
  mode: 'tryout' | 'mini' | 'daily' | 'drill15' | 'category' | 'targeted' | 'simulation';
  selectedCategory?: Category;
  questions: Question[];
  recommendations?: { [questionId: string]: SessionRecommendation };
  recommendation?: {
    generatedAt: number;
    mode: 'daily' | 'mini' | 'drill15';
    weakestConcepts: Concept[];
    strongestConcepts: Concept[];
    targetConcepts: Concept[];
    reasons: string[];
  };
  strategy?: QuizStrategy;
  currentIdx: number;
  answers: { [questionId: string]: QuestionAnswer };
  marked: { [questionId: string]: boolean };
  answerTimeline?: { [questionId: string]: number[] };
  startTime: number;
  timePerQuestion: { [questionId: string]: number };
  questionStartedAt?: number;
  isSubmitted: boolean;
  subTests?: {
    name: string;
    questionIndices: number[];
    timeLimit: number;
    expiresAt: number;
  }[];
  currentSubTestIdx?: number;
  targetedMeta?: {
    concept: Concept;
    baselineAccuracy: number;
  };
  remedial?: {
    cycleId: string;
    concept: Concept;
    phase: 'baseline' | 'after';
  };
  packageId?: string;
  totalTimeLimitSec?: number;
  totalExpiresAt?: number;
}
