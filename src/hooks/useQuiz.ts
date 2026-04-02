import { useState, useEffect, useCallback, useRef } from 'react';
import { Question, UserProgress, QuizSession, Difficulty, Category, AssessmentReport, UserTarget } from '../types/quiz';
import { QUESTIONS } from '../data/questions';
import { SIMULATION_QUESTIONS } from '../data/simulationQuestions';
import { Question, UserProgress, QuizSession, Difficulty, Category, AssessmentReport } from '../types/quiz';
import { QUESTIONS, TRYOUT_BLUEPRINT } from '../data/questions';
import { getValidQuestionsForSubtest } from '../data/questionGovernance';
import { QUESTIONS, SIMULATION_QUESTION_BANK, TRAINING_QUESTION_BANK } from '../data/questions';
import { calculateIRTScore, getNationalStats } from '../lib/irt';
import { Question, UserProgress, QuizSession, Difficulty, Category, AssessmentReport, QuizStrategy, SessionRecommendation } from '../types/quiz';
import { Question, UserProgress, QuizSession, Difficulty, Category, AssessmentReport, ItemPerformance } from '../types/quiz';
import { Question, UserProgress, QuizSession, Difficulty, Category, AssessmentReport, Concept, ConceptEvaluation, ConceptLongitudinalMetrics, ConceptStatus } from '../types/quiz';
import { Question, UserProgress, QuizSession, Category, AssessmentReport, ConceptProfile } from '../types/quiz';
import { Question, UserProgress, QuizSession, Difficulty, Category, AssessmentReport, Concept } from '../types/quiz';
import { Question, UserProgress, QuizSession, Difficulty, Category, AssessmentReport, QuestionPerformanceStat } from '../types/quiz';
import { QUESTIONS } from '../data/questions';
import { applyTryoutEquating, calculateIRTScore, getNationalStats } from '../lib/irt';
import { PTN_DATA } from '../data/ptn';
import { STUDY_MATERIALS } from '../data/materials';

const STORAGE_KEY = 'ppu_master_progress_v4';
const STORAGE_KEY_LEGACY = 'ppu_master_progress_v3';
const STORAGE_VERSION = 4;
const ROLLING_ALPHA = 0.35;
const MIN_CONCEPT_SAMPLE_FOR_STATUS = 5;
const STORAGE_KEY = 'ppu_master_progress_v3';
const CATEGORIES: Category[] = ['TPS', 'Literasi Indonesia', 'Literasi Inggris', 'Penalaran Matematika'];
const RECENT_WINDOW = 6;
const RECOMMENDED_COUNTS: Record<'daily' | 'mini' | 'drill15', number> = {
  daily: 5,
  mini: 10,
  drill15: 12,
};

type MaterialMasteryAccumulator = { [concept: string]: { correct: number; total: number } };

const INITIAL_PROGRESS: UserProgress = {
  storageVersion: STORAGE_VERSION,
  completedIds: [],
  wrongIds: [],
  streak: 0,
  qualityStreak: 0,
  qualityDays: {},
  dailyProgress: {},
  categoryStats: {
    'TPS': { correct: 0, total: 0 },
    'Literasi Indonesia': { correct: 0, total: 0 },
    'Literasi Inggris': { correct: 0, total: 0 },
    'Penalaran Matematika': { correct: 0, total: 0 },
  },
  currentDifficulty: 'easy',
  reports: [],
  materialMastery: {},
  subTestHistory: {},
};

const READINESS_WINDOW = 10;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const calculateTrend = (scores: number[]): number => {
  if (scores.length < 2) return 0;
  const first = scores[0];
  const last = scores[scores.length - 1];
  return last - first;
};

const calculateStability = (scores: number[]): number => {
  if (scores.length < 2) return 100;
  const mean = scores.reduce((acc, s) => acc + s, 0) / scores.length;
  const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  return clamp(Math.round(100 - stdDev / 5), 0, 100);
};

