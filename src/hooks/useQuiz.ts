import { useState, useEffect, useCallback, useRef } from 'react';
import { Question, UserProgress, QuizSession, Difficulty, Category, AssessmentReport, QuizStrategy, SessionRecommendation } from '../types/quiz';
import { QUESTIONS } from '../data/questions';
import { calculateIRTScore, getNationalStats } from '../lib/irt';
import { PTN_DATA } from '../data/ptn';

const STORAGE_KEY = 'ppu_master_progress_v3';

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
  conceptHistory: {},
  conceptReviewState: {},
  strategyOutcomes: {},
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

  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...INITIAL_PROGRESS, ...parsed, materialMastery: parsed.materialMastery ?? {} };
    }
    return INITIAL_PROGRESS;
  });

  const [session, setSession] = useState<QuizSession | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Timer logic for sub-tests — check expiry only, no per-second state update
  useEffect(() => {
    if (session && !session.isSubmitted && session.subTests && session.currentSubTestIdx !== undefined) {
      const currentSubTest = session.subTests[session.currentSubTestIdx];
      if (!currentSubTest || currentSubTest.expiresAt === 0) return;

      timerRef.current = setInterval(() => {
        setSession(prev => {
          if (!prev || prev.isSubmitted || prev.currentSubTestIdx === undefined || !prev.subTests) return prev;

          const subTest = prev.subTests[prev.currentSubTestIdx];
          if (!subTest || subTest.expiresAt === 0 || Date.now() < subTest.expiresAt) return prev;

          // Time is up — auto-advance or submit
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

  const startSession = useCallback((mode: QuizSession['mode'], category?: Category) => {
    let selectedQuestions: Question[] = [];
    let subTests: QuizSession['subTests'] = [];
    let recommendations: QuizSession['recommendations'] = {};
    let strategy: QuizSession['strategy'] = undefined;

    if (mode === 'tryout') {
      // Full Tryout: All sub-tests
      let currentIdxOffset = 0;
      const usedIds = new Set<string>();

      SUB_TEST_CONFIGS.forEach(config => {
        // Filter questions by concept or category, excluding already used ones
        const subPool = QUESTIONS.filter(q => 
          !usedIds.has(q.id) && 
          (q.concept === config.name || (q.category === config.category && q.concept.includes(config.name)))
        );
        
        // If pool is too small, fallback to category pool (excluding used)
        let finalPool = subPool;
        if (finalPool.length < config.count) {
          const catPool = QUESTIONS.filter(q => !usedIds.has(q.id) && q.category === config.category);
          finalPool = [...finalPool, ...catPool.filter(q => !finalPool.some(fq => fq.id === q.id))];
        }

        // If still too small, fallback to any questions (even used) to prevent empty sub-tests
        if (finalPool.length < config.count) {
          const remainingNeeded = config.count - finalPool.length;
          const otherPool = QUESTIONS.filter(q => !finalPool.some(fq => fq.id === q.id));
          // Shuffle otherPool and take what's needed
          const additional = [...otherPool].sort(() => Math.random() - 0.5).slice(0, remainingNeeded);
          finalPool = [...finalPool, ...additional];
        }

        // Final safety check: if still empty (should only happen if QUESTIONS is empty), skip or fill with anything
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
            expiresAt: 0, // set when sub-test becomes active
          });
          currentIdxOffset += shuffled.length;
        }
      });
    } else {
      const pool = category 
        ? QUESTIONS.filter(q => q.category === category)
        : [...QUESTIONS];
      strategy = mode === 'daily' ? getDailyStrategy(pool, progress) : mode === 'mini' ? 'exam_simulation' : undefined;

      if (mode === 'daily') {
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
      } else {
        selectedQuestions = pool.sort(() => Math.random() - 0.5).slice(0, 10);
      }
    }

    // Activate the first sub-test's timer immediately
    const finalSubTests = (mode === 'tryout' && subTests && subTests.length > 0)
      ? subTests.map((st, i) => i === 0 ? { ...st, expiresAt: Date.now() + st.timeLimit * 1000 } : st)
      : subTests;

    setSession({
      mode,
      selectedCategory: category,
      questions: selectedQuestions,
      currentIdx: 0,
      answers: {},
      marked: {},
      recommendations,
      strategy,
      startTime: Date.now(),
      timePerQuestion: {},
      isSubmitted: false,
      subTests: mode === 'tryout' ? finalSubTests : undefined,
      currentSubTestIdx: mode === 'tryout' ? 0 : undefined,
    });
  }, [progress, buildReason, getDailyStrategy, getStrategyWeight]);

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
      
      // If in sub-test mode, check if we can go to next question within sub-test
      if (prev.subTests && prev.currentSubTestIdx !== undefined) {
        const currentSubTest = prev.subTests[prev.currentSubTestIdx];
        const lastIdxInSubTest = currentSubTest.questionIndices[currentSubTest.questionIndices.length - 1];
        
        if (prev.currentIdx < lastIdxInSubTest) {
          return { ...prev, currentIdx: prev.currentIdx + 1 };
        }
        return prev; // Lock within sub-test
      }

      if (prev.currentIdx >= prev.questions.length - 1) return prev;
      return { ...prev, currentIdx: prev.currentIdx + 1 };
    });
  };

  const prevQuestion = () => {
    setSession(prev => {
      if (!prev || prev.currentIdx <= 0) return prev;
      
      // If in sub-test mode, check if we can go to prev question within sub-test
      if (prev.subTests && prev.currentSubTestIdx !== undefined) {
        const currentSubTest = prev.subTests[prev.currentSubTestIdx];
        const firstIdxInSubTest = currentSubTest.questionIndices[0];
        
        if (prev.currentIdx > firstIdxInSubTest) {
          return { ...prev, currentIdx: prev.currentIdx - 1 };
        }
        return prev; // Lock within sub-test
      }

      return { ...prev, currentIdx: prev.currentIdx - 1 };
    });
  };

  const validateAnswer = (q: Question, answer: any): boolean => {
    if (answer === undefined) return false;
    if (q.type === 'multiple_choice') {
      return answer === q.correctAnswer;
    } else if (q.type === 'complex_multiple_choice') {
      const userAnswers = answer as boolean[];
      return q.complexOptions?.every((opt, idx) => opt.correct === userAnswers[idx]) ?? false;
    } else if (q.type === 'short_answer') {
      return Number(answer) === q.shortAnswerCorrect;
    }
    return false;
  };

  const submitQuiz = () => {
    if (!session || session.isSubmitted) return;

    const results = session.questions.map(q => ({
      id: q.id,
      correct: validateAnswer(q, session.answers[q.id]),
      category: q.category,
      concept: q.concept,
      irtParams: q.irtParams,
    }));

    const correctCount = results.filter(r => r.correct).length;
    const today = new Date().toISOString().split('T')[0];

    // IRT Scoring
    const irtScore = calculateIRTScore(results.map(r => ({
      correct: r.correct,
      irtParams: r.irtParams
    })));

    const { rank, percentile, totalParticipants } = getNationalStats(irtScore);

    // Category scores
    const categoryScores: any = {};
    const categories: Category[] = ['TPS', 'Literasi Indonesia', 'Literasi Inggris', 'Penalaran Matematika'];
    categories.forEach(cat => {
      const catResults = results.filter(r => r.category === cat);
      if (catResults.length > 0) {
        categoryScores[cat] = calculateIRTScore(catResults.map(r => ({
          correct: r.correct,
          irtParams: r.irtParams
        })));
      } else {
        categoryScores[cat] = 0;
      }
    });

    // Material Mastery
    const materialMastery: any = {};
    results.forEach(r => {
      if (!materialMastery[r.concept]) {
        materialMastery[r.concept] = { correct: 0, total: 0 };
      }
      materialMastery[r.concept].total += 1;
      if (r.correct) materialMastery[r.concept].correct += 1;
    });
    Object.keys(materialMastery).forEach(key => {
      materialMastery[key] = Math.round((materialMastery[key].correct / (materialMastery[key].total || 1)) * 100);
    });

    // Rationalization Logic
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

        return {
          ptn: ptn.name,
          prodi: prodi.name,
          chance
        };
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
      recommendations
    };

    setProgress(prev => {
      const newWrongIds = [...prev.wrongIds];
      const newCompletedIds = [...prev.completedIds];
      const updatedStats = { ...prev.categoryStats };
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
        };

        if (r.correct) {
          updatedStats[r.category].correct += 1;
          const idx = newWrongIds.indexOf(r.id);
          if (idx > -1) newWrongIds.splice(idx, 1);
          if (!newCompletedIds.includes(r.id)) newCompletedIds.push(r.id);
        } else {
          if (!newWrongIds.includes(r.id)) newWrongIds.push(r.id);
        }
      });

      let newDifficulty = prev.currentDifficulty;
      const accuracy = correctCount / (session.questions.length || 1);
      if (accuracy > 0.8) {
        if (newDifficulty === 'easy') newDifficulty = 'medium';
        else if (newDifficulty === 'medium') newDifficulty = 'trap';
      } else if (accuracy < 0.4) {
        if (newDifficulty === 'trap') newDifficulty = 'medium';
        else if (newDifficulty === 'medium') newDifficulty = 'easy';
      }

      const currentStrategy = session.strategy;
      const previousOutcome = currentStrategy ? prev.strategyOutcomes?.[currentStrategy] : undefined;
      const strategyCorrect = correctCount;
      const strategyTotal = session.questions.length;
      const nextAttempts = (previousOutcome?.attempts ?? 0) + 1;
      const cumulativeCorrect = (previousOutcome?.correct ?? 0) + strategyCorrect;
      const cumulativeTotal = (previousOutcome?.total ?? 0) + strategyTotal;

      return {
        ...prev,
        conceptHistory: updatedConceptHistory,
        conceptReviewState: updatedReviewState,
        completedIds: newCompletedIds,
        wrongIds: newWrongIds,
        streak: correctCount === session.questions.length ? prev.streak + 1 : 0,
        dailyProgress: {
          ...prev.dailyProgress,
          [today]: (prev.dailyProgress[today] || 0) + correctCount,
        },
        categoryStats: updatedStats,
        currentDifficulty: newDifficulty,
        materialMastery: { ...(prev.materialMastery ?? {}), ...materialMastery },
        reports: [report, ...prev.reports].slice(0, 10),
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
      };
    });

    setSession(prev => prev ? { ...prev, isSubmitted: true } : null);
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
  };
}
