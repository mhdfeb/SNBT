import { useState, useEffect, useCallback, useRef } from 'react';
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

export function useQuiz() {
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
      return migrateProgress(parsed);
      return {
        ...INITIAL_PROGRESS,
        ...parsed,
        materialMastery: parsed.materialMastery ?? {},
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
    let recommendation: QuizSession['recommendation'];

    if (mode === 'tryout') {
      let currentIdxOffset = 0;
      const usedIds = new Set<string>();

      SUB_TEST_CONFIGS.forEach(config => {
        const subPool = QUESTIONS.filter(q =>
          !usedIds.has(q.id) &&
          (q.concept === config.name || (q.category === config.category && q.concept.includes(config.name)))
        );

        let finalPool = subPool;
        if (finalPool.length < config.count) {
          const catPool = QUESTIONS.filter(q => !usedIds.has(q.id) && q.category === config.category);
          finalPool = [...finalPool, ...catPool.filter(q => !finalPool.some(fq => fq.id === q.id))];
        }

        if (finalPool.length < config.count) {
          const remainingNeeded = config.count - finalPool.length;
          const otherPool = QUESTIONS.filter(q => !finalPool.some(fq => fq.id === q.id));
          const additional = [...otherPool].sort(() => Math.random() - 0.5).slice(0, remainingNeeded);
          finalPool = [...finalPool, ...additional];
        }

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
      const pool = category
        ? QUESTIONS.filter(q => q.category === category)
        : [...QUESTIONS];

      if (mode === 'category') {
      const conceptPool = options?.concept ? pickConceptPool(options.concept) : null;
      const pool = conceptPool ?? (category ? QUESTIONS.filter(q => q.category === category) : [...QUESTIONS]);

      const wrongPool = pool.filter(q => progress.wrongIds.includes(q.id));
      const normalPool = pool.filter(q => !progress.wrongIds.includes(q.id));

      if (mode === 'daily') {
        selectedQuestions = [
          ...wrongPool.sort(() => Math.random() - 0.5).slice(0, 2),
          ...normalPool.filter(q => q.difficulty === progress.currentDifficulty).sort(() => Math.random() - 0.5).slice(0, 3)
        ];
      } else if (mode === 'mini') {
        const target = conceptPool ? 5 : 10;
        selectedQuestions = [
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
      startTime: Date.now(),
      timePerQuestion: {},
      isSubmitted: false,
      subTests: mode === 'tryout' ? finalSubTests : undefined,
      currentSubTestIdx: mode === 'tryout' ? 0 : undefined,
      recommendation,
      remedial,
      packageId,
    });
  }, [chooseAdaptiveQuestions]);

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
      };
    });
  };

  const nextQuestion = () => {
    setSession(prev => {
      if (!prev) return prev;

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

  const submitQuiz = (): AssessmentReport | null => {
    if (!session || session.isSubmitted) return null;

    const results = session.questions.map(q => ({
      id: q.id,
      correct: validateAnswer(q, session.answers[q.id]),
      category: q.category,
      concept: q.concept,
      irtParams: q.irtParams,
    }));
    const conceptStats = results.reduce((acc, result) => {
      if (!acc[result.concept]) acc[result.concept] = { total: 0, correct: 0 };
      acc[result.concept].total += 1;
      if (result.correct) acc[result.concept].correct += 1;
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    const correctCount = results.filter(r => r.correct).length;
    const today = new Date().toISOString().split('T')[0];

    const irtScore = calculateIRTScore(results.map(r => ({
    const irtScore = calculateIRTScore(results.map(r => ({ correct: r.correct, irtParams: r.irtParams })));
    // IRT Scoring
    const rawIrtScore = calculateIRTScore(results.map(r => ({
      correct: r.correct,
      irtParams: r.irtParams
    })));
    const irtScore = applyTryoutEquating(rawIrtScore, session.packageId);

    const { rank, percentile, totalParticipants } = getNationalStats(irtScore);

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
    ).sort((a, b) => b.chance - a.chance).slice(0, 5);

    const report: AssessmentReport = {
      id: `report-${Date.now()}`,
      date: new Date().toISOString(),
      totalScore: irtScore,
      categoryScores: categoryScores as any,
      nationalRank: rank,
      totalParticipants,
      percentile,
      materialMastery,
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

    setProgress(prev => {
      const newWrongIds = [...prev.wrongIds];
      const newCompletedIds = [...prev.completedIds];
      const updatedStats = { ...prev.categoryStats };
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
      if (accuracy > 0.8) {
        if (newDifficulty === 'easy') newDifficulty = 'medium';
        else if (newDifficulty === 'medium') newDifficulty = 'trap';
      } else if (accuracy < 0.4) {
        if (newDifficulty === 'trap') newDifficulty = 'medium';
        else if (newDifficulty === 'medium') newDifficulty = 'easy';
      }

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
        completedIds: newCompletedIds,
        wrongIds: newWrongIds,
        streak: correctCount === session.questions.length ? prev.streak + 1 : 0,
        dailyProgress: {
          ...prev.dailyProgress,
          [today]: (prev.dailyProgress[today] || 0) + correctCount,
        },
        categoryStats: updatedStats,
        currentDifficulty: newDifficulty,
        materialMastery: aggregateMastery,
        reports: [mergedReport, ...prev.reports].slice(0, 10),
        materialMastery: { ...(prev.materialMastery ?? {}), ...materialMastery },
        conceptMetrics,
        questionHistory: updatedQuestionHistory,
        reports: updatedReports,
        conceptProfiles: computeConceptProfiles(updatedQuestionHistory, updatedReports),
        lastRemedialConcepts: report.remedialConcepts ?? [],
        reports: [report, ...prev.reports].slice(0, 10),
        remedialCycles: updatedCycles,
        questionPerformance: nextQuestionPerformance,
      };
    });

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
          };
        }
      }
      return prev;
    });
  };

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
    markMaterialRead,
  };
}