const getReadinessLevel = (readinessScore: number): 'Aman' | 'Waspada' | 'Kritis' => {
  if (readinessScore >= 650) return 'Aman';
  if (readinessScore >= 500) return 'Waspada';
  return 'Kritis';
  questionUsage: {},
  subTestHistory: [],
  conceptLastSeen: {},
  conceptHistory: {},
  conceptReviewState: {},
  strategyOutcomes: {},
  itemPerformance: {},
  conceptMetrics: {},
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const computeConfidenceBand = (accuracy: number, sampleSize: number) => {
  if (sampleSize <= 0) return { low: 0, high: 1 };
  const margin = 1.96 * Math.sqrt((accuracy * (1 - accuracy)) / sampleSize);
  return {
    low: clamp(accuracy - margin),
    high: clamp(accuracy + margin),
  };
};

const evaluateConceptStatus = (metric: ConceptLongitudinalMetrics): ConceptStatus => {
  if (metric.totalAttempts < MIN_CONCEPT_SAMPLE_FOR_STATUS) return 'Insufficient Data';
  if (metric.confidenceBand.low >= 0.72 && metric.recentTrend > -0.12) return 'Strong';
  if (metric.confidenceBand.high < 0.5 || (metric.rollingAccuracy < 0.52 && metric.recentTrend < -0.08)) return 'Critical';
  return 'Watchlist';
};

const toConceptEvaluation = (concept: Concept, metric: ConceptLongitudinalMetrics): ConceptEvaluation => ({
  concept,
  status: evaluateConceptStatus(metric),
  rollingAccuracy: metric.rollingAccuracy,
  sampleSize: metric.totalAttempts,
  recentTrend: metric.recentTrend,
  confidenceBand: metric.confidenceBand,
});

const migrateProgress = (raw: any): UserProgress => {
  const merged: UserProgress = {
    ...INITIAL_PROGRESS,
    ...raw,
    materialMastery: raw?.materialMastery ?? {},
    conceptMetrics: raw?.conceptMetrics ?? {},
    storageVersion: STORAGE_VERSION,
  };

  merged.reports = (merged.reports ?? []).map((report: any) => ({
    ...report,
    conceptEvaluations: report?.conceptEvaluations ?? [],
  }));

  Object.entries(merged.conceptMetrics).forEach(([concept, metric]) => {
    const safeMetric = metric as Partial<ConceptLongitudinalMetrics>;
    merged.conceptMetrics[concept as Concept] = {
      totalAttempts: safeMetric.totalAttempts ?? 0,
      totalCorrect: safeMetric.totalCorrect ?? 0,
      rollingAccuracy: safeMetric.rollingAccuracy ?? 0.5,
      recentTrend: safeMetric.recentTrend ?? 0,
      confidenceBand: safeMetric.confidenceBand ?? { low: 0, high: 1 },
      history: safeMetric.history ?? [],
      lastUpdated: safeMetric.lastUpdated ?? new Date().toISOString(),
    };
  });

  if (!raw?.conceptMetrics) {
    merged.conceptMetrics = {};
    Object.entries(merged.materialMastery).forEach(([conceptKey, mastery]) => {
      const derivedAccuracy = clamp((Number(mastery) || 0) / 100);
      const sampleSize = 0;
      merged.conceptMetrics[conceptKey as Concept] = {
        totalAttempts: sampleSize,
        totalCorrect: 0,
        rollingAccuracy: derivedAccuracy,
        recentTrend: 0,
        confidenceBand: { low: 0, high: 1 },
        history: [],
        lastUpdated: new Date().toISOString(),
      };
    });
  }

  return merged;
  questionHistory: {},
  conceptProfiles: {},
  remedialCycles: [],
  questionPerformance: {},
};

const QUESTION_ROTATION_GAP_HOURS = 48;

const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

const pickQuestionsWithRotation = (pool: Question[], count: number, progress: UserProgress): Question[] => {
  const now = Date.now();
  const minGapMs = QUESTION_ROTATION_GAP_HOURS * 60 * 60 * 1000;

  const freshPool = pool.filter((q) => {
    const usage = progress.questionUsage[q.id];
    if (!usage?.lastShownAt) return true;
    return now - new Date(usage.lastShownAt).getTime() >= minGapMs;
  });

  const rotationPool = freshPool.length >= count ? freshPool : pool;

  return shuffle(rotationPool)
    .sort((a, b) => {
      const usageA = progress.questionUsage[a.id]?.shownCount ?? 0;
      const usageB = progress.questionUsage[b.id]?.shownCount ?? 0;
      return usageA - usageB;
    })
    .slice(0, count);
};

const buildRevisionPriorityQueue = (performance: UserProgress['questionPerformance']) =>
  Object.entries(performance)
    .map(([questionId, stats]) => ({
      questionId,
      wrongRate: stats.attempts > 0 ? stats.wrong / stats.attempts : 0,
      attempts: stats.attempts,
    }))
    .filter((entry) => entry.attempts >= 3)
    .sort((a, b) => b.wrongRate - a.wrongRate || b.attempts - a.attempts)
    .slice(0, 20);

const SUB_TEST_CONFIGS = [
  { name: 'Penalaran Induktif', category: 'TPS', count: 10, time: 600 },
  { name: 'Penalaran Deduktif', category: 'TPS', count: 10, time: 600 },
  { name: 'Penalaran Kuantitatif', category: 'TPS', count: 10, time: 600 },
  { name: 'Pengetahuan & Pemahaman Umum', category: 'TPS', count: 20, time: 900 },
  { name: 'Pemahaman Bacaan & Menulis', category: 'TPS', count: 20, time: 1500 },
  { name: 'Pengetahuan Kuantitatif', category: 'TPS', count: 15, time: 1200 },
  { name: 'Literasi Bahasa Indonesia', category: 'Literasi Indonesia', count: 30, time: 2700 },
  { name: 'Literasi Bahasa Inggris', category: 'Literasi Inggris', count: 20, time: 900 },
  { name: 'Penalaran Matematika', category: 'Penalaran Matematika', count: 20, time: 1800 },
] as const;

const clamp = (num: number, min: number, max: number) => Math.min(max, Math.max(min, num));

const getConsistencyScore = (scores: number[]) => {
  if (scores.length < 2) return 100;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((acc, score) => acc + (score - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  return Math.round(clamp(100 - stdDev / 2.2, 0, 100));
};

const calculateReadinessInsights = (reports: AssessmentReport[], target?: UserTarget) => {
  const lookback = clamp(reports.length, 4, 8);
  const trendReports = reports.slice(0, lookback);

  const avgTotal = trendReports.length > 0
    ? trendReports.reduce((sum, r) => sum + r.totalScore, 0) / trendReports.length
    : 0;

  const categoryAverages = CATEGORIES.reduce((acc, category) => {
    const avg = trendReports.length > 0
      ? trendReports.reduce((sum, report) => sum + report.categoryScores[category], 0) / trendReports.length
      : 0;
    acc[category] = Math.round(avg);
    return acc;
  }, {} as { [key in Category]: number });

  const targetPTN = PTN_DATA.find((ptn) => ptn.id === target?.ptnId);
  const targetProdi = targetPTN?.prodi.find((prodi) => prodi.id === target?.prodiId);
  const passingGrade = targetProdi?.passingGrade ?? 700;

  const readinessIndex = Math.round(clamp((avgTotal / passingGrade) * 100, 0, 100));
  const consistency = getConsistencyScore(trendReports.map(r => r.totalScore));

  const gapBySubTest = CATEGORIES.reduce((acc, category) => {
    acc[category] = Math.round(clamp(passingGrade - categoryAverages[category], -300, 300));
    return acc;
  }, {} as { [key in Category]: number });

  const focusRecommendations = Object.entries(gapBySubTest)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([subtest, gap], idx) => {
      if (gap <= 0) return `Pertahankan ${subtest} dengan mixed drill 20 menit/hari agar skor tetap stabil.`;
      const weeklyTarget = Math.max(15, Math.round(gap / 3));
      return `${idx + 1}. Prioritaskan ${subtest}: kejar +${weeklyTarget} poin/minggu dengan latihan bertahap dan evaluasi 2x.`;
    });

  return {
    readinessIndex,
    trendSessions: trendReports.length,
    consistency,
    gapBySubTest,
    focusRecommendations,
    targetInfo: targetPTN && targetProdi
      ? {
          ptn: targetPTN.name,
          prodi: targetProdi.name,
          passingGrade: targetProdi.passingGrade,
        }
      : undefined,
].map((config) => {
  const blueprint = TRYOUT_BLUEPRINT.find((bp) => bp.subtest === config.name);
  return {
    ...config,
    allowedTypes: blueprint?.stimulusTypes,
    targetComplexity: blueprint?.complexityTarget,
  };
});
] as const;

const clamp = (val: number, min = 0, max = 100) => Math.max(min, Math.min(max, val));

function computeConceptProfiles(questionHistory: UserProgress['questionHistory'], reports: AssessmentReport[]): Record<string, ConceptProfile> {
  const profiles: Record<string, ConceptProfile> = {};
  const now = Date.now();

  QUESTIONS.forEach((q) => {
    const history = questionHistory?.[q.id] ?? { attempts: 0, correct: 0, lastSeenAt: 0, lastCorrectAt: 0, wrongStreak: 0 };
    if (!profiles[q.concept]) {
      profiles[q.concept] = {
        concept: q.concept,
        attempts: 0,
        correct: 0,
        rollingAccuracy: 0,
        confidence: 25,
        recentTrend: 'stable',
        weaknessScore: 70,
        lastSeenAt: 0,
      };
    }

    const profile = profiles[q.concept];
    profile.attempts += history.attempts;
    profile.correct += history.correct;
    profile.lastSeenAt = Math.max(profile.lastSeenAt, history.lastSeenAt || 0);
  });

  Object.values(profiles).forEach((profile) => {
    const accuracy = profile.attempts > 0 ? profile.correct / profile.attempts : 0;
    const recent = reports
      .slice(0, RECENT_WINDOW)
      .map((report) => report.materialMastery[profile.concept as keyof typeof report.materialMastery])
      .filter((v): v is number => typeof v === 'number');

    const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : accuracy * 100;
    const olderWindow = reports
      .slice(RECENT_WINDOW, RECENT_WINDOW * 2)
      .map((report) => report.materialMastery[profile.concept as keyof typeof report.materialMastery])
      .filter((v): v is number => typeof v === 'number');
    const olderAvg = olderWindow.length ? olderWindow.reduce((a, b) => a + b, 0) / olderWindow.length : recentAvg;
    const delta = recentAvg - olderAvg;

    profile.rollingAccuracy = clamp(Math.round(accuracy * 100));
    profile.confidence = clamp(Math.round(35 + Math.min(profile.attempts, 20) * 2.8));
    profile.recentTrend = delta > 6 ? 'up' : delta < -6 ? 'down' : 'stable';

    const notSeenDays = profile.lastSeenAt > 0 ? Math.floor((now - profile.lastSeenAt) / (1000 * 60 * 60 * 24)) : 30;
    const trendPenalty = profile.recentTrend === 'down' ? 12 : profile.recentTrend === 'up' ? -6 : 0;
    const lowConfidencePenalty = Math.max(0, 55 - profile.confidence) * 0.35;
    profile.weaknessScore = clamp(
      Math.round((100 - profile.rollingAccuracy) * 0.7 + lowConfidencePenalty + Math.min(notSeenDays, 21) * 1.1 + trendPenalty)
    );
  });

  return profiles;
}

const pickConceptPool = (concept: Concept) => {
  const normalized = concept.toLowerCase();
  const strict = QUESTIONS.filter((q) => q.concept === concept);
  if (strict.length > 0) return strict;

  const fuzzy = QUESTIONS.filter((q) => q.concept.toLowerCase().includes(normalized) || normalized.includes(q.concept.toLowerCase()));
  return fuzzy.length > 0 ? fuzzy : QUESTIONS;
const TRYOUT_PACKAGES = ['TO-A', 'TO-B', 'TO-C'];

function evaluateQuestionFlags(stat: QuestionPerformanceStat): string[] {
  const flags: string[] = [];

  if (stat.pValue > 0.9) flags.push('too_easy');
  if (stat.pValue < 0.2) flags.push('too_hard');
  if (stat.discriminationIndex < 0.15) flags.push('low_discrimination');

  const ineffectiveDistractors = stat.distractorStats.filter(d => !d.isEffective).length;
  if (stat.distractorStats.length > 0 && ineffectiveDistractors >= Math.ceil(stat.distractorStats.length / 2)) {
    flags.push('ineffective_distractors');
  }

  if (stat.pValue >= 0.4 && stat.pValue <= 0.7 && stat.discriminationIndex < 0.1) {
    flags.push('potentially_ambiguous');
  }

  return flags;
}
const normalizeConcept = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

const findMaterialForConcept = (concept: string) => {
  const normalized = normalizeConcept(concept);
  return STUDY_MATERIALS.find(material => {
    const materialConcept = normalizeConcept(material.concept);
    return materialConcept === normalized || materialConcept.includes(normalized) || normalized.includes(materialConcept);
  });
};

const ACTIVE_QUESTIONS = QUESTIONS.filter((q) => q.qualityMetadata.lifecycleStatus === 'active');

const createEmptyPerformance = (question: Question): ItemPerformance => ({
  attempts: 0,
  correct: 0,
  pValue: 0,
  highGroupAttempts: 0,
  highGroupCorrect: 0,
  lowGroupAttempts: 0,
  lowGroupCorrect: 0,
  discriminationProxy: 0,
  distractorStats: question.options?.map((_, optionIndex) => ({
    optionIndex,
    selectedCount: 0,
    selectedByIncorrect: 0,
    selectedByCorrect: 0,
  })) ?? [],
  distractorEffectiveness: 1,
  flaggedIssue: [],
  isExcludedFromAdaptive: false,
  lastUpdatedAt: new Date().toISOString(),
});

const evaluatePerformanceFlag = (performance: ItemPerformance): { flaggedIssue: string[]; isExcludedFromAdaptive: boolean } => {
  if (performance.attempts < 20) {
    return { flaggedIssue: [], isExcludedFromAdaptive: false };
  }

  const flaggedIssue: string[] = [];
  if (performance.pValue < 0.2) flaggedIssue.push('too_difficult');
  if (performance.pValue > 0.9) flaggedIssue.push('too_easy');
  if (performance.discriminationProxy < 0.15) flaggedIssue.push('low_discrimination');
  if (performance.distractorEffectiveness < 0.5) flaggedIssue.push('weak_distractor');

  return {
    flaggedIssue,
    isExcludedFromAdaptive: flaggedIssue.length > 0,
  };
};

export function useQuiz() {
  const calculateConceptWeakness = useCallback((concept: string, progressState: UserProgress) => {
    const mastery = progressState.materialMastery?.[concept] ?? 50;
    const history = progressState.conceptHistory?.[concept] ?? [];
    const recent = history.slice(-2);
    const declinePenalty = recent.length === 2 && recent.every(v => !v) ? 25 : recent.length > 0 && !recent[recent.length - 1] ? 12 : 0;
    const weakness = Math.max(0, 100 - mastery) + declinePenalty;
    return Math.min(120, weakness);
  }, []);

  const getReviewUrgency = useCallback((concept: string, progressState: UserProgress) => {
    const review = progressState.conceptReviewState?.[concept];
    if (!review) return 0.2;
    const now = Date.now();
    const dueTime = new Date(review.nextReviewAt).getTime();
    if (Number.isNaN(dueTime)) return 0.2;
    if (dueTime <= now) {
      const overdueDays = Math.max(0, (now - dueTime) / (1000 * 60 * 60 * 24));
      return 1 + Math.min(1.2, overdueDays * 0.25);
    }
    const daysUntilDue = (dueTime - now) / (1000 * 60 * 60 * 24);
    return Math.max(0.1, 1 - Math.min(0.9, daysUntilDue / 7));
  }, []);

  const getDailyStrategy = useCallback((pool: Question[], progressState: UserProgress): QuizStrategy => {
    const weakRatio = pool.length === 0
      ? 0
      : pool.filter(q => calculateConceptWeakness(q.concept, progressState) >= 55).length / pool.length;
    const hasOverdueReview = pool.some(q => getReviewUrgency(q.concept, progressState) >= 1);
    const latestReport = progressState.reports[0];
    const latestScore = latestReport?.totalScore ?? 0;

    if (weakRatio >= 0.4) return 'remediation';
    if (hasOverdueReview) return 'retention';
    if (latestScore >= 650) return 'exam_simulation';
    return 'retention';
  }, [calculateConceptWeakness, getReviewUrgency]);

  const getStrategyWeight = useCallback((question: Question, strategy: QuizStrategy, progressState: UserProgress) => {
    const weakness = calculateConceptWeakness(question.concept, progressState);
    const urgency = getReviewUrgency(question.concept, progressState);
    const wrongBoost = progressState.wrongIds.includes(question.id) ? 1.1 : 0;
    const difficultyBoost = strategy === 'exam_simulation'
      ? question.difficulty === 'trap' ? 0.8 : question.difficulty === 'medium' ? 0.45 : 0.2
      : question.difficulty === progressState.currentDifficulty ? 0.35 : 0.1;

    if (strategy === 'remediation') return weakness * 1.35 + urgency * 12 + wrongBoost + difficultyBoost;
    if (strategy === 'retention') return urgency * 30 + weakness * 0.45 + wrongBoost + difficultyBoost;
    return weakness * 0.35 + urgency * 8 + difficultyBoost + (question.category === 'TPS' ? 0.25 : 0);
  }, [calculateConceptWeakness, getReviewUrgency]);

  const buildReason = useCallback((question: Question, strategy: QuizStrategy, progressState: UserProgress) => {
    const history = progressState.conceptHistory?.[question.concept] ?? [];
    const last2 = history.slice(-2);
    if (strategy === 'remediation' && last2.length === 2 && last2.every(v => !v)) {
      return `Dipilih karena akurasi konsep ${question.concept} menurun 2 sesi terakhir.`;
    }
    if (strategy === 'retention' && getReviewUrgency(question.concept, progressState) >= 1) {
      return `Dipilih karena jadwal review konsep ${question.concept} sudah jatuh tempo.`;
    }
    if (strategy === 'exam_simulation') {
      return `Dipilih untuk simulasi ujian dengan tingkat kesulitan ${question.difficulty}.`;
    }
    return `Dipilih untuk menjaga variasi paparan konsep ${question.concept}.`;
  }, [getReviewUrgency]);
  const migrateMaterialMastery = (rawMastery: unknown): MaterialMasteryAccumulator => {
    if (!rawMastery || typeof rawMastery !== 'object') return {};

    const migrated: MaterialMasteryAccumulator = {};
    Object.entries(rawMastery as Record<string, unknown>).forEach(([concept, value]) => {
      if (typeof value === 'number') {
        const safePercent = Math.max(0, Math.min(100, Math.round(value)));
        migrated[concept] = { correct: safePercent, total: 100 };
        return;
      }

      if (
        value &&
        typeof value === 'object' &&
        'correct' in value &&
        'total' in value &&
        typeof (value as { correct: unknown }).correct === 'number' &&
        typeof (value as { total: unknown }).total === 'number'
      ) {
        migrated[concept] = {
          correct: Math.max(0, Math.round((value as { correct: number }).correct)),
          total: Math.max(0, Math.round((value as { total: number }).total)),
        };
      }
    });

    return migrated;
  };

  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY_LEGACY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...INITIAL_PROGRESS, 
        ...parsed, 
        materialMastery: parsed.materialMastery ?? {},
        qualityDays: parsed.qualityDays ?? {},
        conceptLastSeen: parsed.conceptLastSeen ?? {},
      return migrateProgress(parsed);
      return {
        ...INITIAL_PROGRESS,
        ...parsed,
        materialMastery: parsed.materialMastery ?? {},
        subTestHistory: parsed.subTestHistory ?? {},
        subTestHistory: parsed.subTestHistory ?? [],
        itemPerformance: parsed.itemPerformance ?? {},
        questionHistory: parsed.questionHistory ?? {},
        conceptProfiles: parsed.conceptProfiles ?? {},
      return { ...INITIAL_PROGRESS, ...parsed, materialMastery: parsed.materialMastery ?? {}, remedialCycles: parsed.remedialCycles ?? [] };
      return {
        ...INITIAL_PROGRESS,
        ...parsed,
        materialMastery: migrateMaterialMastery(parsed.materialMastery),
      };
    }
    return INITIAL_PROGRESS;
  });

  const [session, setSession] = useState<QuizSession | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const recordQuestionTime = (state: QuizSession) => {
    const currentQuestion = state.questions[state.currentIdx];
    if (!currentQuestion) return state;
    const elapsedSec = Math.max(0, Math.round((Date.now() - state.questionStartedAt) / 1000));
    return {
      ...state,
      timePerQuestion: {
        ...state.timePerQuestion,
        [currentQuestion.id]: (state.timePerQuestion[currentQuestion.id] || 0) + elapsedSec,
      },
      questionStartedAt: Date.now(),
    };
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const chooseAdaptiveQuestions = useCallback((pool: Question[], mode: 'daily' | 'mini' | 'drill15', category?: Category) => {
    const now = Date.now();
    const targetCount = RECOMMENDED_COUNTS[mode];
    const profiles = computeConceptProfiles(progress.questionHistory, progress.reports);
    const profileValues = Object.values(profiles);
    const filteredProfiles = category
      ? profileValues.filter((profile) => QUESTIONS.some((q) => q.category === category && q.concept === profile.concept))
      : profileValues;

    const weakestConcepts = [...filteredProfiles].sort((a, b) => b.weaknessScore - a.weaknessScore).slice(0, 3).map((item) => item.concept);
    const strongestConcepts = [...filteredProfiles].sort((a, b) => a.weaknessScore - b.weaknessScore).slice(0, 2).map((item) => item.concept);
    const targetConcepts = mode === 'drill15' ? weakestConcepts.slice(0, 3) : [];

    const conceptWeight = new Map<string, number>();
    Object.values(profiles).forEach((profile) => {
      conceptWeight.set(profile.concept, 1 + profile.weaknessScore / 100);
    });

    const retentionConcepts = new Set(strongestConcepts);
    const strictTargets = new Set(targetConcepts);

    const weighted = pool.map((q) => {
      const history = progress.questionHistory?.[q.id] ?? { attempts: 0, correct: 0, lastSeenAt: 0, lastCorrectAt: 0, wrongStreak: 0 };
      const seenDays = history.lastSeenAt > 0 ? (now - history.lastSeenAt) / (1000 * 60 * 60 * 24) : 21;
      const wrongRecencyBoost = history.wrongStreak > 0 ? Math.min(history.wrongStreak * 0.5, 2.2) : 0;
      const spacingBoost = Math.min(seenDays / 10, 2.2);
      const weaknessBoost = conceptWeight.get(q.concept) ?? 1;
      const drillBoost = strictTargets.size > 0 ? (strictTargets.has(q.concept) ? 2.5 : 0.25) : 1;
      const retentionBoost = retentionConcepts.has(q.concept) ? 0.45 : 0;
      const randomness = Math.random() * 0.2;

      return {
        question: q,
        score: weaknessBoost + wrongRecencyBoost + spacingBoost + drillBoost + retentionBoost + randomness,
      };
    }).sort((a, b) => b.score - a.score);

    const selected: Question[] = [];
    const used = new Set<string>();

    const addByConcept = (concepts: string[], cap: number) => {
      concepts.forEach((concept) => {
        if (selected.length >= cap) return;
        const candidate = weighted.find((entry) => entry.question.concept === concept && !used.has(entry.question.id));
        if (candidate) {
          selected.push(candidate.question);
          used.add(candidate.question.id);
        }
      });
    };

    addByConcept(weakestConcepts, Math.ceil(targetCount * 0.6));
    addByConcept(strongestConcepts, Math.ceil(targetCount * 0.8));

    for (const entry of weighted) {
      if (selected.length >= targetCount) break;
      if (used.has(entry.question.id)) continue;
      if (mode === 'drill15' && strictTargets.size > 0 && !strictTargets.has(entry.question.concept) && selected.length < targetCount - 2) {
        continue;
      }
      selected.push(entry.question);
      used.add(entry.question.id);
    }

    if (selected.length < targetCount) {
      const fallback = pool.filter((q) => !used.has(q.id)).sort(() => Math.random() - 0.5).slice(0, targetCount - selected.length);
      selected.push(...fallback);
    }

    return {
      selectedQuestions: selected,
      recommendation: {
        generatedAt: now,
        mode,
        weakestConcepts,
        strongestConcepts,
        targetConcepts,
        reasons: [
          `Prioritas konsep lemah: ${weakestConcepts.slice(0, 3).join(', ') || 'belum cukup data'}`,
          `Konsep kuat disisipkan untuk retensi: ${strongestConcepts.slice(0, 2).join(', ') || 'otomatis acak'}`,
          'Spaced repetition aktif untuk soal salah dan soal yang lama tidak muncul.',
        ],
      },
      conceptProfiles: profiles,
    };
  }, [progress.questionHistory, progress.reports]);

  useEffect(() => {
    if (session && !session.isSubmitted && session.subTests && session.currentSubTestIdx !== undefined) {
      const currentSubTest = session.subTests[session.currentSubTestIdx];
      if (!currentSubTest || currentSubTest.expiresAt === 0) return;

      timerRef.current = setInterval(() => {
        setSession(prev => {
          if (!prev || prev.isSubmitted || prev.currentSubTestIdx === undefined || !prev.subTests) return prev;

          const subTest = prev.subTests[prev.currentSubTestIdx];
          if (!subTest || subTest.expiresAt === 0 || Date.now() < subTest.expiresAt) return prev;

          if (prev.currentSubTestIdx < prev.subTests.length - 1) {
            const nextIdx = prev.currentSubTestIdx + 1;
            const nextSubTest = prev.subTests[nextIdx];
            if (nextSubTest && nextSubTest.questionIndices.length > 0) {
              const updatedSubTests = prev.subTests.map((st, i) =>
                i === nextIdx ? { ...st, expiresAt: Date.now() + st.timeLimit * 1000 } : st
              );
              return {
                ...prev,
                subTests: updatedSubTests,
                currentSubTestIdx: nextIdx,
                currentIdx: nextSubTest.questionIndices[0],
              };
            }
          }
          return { ...prev, isSubmitted: true };
        });
      }, 500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current as NodeJS.Timeout);
    };
  }, [session?.mode, session?.isSubmitted, session?.currentSubTestIdx]);

  const startSession = useCallback((
    mode: QuizSession['mode'],
    category?: Category,
    options?: { concept?: Concept; remedialPhase?: 'baseline' | 'after'; cycleId?: string }
  ) => {
    let selectedQuestions: Question[] = [];
    let subTests: QuizSession['subTests'] = [];
    const isStrictSimulation = mode === 'simulation';
    const sourceBank = isStrictSimulation ? SIMULATION_QUESTION_BANK : QUESTIONS;

    if (mode === 'tryout' || mode === 'simulation') {
    if (mode === 'tryout' || isStrictSimulation) {
      // Full Tryout: All sub-tests
    let recommendations: QuizSession['recommendations'] = {};
    let strategy: QuizSession['strategy'] = undefined;
    let recommendation: QuizSession['recommendation'];

    if (mode === 'tryout') {
      let currentIdxOffset = 0;
      const usedIds = new Set<string>();

      const sourceQuestions = mode === 'simulation' ? SIMULATION_QUESTIONS : QUESTIONS;

      SUB_TEST_CONFIGS.forEach(config => {
        const blueprintPool = getValidQuestionsForSubtest(QUESTIONS, config.name)
          .filter(q => !usedIds.has(q.id))
          .filter(q => !config.allowedTypes || config.allowedTypes.includes(q.type));

        const targetEasy = Math.round(config.count * (config.targetComplexity?.easy ?? 0));
        const targetTrap = Math.round(config.count * (config.targetComplexity?.trap ?? 0));
        const targetMedium = Math.max(0, config.count - targetEasy - targetTrap);

        const easyPool = blueprintPool.filter(q => q.difficulty === 'easy');
        const mediumPool = blueprintPool.filter(q => q.difficulty === 'medium');
        const trapPool = blueprintPool.filter(q => q.difficulty === 'trap');

        const pickRandom = (pool: Question[], n: number) => [...pool].sort(() => Math.random() - 0.5).slice(0, n);

        let finalPool: Question[] = [
          ...pickRandom(easyPool, targetEasy),
          ...pickRandom(mediumPool, targetMedium),
          ...pickRandom(trapPool, targetTrap),
        ];

        if (finalPool.length < config.count) {
          const additional = blueprintPool
            .filter(q => !finalPool.some(fq => fq.id === q.id))
            .sort(() => Math.random() - 0.5)
            .slice(0, config.count - finalPool.length);
          finalPool = [...finalPool, ...additional];
        }

        // Filter questions by concept or category, excluding already used ones
        const subPool = sourceQuestions.filter(q => 
        const subPool = sourceBank.filter(q => 
        const subPool = ACTIVE_QUESTIONS.filter(q => 
          !usedIds.has(q.id) && 
        const subPool = QUESTIONS.filter(q =>
          !usedIds.has(q.id) &&
          (q.concept === config.name || (q.category === config.category && q.concept.includes(config.name)))
        );

        let finalPool = subPool;
        if (finalPool.length < config.count) {
          const catPool = sourceQuestions.filter(q => !usedIds.has(q.id) && q.category === config.category);
          const catPool = sourceBank.filter(q => !usedIds.has(q.id) && q.category === config.category);
          const catPool = ACTIVE_QUESTIONS.filter(q => !usedIds.has(q.id) && q.category === config.category);
          finalPool = [...finalPool, ...catPool.filter(q => !finalPool.some(fq => fq.id === q.id))];
        }

        if (finalPool.length < config.count) {
          const remainingNeeded = config.count - finalPool.length;
          const otherPool = sourceQuestions.filter(q => !finalPool.some(fq => fq.id === q.id));
          const otherPool = sourceBank.filter(q => !finalPool.some(fq => fq.id === q.id));
          const otherPool = ACTIVE_QUESTIONS.filter(q => !finalPool.some(fq => fq.id === q.id));
          // Shuffle otherPool and take what's needed
          const otherPool = QUESTIONS.filter(q => !finalPool.some(fq => fq.id === q.id));
          const additional = [...otherPool].sort(() => Math.random() - 0.5).slice(0, remainingNeeded);
          finalPool = [...finalPool, ...additional];
        }

        // Final safety check: if still empty (should only happen if QUESTIONS is empty), skip or fill with anything
        if (finalPool.length === 0 && sourceQuestions.length > 0) {
          finalPool = [sourceQuestions[Math.floor(Math.random() * sourceQuestions.length)]];
        if (finalPool.length === 0 && sourceBank.length > 0) {
          finalPool = [sourceBank[Math.floor(Math.random() * sourceBank.length)]];
        if (finalPool.length === 0 && ACTIVE_QUESTIONS.length > 0) {
          finalPool = [ACTIVE_QUESTIONS[Math.floor(Math.random() * ACTIVE_QUESTIONS.length)]];
        if (finalPool.length === 0 && QUESTIONS.length > 0) {
          finalPool = [QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]];
        }

        const shuffled = [...finalPool].sort(() => Math.random() - 0.5).slice(0, config.count);
        shuffled.forEach(q => usedIds.add(q.id));
        selectedQuestions.push(...shuffled);

        const indices = Array.from({ length: shuffled.length }, (_, i) => i + currentIdxOffset);
        if (indices.length > 0) {
          subTests?.push({
            name: config.name,
            questionIndices: indices,
            timeLimit: config.time,
            expiresAt: 0,
          });
          currentIdxOffset += shuffled.length;
        }
      });
    } else {
      const basePool = mode === 'daily' || mode === 'mini' || mode === 'category' ? TRAINING_QUESTION_BANK : QUESTIONS;
      const pool = category 
        ? basePool.filter(q => q.category === category)
        : [...basePool];
      const basePool = category
        ? ACTIVE_QUESTIONS.filter(q => q.category === category)
        : [...ACTIVE_QUESTIONS];
      const adaptivePool = (mode === 'daily' || mode === 'mini')
        ? basePool.filter((q) => !progress.itemPerformance[q.id]?.isExcludedFromAdaptive)
        : basePool;
      const pool = adaptivePool.length > 0 ? adaptivePool : basePool;
      const pool = category
        ? QUESTIONS.filter(q => q.category === category)
        : [...QUESTIONS];
      strategy = mode === 'daily' ? getDailyStrategy(pool, progress) : mode === 'mini' ? 'exam_simulation' : undefined;

      if (mode === 'category') {
      const conceptPool = options?.concept ? pickConceptPool(options.concept) : null;
      const pool = conceptPool ?? (category ? QUESTIONS.filter(q => q.category === category) : [...QUESTIONS]);

      const wrongPool = pool.filter(q => progress.wrongIds.includes(q.id));
      const normalPool = pool.filter(q => !progress.wrongIds.includes(q.id));

      if (mode === 'daily') {
        selectedQuestions = [
          ...pickQuestionsWithRotation(wrongPool, 2, progress),
          ...pickQuestionsWithRotation(normalPool.filter(q => q.difficulty === progress.currentDifficulty), 3, progress)
        ];
        const scored = pool
          .map(q => ({
            question: q,
            score: getStrategyWeight(q, strategy!, progress),
          }))
          .sort((a, b) => b.score - a.score);

        const priorityCount = 4;
        const explorationCount = 1;
        const priority = scored.slice(0, priorityCount);
        const nonPriorityPool = scored.slice(priorityCount);
        const exploration = nonPriorityPool
          .sort(() => Math.random() - 0.5)
          .slice(0, explorationCount);

        const combined = [...priority, ...exploration].sort(() => Math.random() - 0.5).slice(0, 5);
        selectedQuestions = combined.map(item => item.question);
        recommendations = combined.reduce((acc, item) => {
          acc[item.question.id] = {
            strategy: strategy!,
            reason: buildReason(item.question, strategy!, progress),
            weight: Number(item.score.toFixed(2)),
          };
          return acc;
        }, {} as Record<string, SessionRecommendation>);
      } else if (mode === 'mini') {
        const scored = pool
          .map(q => ({
            question: q,
            score: getStrategyWeight(q, strategy!, progress),
          }))
          .sort((a, b) => b.score - a.score);
        const prioritized = scored.slice(0, 8);
        const exploration = scored.slice(8).sort(() => Math.random() - 0.5).slice(0, 2);
        const combined = [...prioritized, ...exploration].sort(() => Math.random() - 0.5).slice(0, 10);
        selectedQuestions = combined.map(item => item.question);
        recommendations = combined.reduce((acc, item) => {
          acc[item.question.id] = {
            strategy: strategy!,
            reason: buildReason(item.question, strategy!, progress),
            weight: Number(item.score.toFixed(2)),
          };
          return acc;
        }, {} as Record<string, SessionRecommendation>);
        const target = conceptPool ? 5 : 10;
        selectedQuestions = [
          ...pickQuestionsWithRotation(wrongPool, 3, progress),
          ...pickQuestionsWithRotation(normalPool.filter(q => q.difficulty === progress.currentDifficulty), 7, progress)
        ];
      } else {
        selectedQuestions = pickQuestionsWithRotation(pool, 10, progress);
          ...wrongPool.sort(() => Math.random() - 0.5).slice(0, conceptPool ? 2 : 3),
          ...normalPool.filter(q => q.difficulty === progress.currentDifficulty).sort(() => Math.random() - 0.5).slice(0, target)
        ].slice(0, target);

        if (selectedQuestions.length < target) {
          const fill = pool.filter((q) => !selectedQuestions.some((sq) => sq.id === q.id)).sort(() => Math.random() - 0.5).slice(0, target - selectedQuestions.length);
          selectedQuestions = [...selectedQuestions, ...fill];
        }
      } else {
        selectedQuestions = pool.sort(() => Math.random() - 0.5).slice(0, 10);
      } else {
        const adaptive = chooseAdaptiveQuestions(pool, mode, category);
        selectedQuestions = adaptive.selectedQuestions;
        recommendation = adaptive.recommendation;

        setProgress((prev) => ({
          ...prev,
          conceptProfiles: adaptive.conceptProfiles,
        }));
      }
    }

    // Activate the first sub-test's timer immediately
    const finalSubTests = ((mode === 'tryout' || mode === 'simulation') && subTests && subTests.length > 0)
    const finalSubTests = (mode === 'tryout' && subTests && subTests.length > 0)
      ? subTests.map((st, i) => i === 0 ? { ...st, expiresAt: Date.now() + st.timeLimit * 1000 } : st)
      : subTests;

    let remedial: QuizSession['remedial'];
    if (options?.concept && options.remedialPhase) {
      const cycleId = options.cycleId ?? `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      remedial = { cycleId, concept: options.concept, phase: options.remedialPhase };
      if (options.remedialPhase === 'baseline') {
        setProgress(prev => ({
          ...prev,
          remedialCycles: [{
            id: cycleId,
            concept: options.concept!,
            startedAt: new Date().toISOString(),
            status: 'started',
          }, ...prev.remedialCycles],
        }));
      }
    }
    const packageId = mode === 'tryout'
      ? TRYOUT_PACKAGES[Math.floor(Math.random() * TRYOUT_PACKAGES.length)]
      : undefined;

    setSession({
      mode,
      selectedCategory: category,
      questions: selectedQuestions,
      currentIdx: 0,
      answers: {},
      marked: {},
      answerTimeline: {},
      startTime: Date.now(),
      timePerQuestion: {},
      isSubmitted: false,
      subTests: mode === 'tryout' || isStrictSimulation ? finalSubTests : undefined,
      currentSubTestIdx: mode === 'tryout' || isStrictSimulation ? 0 : undefined,
      startTime: Date.now(),
      timePerQuestion: {},
      isSubmitted: false,
      subTests: mode === 'tryout' || isStrictSimulation ? finalSubTests : undefined,
      currentSubTestIdx: mode === 'tryout' || isStrictSimulation ? 0 : undefined,
      recommendations,
      strategy,
      startTime: Date.now(),
      timePerQuestion: {},
      questionStartedAt: Date.now(),
      isSubmitted: false,
      subTests: (mode === 'tryout' || mode === 'simulation') ? finalSubTests : undefined,
      currentSubTestIdx: (mode === 'tryout' || mode === 'simulation') ? 0 : undefined,
      subTests: mode === 'tryout' ? finalSubTests : undefined,
      currentSubTestIdx: mode === 'tryout' ? 0 : undefined,
      recommendation,
      remedial,
      packageId,
    });
  }, [progress, buildReason, getDailyStrategy, getStrategyWeight]);
  }, [chooseAdaptiveQuestions]);

  const setTarget = useCallback((target: UserTarget) => {
    setProgress(prev => ({ ...prev, target }));
  }, []);

  const toggleMark = () => {
    if (!session || session.isSubmitted) return;
    const qId = session.questions[session.currentIdx].id;
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        marked: { ...prev.marked, [qId]: !prev.marked[qId] },
      };
    });
  };

  const answerQuestion = (answer: any) => {
    if (!session || session.isSubmitted) return;

    const qId = session.questions[session.currentIdx].id;
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        answers: { ...prev.answers, [qId]: answer },
        answerTimeline: {
          ...(prev.answerTimeline ?? {}),
          [qId]: [...(prev.answerTimeline?.[qId] ?? []), Date.now()],
        },
      };
    });
  };

  const nextQuestion = () => {
    setSession(prev => {
      if (!prev) return prev;
      const withTime = recordQuestionTime(prev);
      
      // If in sub-test mode, check if we can go to next question within sub-test
      if (withTime.subTests && withTime.currentSubTestIdx !== undefined) {
        const currentSubTest = withTime.subTests[withTime.currentSubTestIdx];
        const lastIdxInSubTest = currentSubTest.questionIndices[currentSubTest.questionIndices.length - 1];
        
        if (withTime.currentIdx < lastIdxInSubTest) {
          return { ...withTime, currentIdx: withTime.currentIdx + 1, questionStartedAt: Date.now() };
        }
        return withTime; // Lock within sub-test
      }

      if (withTime.currentIdx >= withTime.questions.length - 1) return withTime;
      return { ...withTime, currentIdx: withTime.currentIdx + 1, questionStartedAt: Date.now() };

      if (prev.subTests && prev.currentSubTestIdx !== undefined) {
        const currentSubTest = prev.subTests[prev.currentSubTestIdx];
        const lastIdxInSubTest = currentSubTest.questionIndices[currentSubTest.questionIndices.length - 1];

        if (prev.currentIdx < lastIdxInSubTest) {
          return { ...prev, currentIdx: prev.currentIdx + 1 };
        }
      if (prev.subTests && prev.currentSubTestIdx !== undefined) {
        const currentSubTest = prev.subTests[prev.currentSubTestIdx];
        const lastIdxInSubTest = currentSubTest.questionIndices[currentSubTest.questionIndices.length - 1];
        if (prev.currentIdx < lastIdxInSubTest) return { ...prev, currentIdx: prev.currentIdx + 1 };
        return prev;
      }
      if (prev.currentIdx >= prev.questions.length - 1) return prev;
      return { ...prev, currentIdx: prev.currentIdx + 1 };
    });
  };

  const prevQuestion = () => {
    setSession(prev => {
      if (!prev || prev.currentIdx <= 0) return prev;
      const withTime = recordQuestionTime(prev);
      
      // If in sub-test mode, check if we can go to prev question within sub-test
      if (withTime.subTests && withTime.currentSubTestIdx !== undefined) {
        const currentSubTest = withTime.subTests[withTime.currentSubTestIdx];
        const firstIdxInSubTest = currentSubTest.questionIndices[0];
        
        if (withTime.currentIdx > firstIdxInSubTest) {
          return { ...withTime, currentIdx: withTime.currentIdx - 1, questionStartedAt: Date.now() };
        }
        return withTime; // Lock within sub-test
      }

      return { ...withTime, currentIdx: withTime.currentIdx - 1, questionStartedAt: Date.now() };
      if (prev.mode === 'simulation') return prev;
      
      // If in sub-test mode, check if we can go to prev question within sub-test

      if (prev.subTests && prev.currentSubTestIdx !== undefined) {
        const currentSubTest = prev.subTests[prev.currentSubTestIdx];
        const firstIdxInSubTest = currentSubTest.questionIndices[0];

        if (prev.currentIdx > firstIdxInSubTest) {
          return { ...prev, currentIdx: prev.currentIdx - 1 };
        }
      if (prev.subTests && prev.currentSubTestIdx !== undefined) {
        const currentSubTest = prev.subTests[prev.currentSubTestIdx];
        const firstIdxInSubTest = currentSubTest.questionIndices[0];
        if (prev.currentIdx > firstIdxInSubTest) return { ...prev, currentIdx: prev.currentIdx - 1 };
        return prev;
      }
      return { ...prev, currentIdx: prev.currentIdx - 1 };
    });
  };

  const validateAnswer = (q: Question, answer: any): boolean => {
    if (answer === undefined) return false;
    if (q.type === 'multiple_choice') return answer === q.correctAnswer;
    if (q.type === 'complex_multiple_choice') {
      const userAnswers = answer as boolean[];
      return q.complexOptions?.every((opt, idx) => opt.correct === userAnswers[idx]) ?? false;
    }
    if (q.type === 'short_answer') return Number(answer) === q.shortAnswerCorrect;
    return false;
  };

  const submitQuiz = () => {
    if (!session || session.isSubmitted) return;
    const currentQuestion = session.questions[session.currentIdx];
    const finalElapsed = currentQuestion ? Math.max(0, Math.round((Date.now() - session.questionStartedAt) / 1000)) : 0;
    const finalTimePerQuestion = currentQuestion ? {
      ...session.timePerQuestion,
      [currentQuestion.id]: (session.timePerQuestion[currentQuestion.id] || 0) + finalElapsed,
    } : session.timePerQuestion;
  const submitQuiz = (): AssessmentReport | null => {
    if (!session || session.isSubmitted) return null;

    const results = session.questions.map(q => ({
      id: q.id,
      correct: validateAnswer(q, session.answers[q.id]),
      userAnswer: session.answers[q.id],
      category: q.category,
      concept: q.concept,
      question: q,
      irtParams: q.irtParams,
      timeSpent: finalTimePerQuestion[q.id] || 0,
    }));
    const conceptStats = results.reduce((acc, result) => {
      if (!acc[result.concept]) acc[result.concept] = { total: 0, correct: 0 };
      acc[result.concept].total += 1;
      if (result.correct) acc[result.concept].correct += 1;
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    const correctCount = results.filter(r => r.correct).length;
    const today = new Date().toISOString().split('T')[0];
    const durationSecs = Math.max(1, Math.round((Date.now() - session.startTime) / 1000));

    const irtScore = calculateIRTScore(results.map(r => ({
    const irtScore = calculateIRTScore(results.map(r => ({ correct: r.correct, irtParams: r.irtParams })));
    // IRT Scoring
    const rawIrtScore = calculateIRTScore(results.map(r => ({
      correct: r.correct,
      irtParams: r.irtParams
    })));
    const irtScore = applyTryoutEquating(rawIrtScore, session.packageId);

    const { rank, percentile, totalParticipants } = getNationalStats(irtScore);

    const categoryScores = {} as { [key in Category]: number };
    CATEGORIES.forEach(cat => {
    const categoryScores: any = {};
    const categories: Category[] = ['TPS', 'Literasi Indonesia', 'Literasi Inggris', 'Penalaran Matematika'];
    categories.forEach(cat => {
      const catResults = results.filter(r => r.category === cat);
      categoryScores[cat] = catResults.length > 0
        ? calculateIRTScore(catResults.map(r => ({ correct: r.correct, irtParams: r.irtParams })))
        : 0;
    });

    const materialMastery: any = {};
    results.forEach(r => {
      if (!materialMastery[r.concept]) materialMastery[r.concept] = { correct: 0, total: 0 };
      materialMastery[r.concept].total += 1;
      if (r.correct) materialMastery[r.concept].correct += 1;
    });
    Object.keys(materialMastery).forEach(key => {
      materialMastery[key] = Math.round((materialMastery[key].correct / (materialMastery[key].total || 1)) * 100);
    // Material Mastery (session accumulator)
    const sessionMastery: MaterialMasteryAccumulator = {};
    results.forEach(r => {
      if (!sessionMastery[r.concept]) {
        sessionMastery[r.concept] = { correct: 0, total: 0 };
      }
      sessionMastery[r.concept].total += 1;
      if (r.correct) sessionMastery[r.concept].correct += 1;
    });

    const previousMetrics = progress.conceptMetrics ?? {};
    const conceptMetrics = { ...previousMetrics };
    const conceptBucket: Record<string, { correct: number; total: number }> = {};

    results.forEach(result => {
      if (!conceptBucket[result.concept]) conceptBucket[result.concept] = { correct: 0, total: 0 };
      conceptBucket[result.concept].total += 1;
      if (result.correct) conceptBucket[result.concept].correct += 1;
    });

    Object.entries(conceptBucket).forEach(([conceptKey, bucket]) => {
      const concept = conceptKey as Concept;
      const previous = previousMetrics[concept];
      const previousRolling = previous?.rollingAccuracy ?? 0.5;
      const sessionAccuracy = bucket.correct / (bucket.total || 1);
      const rollingAccuracy = clamp((ROLLING_ALPHA * sessionAccuracy) + ((1 - ROLLING_ALPHA) * previousRolling));
      const recentTrend = clamp(
        ((previous?.recentTrend ?? 0) * 0.5) + ((rollingAccuracy - previousRolling) * 0.5),
        -1,
        1
      );
      const totalAttempts = (previous?.totalAttempts ?? 0) + bucket.total;
      const totalCorrect = (previous?.totalCorrect ?? 0) + bucket.correct;
      const confidenceBand = computeConfidenceBand(totalCorrect / (totalAttempts || 1), totalAttempts);
      const history = [...(previous?.history ?? []), {
        date: new Date().toISOString(),
        accuracy: sessionAccuracy,
        sampleSize: bucket.total,
      }].slice(-20);

      conceptMetrics[concept] = {
        totalAttempts,
        totalCorrect,
        rollingAccuracy,
        recentTrend,
        confidenceBand,
        history,
        lastUpdated: new Date().toISOString(),
      };
    });

    const conceptEvaluations = Object.entries(conceptMetrics)
      .map(([concept, metric]) => toConceptEvaluation(concept as Concept, metric))
      .sort((a, b) => a.status.localeCompare(b.status) || a.rollingAccuracy - b.rollingAccuracy);

    // Rationalization Logic
    const baseRecommendations = PTN_DATA.flatMap(ptn => 
    const recommendations = PTN_DATA.flatMap(ptn => 
    const prioritizedWeakConcepts = Object.entries(materialMastery)
      .map(([concept, score]) => ({ concept: concept as Concept, score: score as number }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    const recommendations = PTN_DATA.flatMap(ptn =>
      ptn.prodi.map(prodi => {
        const diff = irtScore - prodi.passingGrade;
        let chance = 0;
        if (diff >= 50) chance = 95;
        else if (diff >= 20) chance = 85;
        else if (diff >= 0) chance = 60;
        else if (diff >= -20) chance = 35;
        else if (diff >= -50) chance = 15;
        else chance = 5;

        const criticalCount = conceptEvaluations.filter(item => item.status === 'Critical').length;
        const confidenceReady = conceptEvaluations.filter(item => item.sampleSize >= MIN_CONCEPT_SAMPLE_FOR_STATUS).length >= 2;
        const guardedChance = confidenceReady ? Math.max(5, chance - (criticalCount * 5)) : chance;

        return {
          ptn: ptn.name,
          prodi: prodi.name,
          chance: guardedChance
        };
        return { ptn: ptn.name, prodi: prodi.name, chance };
      })
    );

    const sessionId = `session-${Date.now()}`;
    const subTestScores = session.subTests?.map(subTest => {
      const subResults = subTest.questionIndices
        .map(index => results[index])
        .filter(Boolean);

      const score = subResults.length > 0
        ? calculateIRTScore(subResults.map(r => ({
            correct: r.correct,
            irtParams: r.irtParams
          })))
        : 0;

      return { subTest: subTest.name, score };
    }) ?? [];

    const updatedSubTestHistory = { ...(progress.subTestHistory ?? {}) };
    subTestScores.forEach(({ subTest, score }) => {
      const history = updatedSubTestHistory[subTest] ?? [];
      updatedSubTestHistory[subTest] = [
        ...history,
        { date: new Date().toISOString(), score, sessionId },
      ].slice(-READINESS_WINDOW);
    });

    const readinessBySubTest = subTestScores.map(({ subTest, score }) => {
      const historyScores = (updatedSubTestHistory[subTest] ?? []).map(entry => entry.score).slice(-READINESS_WINDOW);
      const trend = calculateTrend(historyScores);
      const stability = calculateStability(historyScores);
      const readinessScore = clamp(Math.round(score + trend * 0.35 + (stability - 50) * 2), 0, 1000);

      return {
        subTest,
        score,
        trend,
        stability,
        readiness: getReadinessLevel(readinessScore),
        sampleSize: historyScores.length,
      };
    }).sort((a, b) => {
      const severity = { Kritis: 0, Waspada: 1, Aman: 2 };
      if (severity[a.readiness] !== severity[b.readiness]) {
        return severity[a.readiness] - severity[b.readiness];
      }
      return a.score - b.score;
    });

    const readinessScore = readinessBySubTest.length > 0
      ? Math.round(readinessBySubTest.reduce((acc, item) => acc + (item.score + item.trend * 0.35 + (item.stability - 50) * 2), 0) / readinessBySubTest.length)
      : irtScore;

    const prioritizedKeywords = readinessBySubTest
      .filter(item => item.readiness !== 'Aman')
      .slice(0, 2)
      .map(item => item.subTest.toLowerCase());

    const recommendations = baseRecommendations
      .map(rec => {
        const combined = `${rec.prodi} ${rec.ptn}`.toLowerCase();
        const bonus = prioritizedKeywords.some(keyword => combined.includes(keyword.split(' ')[0])) ? 8 : 0;
        return { ...rec, chance: clamp(rec.chance + bonus, 0, 99) };
      })
      .sort((a, b) => b.chance - a.chance)
      .slice(0, 5);

    const report: AssessmentReport = {
      id: `report-${Date.now()}`,
      date: new Date().toISOString(),
      totalScore: irtScore,
      questionCount: session.questions.length,
      correctCount,
      categoryScores: categoryScores as any,
      readinessScore,
      readinessBySubTest,
      nationalRank: rank,
      totalParticipants,
      percentile,
      materialMastery,
      recommendations,
      simulationAnalysis: session.mode === 'simulation' ? (() => {
        const accuracy = Math.round((correctCount / (session.questions.length || 1)) * 100);
        const answered = results.filter(r => r.timeSpent > 0);
        const avgSpeed = answered.length > 0 ? answered.reduce((acc, r) => acc + r.timeSpent, 0) / answered.length : 0;
        const speed = Math.max(0, Math.min(100, Math.round(100 - (avgSpeed / 180) * 100)));

        const subAccuracies = (session.subTests || []).map(st => {
          const subResults = st.questionIndices.map(i => results[i]).filter(Boolean);
          const subCorrect = subResults.filter(r => r.correct).length;
          return subResults.length ? (subCorrect / subResults.length) * 100 : 0;
        });
        const mean = subAccuracies.length ? subAccuracies.reduce((a, b) => a + b, 0) / subAccuracies.length : accuracy;
        const variance = subAccuracies.length
          ? subAccuracies.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / subAccuracies.length
          : 0;
        const stability = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance))));

        const panicByTime = (session.subTests || []).map(st => {
          const subResults = st.questionIndices.map(i => results[i]).filter(Boolean);
          const firstHalf = subResults.slice(0, Math.ceil(subResults.length / 2));
          const secondHalf = subResults.slice(Math.ceil(subResults.length / 2));
          const firstAcc = firstHalf.length ? firstHalf.filter(r => r.correct).length / firstHalf.length : 0;
          const secondAcc = secondHalf.length ? secondHalf.filter(r => r.correct).length / secondHalf.length : 0;
          return { label: `${st.name} (akhir waktu)`, type: 'time' as const, drop: Math.max(0, Math.round((firstAcc - secondAcc) * 100)) };
        });

        const conceptMap: Record<string, { early: number[]; late: number[] }> = {};
        results.forEach((r, idx) => {
          if (!conceptMap[r.concept]) conceptMap[r.concept] = { early: [], late: [] };
          const target = idx < Math.ceil(results.length / 2) ? conceptMap[r.concept].early : conceptMap[r.concept].late;
          target.push(r.correct ? 1 : 0);
        });
        const panicByConcept = Object.entries(conceptMap).map(([concept, val]) => {
          const earlyAcc = val.early.length ? val.early.reduce((a, b) => a + b, 0) / val.early.length : 0;
          const lateAcc = val.late.length ? val.late.reduce((a, b) => a + b, 0) / val.late.length : 0;
          return { label: concept, type: 'concept' as const, drop: Math.max(0, Math.round((earlyAcc - lateAcc) * 100)) };
        });

        const panicZones = [...panicByTime, ...panicByConcept].filter(p => p.drop >= 15).sort((a, b) => b.drop - a.drop).slice(0, 4);
        const focusConcepts = Object.entries(materialMastery)
          .sort((a, b) => (a[1] as number) - (b[1] as number))
          .slice(0, 3)
          .map(([concept]) => concept as any);
        const nextWeek = new Date();
        nextWeek.setUTCDate(nextWeek.getUTCDate() + ((8 - nextWeek.getUTCDay()) % 7 || 7));

        return {
          accuracy,
          speed,
          stability,
          panicZones,
          remedialPlan: {
            weekStart: nextWeek.toISOString(),
            focusConcepts,
            actions: [
              'Ulangi 2 sesi drill 25 menit pada fokus konsep utama.',
              'Lakukan 1 mini-simulasi dengan batas waktu 70% dari durasi normal.',
              'Evaluasi panic zone di akhir pekan dan bandingkan progres akurasi.',
            ],
          },
        };
      })() : undefined
      conceptEvaluations,
      recommendations,
      prioritizedWeakConcepts,
      materialMastery: {} as AssessmentReport['materialMastery'],
      recommendations
      materialMastery,
      recommendations,
      remedialConcepts: Object.entries(conceptStats)
        .map(([concept, stats]) => {
          const accuracy = Math.round((stats.correct / (stats.total || 1)) * 100);
          const matchedMaterial = findMaterialForConcept(concept);
          return {
            concept,
            accuracy,
            materialId: matchedMaterial?.id,
          };
        })
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3)
    };

    const answerEdits = Object.values(session.answerTimeline ?? {}).map((events) => Math.max(0, events.length - 1));
    const highEditQuestions = answerEdits.filter(v => v >= 2).length;
    const avgTimePerAnswered = durationSecs / Math.max(1, Object.keys(session.answers).length);
    const flags: string[] = [];
    if (avgTimePerAnswered < 20) flags.push('Waktu jawab rata-rata terlalu cepat');
    if (highEditQuestions >= Math.max(2, Math.round(session.questions.length * 0.15))) flags.push('Terlalu banyak ganti jawaban pada soal yang sama');
    if (Object.keys(session.marked).length > Math.round(session.questions.length * 0.35)) flags.push('Proporsi soal ragu-ragu tinggi');

    const instabilityLevel: AssessmentReport['stabilityAnalysis'] = {
      level: flags.length >= 2 ? 'Tidak Stabil' : flags.length === 1 ? 'Perlu Monitoring' : 'Stabil',
      flags,
    };

    const confidenceLevel: AssessmentReport['performancePrediction']['confidenceLevel'] =
      instabilityLevel.level === 'Stabil' ? 'High' : instabilityLevel.level === 'Perlu Monitoring' ? 'Medium' : 'Low';
    const confidenceDelta = confidenceLevel === 'High' ? 40 : confidenceLevel === 'Medium' ? 80 : 130;
    const predictedRange: [number, number] = [
      Math.max(0, Math.round(irtScore - confidenceDelta)),
      Math.min(1000, Math.round(irtScore + confidenceDelta)),
    ];

    const weaknessPriorities = Object.entries(materialMastery)
      .map(([domain, accuracy]) => {
        const priority: 'Kritis' | 'Tinggi' | 'Sedang' =
          accuracy < 45 ? 'Kritis' : accuracy < 65 ? 'Tinggi' : 'Sedang';
        return {
          domain,
          accuracy,
          priority,
          recommendation:
            priority === 'Kritis'
              ? 'Ulang konsep inti + drilling bertahap 20 soal.'
              : priority === 'Tinggi'
                ? 'Perbanyak latihan campuran dengan pembahasan detail.'
                : 'Pertahankan dengan review mingguan.',
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    report.performancePrediction = {
      scoreRange: predictedRange,
      confidenceLevel,
      summary: `Prediksi performa berada di rentang ${predictedRange[0]}–${predictedRange[1]} (confidence ${confidenceLevel}).`,
    };
    report.stabilityAnalysis = instabilityLevel;
    report.weaknessPriorities = weaknessPriorities;

    const answerEdits = Object.values(session.answerTimeline ?? {}).map((events) => Math.max(0, events.length - 1));
    const highEditQuestions = answerEdits.filter(v => v >= 2).length;
    const avgTimePerAnswered = durationSecs / Math.max(1, Object.keys(session.answers).length);
    const flags: string[] = [];
    if (avgTimePerAnswered < 20) flags.push('Waktu jawab rata-rata terlalu cepat');
    if (highEditQuestions >= Math.max(2, Math.round(session.questions.length * 0.15))) flags.push('Terlalu banyak ganti jawaban pada soal yang sama');
    if (Object.keys(session.marked).length > Math.round(session.questions.length * 0.35)) flags.push('Proporsi soal ragu-ragu tinggi');

    const instabilityLevel: AssessmentReport['stabilityAnalysis'] = {
      level: flags.length >= 2 ? 'Tidak Stabil' : flags.length === 1 ? 'Perlu Monitoring' : 'Stabil',
      flags,
    };

    const confidenceLevel: AssessmentReport['performancePrediction']['confidenceLevel'] =
      instabilityLevel.level === 'Stabil' ? 'High' : instabilityLevel.level === 'Perlu Monitoring' ? 'Medium' : 'Low';
    const confidenceDelta = confidenceLevel === 'High' ? 40 : confidenceLevel === 'Medium' ? 80 : 130;
    const predictedRange: [number, number] = [
      Math.max(0, Math.round(irtScore - confidenceDelta)),
      Math.min(1000, Math.round(irtScore + confidenceDelta)),
    ];

    const weaknessPriorities = Object.entries(materialMastery)
      .map(([domain, accuracy]) => {
        const priority: 'Kritis' | 'Tinggi' | 'Sedang' =
          accuracy < 45 ? 'Kritis' : accuracy < 65 ? 'Tinggi' : 'Sedang';
        return {
          domain,
          accuracy,
          priority,
          recommendation:
            priority === 'Kritis'
              ? 'Ulang konsep inti + drilling bertahap 20 soal.'
              : priority === 'Tinggi'
                ? 'Perbanyak latihan campuran dengan pembahasan detail.'
                : 'Pertahankan dengan review mingguan.',
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    report.performancePrediction = {
      scoreRange: predictedRange,
      confidenceLevel,
      summary: `Prediksi performa berada di rentang ${predictedRange[0]}–${predictedRange[1]} (confidence ${confidenceLevel}).`,
    };
    report.stabilityAnalysis = instabilityLevel;
    report.weaknessPriorities = weaknessPriorities;

    setProgress(prev => {
      const newWrongIds = [...prev.wrongIds];
      const newCompletedIds = [...prev.completedIds];
      const updatedStats = { ...prev.categoryStats };
      const updatedUsage = { ...prev.questionUsage };
      const updatedPerformance = { ...prev.questionPerformance };

      results.forEach(r => {
        updatedStats[r.category].total += 1;
        updatedUsage[r.id] = {
          shownCount: (updatedUsage[r.id]?.shownCount ?? 0) + 1,
          lastShownAt: new Date().toISOString(),
        };
        updatedPerformance[r.id] = {
          attempts: (updatedPerformance[r.id]?.attempts ?? 0) + 1,
          wrong: (updatedPerformance[r.id]?.wrong ?? 0) + (r.correct ? 0 : 1),
        };
      const updatedConceptHistory = { ...(prev.conceptHistory ?? {}) };
      const updatedReviewState = { ...(prev.conceptReviewState ?? {}) };

      results.forEach(r => {
        updatedStats[r.category].total += 1;
        const conceptHistory = [...(updatedConceptHistory[r.concept] ?? [])];
        conceptHistory.push(r.correct);
        updatedConceptHistory[r.concept] = conceptHistory.slice(-10);

        const prevReview = updatedReviewState[r.concept] ?? {
          intervalDays: 1,
          easeFactor: 2.5,
        };
        const newEase = r.correct
          ? Math.min(2.8, prevReview.easeFactor + 0.1)
          : Math.max(1.3, prevReview.easeFactor - 0.2);
        const newInterval = r.correct
          ? Math.max(1, Math.round(prevReview.intervalDays * newEase))
          : 1;
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
        updatedReviewState[r.concept] = {
          nextReviewAt: nextReviewDate.toISOString(),
          intervalDays: newInterval,
          easeFactor: newEase,
          lastReviewedAt: new Date().toISOString(),
      const updatedQuestionHistory = { ...(prev.questionHistory ?? {}) };
      const now = Date.now();
      const nextQuestionPerformance = { ...(prev.questionPerformance ?? {}) };
      const attemptAccuracy = correctCount / (session.questions.length || 1);
      const isHighGroup = attemptAccuracy >= 0.7;
      const isLowGroup = attemptAccuracy <= 0.4;

      results.forEach(r => {
        updatedStats[r.category].total += 1;
        const before = updatedQuestionHistory[r.id] ?? { attempts: 0, correct: 0, lastSeenAt: 0, lastCorrectAt: 0, wrongStreak: 0 };

        updatedQuestionHistory[r.id] = {
          attempts: before.attempts + 1,
          correct: before.correct + (r.correct ? 1 : 0),
          lastSeenAt: now,
          lastCorrectAt: r.correct ? now : before.lastCorrectAt,
          wrongStreak: r.correct ? 0 : before.wrongStreak + 1,
        };

        if (r.correct) {
          updatedStats[r.category].correct += 1;
          const idx = newWrongIds.indexOf(r.id);
          if (idx > -1) newWrongIds.splice(idx, 1);
          if (!newCompletedIds.includes(r.id)) newCompletedIds.push(r.id);
        } else if (!newWrongIds.includes(r.id)) {
          newWrongIds.push(r.id);
        }

        const question = session.questions.find(q => q.id === r.id);
        const answer = session.answers[r.id];
        const existing = nextQuestionPerformance[r.id];
        const optionCount = question?.options?.length ?? 0;
        const baseSelections = existing?.optionSelections?.length === optionCount
          ? [...existing.optionSelections]
          : Array(optionCount).fill(0);

        if (question?.type === 'multiple_choice' && typeof answer === 'number' && baseSelections[answer] !== undefined) {
          baseSelections[answer] += 1;
        }

        const attempts = (existing?.attempts ?? 0) + 1;
        const correctAttempts = (existing?.correctAttempts ?? 0) + (r.correct ? 1 : 0);
        const highGroupAttempts = (existing?.highGroupAttempts ?? 0) + (isHighGroup ? 1 : 0);
        const highGroupCorrect = (existing?.highGroupCorrect ?? 0) + (isHighGroup && r.correct ? 1 : 0);
        const lowGroupAttempts = (existing?.lowGroupAttempts ?? 0) + (isLowGroup ? 1 : 0);
        const lowGroupCorrect = (existing?.lowGroupCorrect ?? 0) + (isLowGroup && r.correct ? 1 : 0);

        const pValue = correctAttempts / attempts;
        const highRate = highGroupAttempts ? highGroupCorrect / highGroupAttempts : 0;
        const lowRate = lowGroupAttempts ? lowGroupCorrect / lowGroupAttempts : 0;
        const discriminationIndex = highRate - lowRate;
        const wrongAttempts = Math.max(1, attempts - correctAttempts);

        const distractorStats = (question?.options ?? [])
          .map((_, optionIndex) => {
            if (question.correctAnswer === optionIndex) return null;
            const selectedCount = baseSelections[optionIndex] ?? 0;
            const selectedRate = selectedCount / wrongAttempts;
            return {
              optionIndex,
              selectedCount,
              selectedRate,
              isEffective: selectedRate >= 0.05,
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item));

        const nextStat: QuestionPerformanceStat = {
          questionId: r.id,
          attempts,
          correctAttempts,
          pValue,
          highGroupAttempts,
          highGroupCorrect,
          lowGroupAttempts,
          lowGroupCorrect,
          discriminationIndex,
          optionSelections: baseSelections,
          distractorStats,
          flags: [],
          needsEditorialReview: false,
          lastUpdatedAt: new Date().toISOString(),
        };

        nextStat.flags = evaluateQuestionFlags(nextStat);
        nextStat.needsEditorialReview = nextStat.flags.length > 0;
        nextQuestionPerformance[r.id] = nextStat;
      });

      let newDifficulty: Difficulty = prev.currentDifficulty;
      const accuracy = correctCount / (session.questions.length || 1);
      const isMeaningfulSession = session.questions.length >= 5 && accuracy >= 0.6;
      const updatedQualityDays = { ...prev.qualityDays };
      if (isMeaningfulSession) updatedQualityDays[today] = true;

      const countedDays = Object.keys(updatedQualityDays).sort();
      let qualityStreak = 0;
      if (countedDays.length > 0 && countedDays[countedDays.length - 1] === today) {
        let cursor = new Date(`${today}T00:00:00.000Z`);
        while (true) {
          const key = cursor.toISOString().split('T')[0];
          if (!updatedQualityDays[key]) break;
          qualityStreak += 1;
          cursor.setUTCDate(cursor.getUTCDate() - 1);
        }
      }
      const isHighGroup = accuracy >= 0.7;
      const isLowGroup = accuracy <= 0.4;
      if (accuracy > 0.8) {
        if (newDifficulty === 'easy') newDifficulty = 'medium';
        else if (newDifficulty === 'medium') newDifficulty = 'trap';
      } else if (accuracy < 0.4) {
        if (newDifficulty === 'trap') newDifficulty = 'medium';
        else if (newDifficulty === 'medium') newDifficulty = 'easy';
      }

      const baseReport: AssessmentReport = {
        id: `report-${Date.now()}`,
        date: new Date().toISOString(),
        totalScore: irtScore,
        categoryScores,
        nationalRank: rank,
        totalParticipants,
        percentile,
        materialMastery,
        recommendations,
        readinessIndex: 0,
        trendSessions: 0,
        consistency: 0,
        gapBySubTest: {
          'TPS': 0,
          'Literasi Indonesia': 0,
          'Literasi Inggris': 0,
          'Penalaran Matematika': 0,
        },
        focusRecommendations: [],
      };

      const reportsWithCurrent = [baseReport, ...prev.reports].slice(0, 10);
      const readiness = calculateReadinessInsights(reportsWithCurrent, prev.target);
      const finalReport: AssessmentReport = {
        ...baseReport,
        readinessIndex: readiness.readinessIndex,
        trendSessions: readiness.trendSessions,
        consistency: readiness.consistency,
        gapBySubTest: readiness.gapBySubTest,
        focusRecommendations: readiness.focusRecommendations,
        target: readiness.targetInfo,
      const currentStrategy = session.strategy;
      const previousOutcome = currentStrategy ? prev.strategyOutcomes?.[currentStrategy] : undefined;
      const strategyCorrect = correctCount;
      const strategyTotal = session.questions.length;
      const nextAttempts = (previousOutcome?.attempts ?? 0) + 1;
      const cumulativeCorrect = (previousOutcome?.correct ?? 0) + strategyCorrect;
      const cumulativeTotal = (previousOutcome?.total ?? 0) + strategyTotal;
      const updatedItemPerformance = { ...prev.itemPerformance };
      results.forEach((result) => {
        const existing = updatedItemPerformance[result.id] ?? createEmptyPerformance(result.question);
        const next: ItemPerformance = {
          ...existing,
          attempts: existing.attempts + 1,
          correct: existing.correct + (result.correct ? 1 : 0),
          highGroupAttempts: existing.highGroupAttempts + (isHighGroup ? 1 : 0),
          highGroupCorrect: existing.highGroupCorrect + (isHighGroup && result.correct ? 1 : 0),
          lowGroupAttempts: existing.lowGroupAttempts + (isLowGroup ? 1 : 0),
          lowGroupCorrect: existing.lowGroupCorrect + (isLowGroup && result.correct ? 1 : 0),
          lastUpdatedAt: new Date().toISOString(),
        };

        if (result.question.type === 'multiple_choice' && typeof result.userAnswer === 'number' && next.distractorStats.length > 0) {
          next.distractorStats = next.distractorStats.map((stat) => {
            if (stat.optionIndex !== result.userAnswer) return stat;
            return {
              ...stat,
              selectedCount: stat.selectedCount + 1,
              selectedByCorrect: stat.selectedByCorrect + (result.correct ? 1 : 0),
              selectedByIncorrect: stat.selectedByIncorrect + (result.correct ? 0 : 1),
            };
          });
        }

        next.pValue = next.correct / (next.attempts || 1);
        const highRate = next.highGroupCorrect / (next.highGroupAttempts || 1);
        const lowRate = next.lowGroupCorrect / (next.lowGroupAttempts || 1);
        next.discriminationProxy = highRate - lowRate;
        if (next.distractorStats.length > 0) {
          const plausibleDistractors = next.distractorStats.filter((stat, index) => {
            if (index === result.question.correctAnswer) return false;
            return stat.selectedByIncorrect > 0;
          });
          const denominator = Math.max(1, next.distractorStats.length - 1);
          next.distractorEffectiveness = plausibleDistractors.length / denominator;
        }

        const flagEvaluation = evaluatePerformanceFlag(next);
        next.flaggedIssue = flagEvaluation.flaggedIssue;
        next.isExcludedFromAdaptive = flagEvaluation.isExcludedFromAdaptive;

        updatedItemPerformance[result.id] = next;
      });

      const updatedReports = [report, ...prev.reports].slice(0, 10);
      let updatedCycles = prev.remedialCycles;
      if (session.remedial) {
        const conceptScore = materialMastery[session.remedial.concept] ?? 0;
        updatedCycles = prev.remedialCycles.map((cycle) => {
          if (cycle.id !== session.remedial!.cycleId) return cycle;
          if (session.remedial?.phase === 'baseline') {
            return { ...cycle, baselineScore: conceptScore, status: 'material_pending' as const };
          }
          const baseline = cycle.baselineScore ?? conceptScore;
          const delta = conceptScore - baseline;
          return {
            ...cycle,
            afterScore: conceptScore,
            completedAt: new Date().toISOString(),
            status: delta >= 10 ? 'completed' as const : 'needs_continue' as const,
          };
        });
      }
      const aggregateMastery = { ...(prev.materialMastery ?? {}) };
      Object.entries(sessionMastery).forEach(([concept, sessionValue]) => {
        const previous = aggregateMastery[concept] ?? { correct: 0, total: 0 };
        aggregateMastery[concept] = {
          correct: previous.correct + sessionValue.correct,
          total: previous.total + sessionValue.total,
        };
      });

      const reportMaterialMastery: AssessmentReport['materialMastery'] = {} as AssessmentReport['materialMastery'];
      Object.entries(aggregateMastery).forEach(([concept, value]) => {
        reportMaterialMastery[concept as keyof AssessmentReport['materialMastery']] = Math.round((value.correct / (value.total || 1)) * 100);
      });

      const mergedReport: AssessmentReport = {
        ...report,
        materialMastery: reportMaterialMastery,
      };

      return {
        ...prev,
        conceptHistory: updatedConceptHistory,
        conceptReviewState: updatedReviewState,
        completedIds: newCompletedIds,
        wrongIds: newWrongIds,
        streak: correctCount === session.questions.length ? prev.streak + 1 : 0,
        qualityStreak,
        qualityDays: updatedQualityDays,
        dailyProgress: {
          ...prev.dailyProgress,
          [today]: (prev.dailyProgress[today] || 0) + correctCount,
        },
        categoryStats: updatedStats,
        currentDifficulty: newDifficulty,
        materialMastery: aggregateMastery,
        reports: [mergedReport, ...prev.reports].slice(0, 10),
        materialMastery: { ...(prev.materialMastery ?? {}), ...materialMastery },
        subTestHistory: updatedSubTestHistory,
        subTestHistory: [
          {
            date: finalReport.date,
            scores: finalReport.categoryScores,
            consistency: finalReport.consistency,
          },
          ...prev.subTestHistory,
        ].slice(0, 20),
        reports: [finalReport, ...prev.reports].slice(0, 10),
        conceptLastSeen: {
          ...(prev.conceptLastSeen ?? {}),
          ...Object.fromEntries(results.map(r => [r.concept, new Date().toISOString()])),
        },
        itemPerformance: updatedItemPerformance,
        conceptMetrics,
        questionHistory: updatedQuestionHistory,
        reports: updatedReports,
        conceptProfiles: computeConceptProfiles(updatedQuestionHistory, updatedReports),
        lastRemedialConcepts: report.remedialConcepts ?? [],
        reports: [report, ...prev.reports].slice(0, 10),
        questionUsage: updatedUsage,
        questionPerformance: updatedPerformance,
        strategyOutcomes: currentStrategy
          ? {
              ...(prev.strategyOutcomes ?? {}),
              [currentStrategy]: {
                attempts: nextAttempts,
                correct: cumulativeCorrect,
                total: cumulativeTotal,
                avgAccuracy: Number(((cumulativeCorrect / (cumulativeTotal || 1)) * 100).toFixed(2)),
              },
            }
          : prev.strategyOutcomes,
        remedialCycles: updatedCycles,
        questionPerformance: nextQuestionPerformance,
      };
    });

    setSession(prev => prev ? { ...prev, isSubmitted: true, timePerQuestion: finalTimePerQuestion } : null);
    setSession(prev => prev ? { ...prev, isSubmitted: true } : null);
    return report;
  };

  const nextSubTest = () => {
    setSession(prev => {
      if (!prev || prev.isSubmitted || prev.currentSubTestIdx === undefined || !prev.subTests) return prev;
      if (prev.currentSubTestIdx < prev.subTests.length - 1) {
        const nextIdx = prev.currentSubTestIdx + 1;
        const nextSubTest = prev.subTests[nextIdx];
        if (nextSubTest && nextSubTest.questionIndices && nextSubTest.questionIndices.length > 0) {
          const updatedSubTests = prev.subTests.map((st, i) =>
            i === nextIdx ? { ...st, expiresAt: Date.now() + st.timeLimit * 1000 } : st
          );
          return {
            ...prev,
            subTests: updatedSubTests,
            currentSubTestIdx: nextIdx,
            currentIdx: nextSubTest.questionIndices[0],
            questionStartedAt: Date.now(),
          };
        }
      }
      return prev;
    });
  };

  const updateConceptMasteryFromCheckpoint = useCallback((concept: string, scorePercent: number) => {
    const boundedScore = Math.max(0, Math.min(100, Math.round(scorePercent)));
    setProgress(prev => {
      const prevMastery = prev.materialMastery?.[concept] ?? 0;
      const blended = Math.round((prevMastery * 0.65) + (boundedScore * 0.35));
      return {
        ...prev,
        materialMastery: {
          ...(prev.materialMastery ?? {}),
          [concept]: blended,
        },
      };
    });
  }, []);
  const markMaterialRead = (cycleId: string) => {
    setProgress(prev => ({
      ...prev,
      remedialCycles: prev.remedialCycles.map((cycle) =>
        cycle.id === cycleId
          ? { ...cycle, materialReadAt: new Date().toISOString(), status: cycle.status === 'started' ? 'material_pending' : cycle.status }
          : cycle
      )
    }));
  };

  return {
    progress,
    session,
    startSession,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    submitQuiz,
    nextSubTest,
    toggleMark,
    setSession,
    revisionPriorityQueue: buildRevisionPriorityQueue(progress.questionPerformance),
    setTarget,
    updateConceptMasteryFromCheckpoint,
    markMaterialRead,
  };
}
