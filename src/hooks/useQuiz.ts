import { useCallback, useEffect, useMemo, useState } from 'react';
import { QUESTIONS } from '../data/questions';
import type {
  AssessmentReport,
  Category,
  Concept,
  QuestionAnswer,
  QuizSession,
  TargetedDrillResult,
  UserProgress,
  UserTarget,
} from '../types/quiz';
import { calculateSessionReport } from './quiz/analyticsScoring';
import { loadProgressFromStorage, STORAGE_KEY } from './quiz/progressMigration';
import { buildSubTestConfig, pickQuestionsByMode } from './quiz/questionSelection';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function useQuiz() {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgressFromStorage());
  const [session, setSession] = useState<QuizSession | null>(null);
  const [lastDrillResult, setLastDrillResult] = useState<TargetedDrillResult | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const startSession = useCallback(
    (
      mode: QuizSession['mode'],
      category?: Category,
      options?: { concept?: Concept; remedialPhase?: 'baseline' | 'after'; cycleId?: string },
    ) => {
      const selectedQuestions = pickQuestionsByMode(QUESTIONS, progress, mode, category, options?.concept);
      const now = Date.now();
      const subTestConfig = buildSubTestConfig(mode);
      const shouldUseSubTests = subTestConfig.length > 0;
      const builtSubTests = shouldUseSubTests
        ? (() => {
            let cursor = 0;
            return subTestConfig
              .map((subTest) => {
                const endExclusive = Math.min(cursor + subTest.questionCount, selectedQuestions.length);
                const questionIndices = Array.from({ length: Math.max(0, endExclusive - cursor) }, (_, idx) => cursor + idx);
                cursor = endExclusive;

                return {
                  name: subTest.name,
                  questionIndices,
                  timeLimit: subTest.timeLimitSec,
                  expiresAt: now + subTest.timeLimitSec * 1000,
                };
              })
              .filter((subTest) => subTest.questionIndices.length > 0);
          })()
        : undefined;

      const totalTimeLimitSec = builtSubTests?.reduce((total, subTest) => total + subTest.timeLimit, 0);
      const firstSubTestQuestion = builtSubTests?.[0]?.questionIndices?.[0] ?? 0;

      setSession({
        mode,
        selectedCategory: category,
        questions: selectedQuestions,
        currentIdx: firstSubTestQuestion,
        answers: {},
        marked: {},
        answerTimeline: {},
        startTime: now,
        timePerQuestion: {},
        questionStartedAt: now,
        isSubmitted: false,
        subTests: builtSubTests,
        currentSubTestIdx: builtSubTests?.length ? 0 : undefined,
        totalTimeLimitSec,
        totalExpiresAt: totalTimeLimitSec ? now + totalTimeLimitSec * 1000 : undefined,
        targetedMeta: options?.concept
          ? {
              concept: options.concept,
              baselineAccuracy: progress.materialMastery?.[options.concept] ?? 0,
            }
          : undefined,
        remedial:
          options?.concept && options?.cycleId && options?.remedialPhase
            ? {
                cycleId: options.cycleId,
                concept: options.concept,
                phase: options.remedialPhase,
              }
            : undefined,
      } as QuizSession);
    },
    [progress],
  );

  const answerQuestion = useCallback((answer: QuestionAnswer) => {
    setSession((prev) => {
      if (!prev || prev.isSubmitted) return prev;
      const qid = prev.questions[prev.currentIdx]?.id;
      if (!qid) return prev;

      return {
        ...prev,
        answers: { ...prev.answers, [qid]: answer },
        answerTimeline: {
          ...(prev.answerTimeline ?? {}),
          [qid]: [...((prev.answerTimeline?.[qid] ?? []) as number[]), Date.now()],
        },
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const activeSubTest = prev.subTests?.[prev.currentSubTestIdx ?? 0];
      const maxIndexInSubTest = activeSubTest?.questionIndices?.[activeSubTest.questionIndices.length - 1];
      const maxAllowedIdx = maxIndexInSubTest ?? prev.questions.length - 1;
      if (prev.currentIdx >= maxAllowedIdx) return prev;
      return { ...prev, currentIdx: prev.currentIdx + 1, questionStartedAt: Date.now() };
    });
  }, []);

  const prevQuestion = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const activeSubTest = prev.subTests?.[prev.currentSubTestIdx ?? 0];
      const minAllowedIdx = activeSubTest?.questionIndices?.[0] ?? 0;
      if (prev.currentIdx <= minAllowedIdx) return prev;
      return { ...prev, currentIdx: prev.currentIdx - 1, questionStartedAt: Date.now() };
    });
  }, []);

  const toggleMark = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.isSubmitted) return prev;
      const qid = prev.questions[prev.currentIdx]?.id;
      if (!qid) return prev;
      return {
        ...prev,
        marked: {
          ...prev.marked,
          [qid]: !prev.marked[qid],
        },
      };
    });
  }, []);

  const submitQuiz = useCallback((): AssessmentReport | null => {
    if (!session) return null;

    const report = calculateSessionReport(session, progress);
    const today = new Date().toISOString().slice(0, 10);

    setProgress((prev) => {
      const nowIso = new Date().toISOString();
      const newCompletedIds = Array.from(new Set([...prev.completedIds, ...session.questions.map((q) => q.id)]));
      const perQuestionResult = session.questions.map((q) => {
        const answer = session.answers[q.id];
        const isCorrect =
          q.type === 'multiple_choice'
            ? answer === q.correctAnswer
            : q.type === 'short_answer'
              ? Number(answer) === Number(q.shortAnswerCorrect)
              : false;
        return { questionId: q.id, isCorrect };
      });
      const wrongIds = perQuestionResult.filter((item) => !item.isCorrect).map((item) => item.questionId);

      const mergedWrong = Array.from(new Set([...prev.wrongIds, ...wrongIds]));
      const nextDifficulty = report.totalScore >= 700 ? 'trap' : report.totalScore >= 550 ? 'medium' : 'easy';
      const updatedQuestionUsage = perQuestionResult.reduce(
        (acc, item) => {
          const current = acc[item.questionId] ?? { shownCount: 0, lastShownAt: null };
          acc[item.questionId] = {
            shownCount: (current.shownCount ?? 0) + 1,
            lastShownAt: nowIso,
          };
          return acc;
        },
        { ...(prev.questionUsage ?? {}) } as NonNullable<UserProgress['questionUsage']>,
      );
      const updatedQuestionPerformance = perQuestionResult.reduce(
        (acc, item) => {
          const current = acc[item.questionId] ?? { attempts: 0, wrong: 0 };
          acc[item.questionId] = {
            attempts: (current.attempts ?? 0) + 1,
            wrong: (current.wrong ?? 0) + (item.isCorrect ? 0 : 1),
          };
          return acc;
        },
        { ...(prev.questionPerformance ?? {}) } as NonNullable<UserProgress['questionPerformance']>,
      );

      const updatedStrategyOutcomes = (() => {
        if (!session.strategy) return prev.strategyOutcomes ?? {};
        const current = prev.strategyOutcomes?.[session.strategy] ?? {
          attempts: 0,
          correct: 0,
          total: 0,
          avgAccuracy: 0,
        };
        const nextAttempts = current.attempts + 1;
        const nextCorrect = current.correct + (report.correctCount ?? 0);
        const nextTotal = current.total + session.questions.length;

        return {
          ...(prev.strategyOutcomes ?? {}),
          [session.strategy]: {
            attempts: nextAttempts,
            correct: nextCorrect,
            total: nextTotal,
            avgAccuracy: nextTotal > 0 ? Math.round((nextCorrect / nextTotal) * 100) : 0,
          },
        };
      })();

      const updatedRemedialCycles = (() => {
        if (session.mode !== 'targeted' || !session.remedial?.cycleId) return prev.remedialCycles ?? [];

        const conceptScore =
          report.materialMastery?.[session.remedial.concept] ?? prev.materialMastery?.[session.remedial.concept] ?? 0;

        return (prev.remedialCycles ?? []).map((cycle) => {
          if (cycle.id !== session.remedial?.cycleId) return cycle;

          if (session.remedial.phase === 'baseline') {
            return {
              ...cycle,
              baselineScore: conceptScore,
              status: 'material_pending' as const,
            };
          }

          const baselineScore = cycle.baselineScore ?? conceptScore;
          const status: 'completed' | 'needs_continue' = conceptScore >= baselineScore ? 'completed' : 'needs_continue';
          return {
            ...cycle,
            afterScore: conceptScore,
            completedAt: nowIso,
            status,
          };
        });
      })();

      const updatedProgress: UserProgress = {
        ...prev,
        storageVersion: 4,
        completedIds: newCompletedIds,
        wrongIds: mergedWrong,
        currentDifficulty: nextDifficulty,
        reports: [report, ...(prev.reports ?? [])].slice(0, 20),
        simulationReports:
          session.mode === 'simulation'
            ? [report, ...(prev.simulationReports ?? [])].slice(0, 20)
            : (prev.simulationReports ?? []),
        materialMastery: { ...(prev.materialMastery ?? {}), ...(report.materialMastery ?? {}) },
        questionUsage: updatedQuestionUsage,
        questionPerformance: updatedQuestionPerformance,
        strategyOutcomes: updatedStrategyOutcomes,
        remedialCycles: updatedRemedialCycles,
        dailyProgress: {
          ...prev.dailyProgress,
          [today]: clamp((prev.dailyProgress?.[today] ?? 0) + (report.correctCount ?? 0), 0, 200),
        },
      };

      return updatedProgress;
    });

    if (session.mode === 'targeted' && session.targetedMeta) {
      const postAccuracy = report.materialMastery?.[session.targetedMeta.concept] ?? session.targetedMeta.baselineAccuracy;
      setLastDrillResult({
        id: `drill-${Date.now()}`,
        date: new Date().toISOString(),
        concept: session.targetedMeta.concept,
        baselineAccuracy: session.targetedMeta.baselineAccuracy,
        postAccuracy,
        delta: postAccuracy - session.targetedMeta.baselineAccuracy,
        totalQuestions: session.questions.length,
      });
    }

    setSession((prev) => (prev ? { ...prev, isSubmitted: true } : null));
    return report;
  }, [progress, session]);

  const nextSubTest = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.isSubmitted) return prev;
      if (!Array.isArray(prev.subTests) || prev.subTests.length === 0) return prev;

      const now = Date.now();
      const totalSubTests = prev.subTests.length;
      const rawCurrentSubTestIdx = prev.currentSubTestIdx ?? 0;
      const currentSubTestIdx =
        Number.isInteger(rawCurrentSubTestIdx) && rawCurrentSubTestIdx >= 0 && rawCurrentSubTestIdx < totalSubTests
          ? rawCurrentSubTestIdx
          : 0;
      const isLastSubTest = currentSubTestIdx >= totalSubTests - 1;

      if (isLastSubTest) {
        return {
          ...prev,
          isSubmitted: true,
          questionStartedAt: now,
        };
      }

      const nextSubTestIdx = currentSubTestIdx + 1;
      const nextSubTest = prev.subTests[nextSubTestIdx];
      const nextQuestionIdxCandidate = nextSubTest?.questionIndices?.[0];
      const nextQuestionIdx =
        typeof nextQuestionIdxCandidate === 'number'
          ? clamp(nextQuestionIdxCandidate, 0, Math.max(prev.questions.length - 1, 0))
          : prev.currentIdx;

      return {
        ...prev,
        currentSubTestIdx: nextSubTestIdx,
        currentIdx: nextQuestionIdx,
        questionStartedAt: now,
        subTests: prev.subTests.map((subTest, idx) =>
          idx === nextSubTestIdx
            ? {
                ...subTest,
                expiresAt:
                  typeof subTest.expiresAt === 'number' ? now + Math.max(0, (subTest.timeLimit ?? 0) * 1000) : subTest.expiresAt,
              }
            : subTest,
        ),
      };
    });
  }, []);

  const setTarget = useCallback((target: UserTarget) => {
    setProgress((prev) => ({ ...prev, target }));
  }, []);

  const updateConceptMasteryFromCheckpoint = useCallback((concept: string, scorePercent: number) => {
    setProgress((prev) => {
      const previous = prev.materialMastery?.[concept] ?? 50;
      const blended = Math.round(previous * 0.6 + clamp(scorePercent, 0, 100) * 0.4);
      return {
        ...prev,
        materialMastery: {
          ...(prev.materialMastery ?? {}),
          [concept]: blended,
        },
      };
    });
  }, []);

  const markMaterialRead = useCallback((cycleId: string) => {
    setProgress((prev) => ({
      ...prev,
      remedialCycles: (prev.remedialCycles ?? []).map((cycle: any) =>
        cycle.id === cycleId ? { ...cycle, materialReadAt: new Date().toISOString() } : cycle,
      ),
    }));
  }, []);

  const revisionPriorityQueue = useMemo(
    () =>
      Object.entries(progress.questionPerformance ?? {})
        .map(([questionId, stat]: [string, any]) => ({
          questionId,
          wrongRate: stat.attempts > 0 ? stat.wrong / stat.attempts : 0,
          attempts: stat.attempts ?? 0,
          shownCount: progress.questionUsage?.[questionId]?.shownCount ?? 0,
          lastShownAt: progress.questionUsage?.[questionId]?.lastShownAt ?? null,
        }))
        .sort(
          (a, b) =>
            b.wrongRate - a.wrongRate ||
            b.attempts - a.attempts ||
            b.shownCount - a.shownCount ||
            (b.lastShownAt ? new Date(b.lastShownAt).getTime() : 0) - (a.lastShownAt ? new Date(a.lastShownAt).getTime() : 0),
        )
        .slice(0, 20),
    [progress.questionPerformance, progress.questionUsage],
  );

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
    lastDrillResult,
    revisionPriorityQueue,
    setTarget,
    updateConceptMasteryFromCheckpoint,
    markMaterialRead,
  };
}
