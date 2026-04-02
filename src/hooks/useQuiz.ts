import { useCallback, useEffect, useMemo, useState } from 'react';
import { QUESTIONS } from '../data/questions';
import type { AssessmentReport, Category, Concept, QuizSession, TargetedDrillResult, UserProgress, UserTarget } from '../types/quiz';
import { calculateSessionReport } from './quiz/analyticsScoring';
import { loadProgressFromStorage, STORAGE_KEY } from './quiz/progressMigration';
import { pickQuestionsByMode } from './quiz/questionSelection';

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

      setSession({
        mode,
        selectedCategory: category,
        questions: selectedQuestions,
        currentIdx: 0,
        answers: {},
        marked: {},
        answerTimeline: {},
        startTime: now,
        timePerQuestion: {},
        questionStartedAt: now,
        isSubmitted: false,
        targetedMeta: options?.concept
          ? {
              concept: options.concept,
              baselineAccuracy: progress.materialMastery?.[options.concept] ?? 0,
            }
          : undefined,
      } as QuizSession);
    },
    [progress],
  );

  const answerQuestion = useCallback((answer: unknown) => {
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
      if (prev.currentIdx >= prev.questions.length - 1) return prev;
      return { ...prev, currentIdx: prev.currentIdx + 1, questionStartedAt: Date.now() };
    });
  }, []);

  const prevQuestion = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.currentIdx <= 0) return prev;
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
      const newCompletedIds = Array.from(new Set([...prev.completedIds, ...session.questions.map((q) => q.id)]));
      const wrongIds = session.questions
        .filter((q) => {
          const answer = session.answers[q.id];
          if (q.type === 'multiple_choice') return answer !== q.correctAnswer;
          if (q.type === 'short_answer') return Number(answer) !== Number(q.shortAnswerCorrect);
          return false;
        })
        .map((q) => q.id);

      const mergedWrong = Array.from(new Set([...prev.wrongIds, ...wrongIds]));
      const nextDifficulty = report.totalScore >= 700 ? 'trap' : report.totalScore >= 550 ? 'medium' : 'easy';

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
                  typeof subTest.timeLimit === 'number'
                    ? now + Math.max(0, subTest.timeLimit * 1000)
                    : subTest.expiresAt,
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
        }))
        .sort((a, b) => b.wrongRate - a.wrongRate || b.attempts - a.attempts)
        .slice(0, 20),
    [progress.questionPerformance],
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
