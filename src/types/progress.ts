import type { Category, Concept } from './question';
import type { AssessmentReport, QuizStrategy } from './report';

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
  score?: number;
  sessionId?: string;
  scores?: { [key in Category]: number };
  consistency?: number;
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

export interface TargetedDrillResult {
  id: string;
  date: string;
  concept: Concept;
  baselineAccuracy: number;
  postAccuracy: number;
  delta: number;
  totalQuestions: number;
  totalTimeLimitSec?: number;
  totalExpiresAt?: number;
  questionStartAt?: number;
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

export interface UserProgress {
  storageVersion: number;
  completedIds: string[];
  wrongIds: string[];
  streak: number;
  qualityStreak: number;
  qualityDays: { [date: string]: boolean };
  dailyProgress: { [date: string]: number };
  categoryStats: { [key in Category]: { correct: number; total: number } };
  currentDifficulty: 'easy' | 'medium' | 'trap';
  reports: AssessmentReport[];
  simulationReports: AssessmentReport[];
  materialMastery: { [concept: string]: number };
  drillHistory?: TargetedDrillResult[];
  subTestHistory: { [subTestName: string]: SubTestHistoryEntry[] };
  questionUsage?: { [questionId: string]: { shownCount: number; lastShownAt: string | null } };
  questionPerformance?: { [questionId: string]: { attempts: number; wrong: number } };
  questionHistory?: { [questionId: string]: QuestionHistoryItem };
  conceptProfiles?: { [concept: string]: ConceptProfile };
  remedialCycles?: RemedialCycle[];
  target?: UserTarget;
  conceptLastSeen?: { [concept: string]: string };
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
