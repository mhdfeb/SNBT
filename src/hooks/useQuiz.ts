import { useState, useEffect, useCallback, useRef } from 'react';
import { Question, UserProgress, QuizSession, Difficulty, Category, AssessmentReport, Concept } from '../types/quiz';
import { Question, UserProgress, QuizSession, Difficulty, Category, AssessmentReport, QuestionPerformanceStat } from '../types/quiz';
import { QUESTIONS } from '../data/questions';
import { applyTryoutEquating, calculateIRTScore, getNationalStats } from '../lib/irt';
import { PTN_DATA } from '../data/ptn';
import { STUDY_MATERIALS } from '../data/materials';

const STORAGE_KEY = 'ppu_master_progress_v3';

type MaterialMasteryAccumulator = { [concept: string]: { correct: number; total: number } };

const INITIAL_PROGRESS: UserProgress = {
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
];

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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
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
      remedial,
      packageId,
    });
  }, [progress]);

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
      const nextQuestionPerformance = { ...(prev.questionPerformance ?? {}) };
      const attemptAccuracy = correctCount / (session.questions.length || 1);
      const isHighGroup = attemptAccuracy >= 0.7;
      const isLowGroup = attemptAccuracy <= 0.4;

      results.forEach(r => {
        updatedStats[r.category].total += 1;
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
