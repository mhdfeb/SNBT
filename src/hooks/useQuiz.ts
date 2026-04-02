import { useState, useEffect, useCallback, useRef } from 'react';
import { Question, UserProgress, QuizSession, Category, AssessmentReport, ConceptProfile } from '../types/quiz';
import { QUESTIONS } from '../data/questions';
import { calculateIRTScore, getNationalStats } from '../lib/irt';
import { PTN_DATA } from '../data/ptn';

const STORAGE_KEY = 'ppu_master_progress_v3';
const RECENT_WINDOW = 6;
const RECOMMENDED_COUNTS: Record<'daily' | 'mini' | 'drill15', number> = {
  daily: 5,
  mini: 10,
  drill15: 12,
};

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
  questionHistory: {},
  conceptProfiles: {},
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

export function useQuiz() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_PROGRESS,
        ...parsed,
        materialMastery: parsed.materialMastery ?? {},
        questionHistory: parsed.questionHistory ?? {},
        conceptProfiles: parsed.conceptProfiles ?? {},
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

  const startSession = useCallback((mode: QuizSession['mode'], category?: Category) => {
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
        return prev;
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

    const irtScore = calculateIRTScore(results.map(r => ({
      correct: r.correct,
      irtParams: r.irtParams
    })));

    const { rank, percentile, totalParticipants } = getNationalStats(irtScore);

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
      const updatedQuestionHistory = { ...(prev.questionHistory ?? {}) };
      const now = Date.now();

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

      const updatedReports = [report, ...prev.reports].slice(0, 10);

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
        materialMastery: { ...(prev.materialMastery ?? {}), ...materialMastery },
        questionHistory: updatedQuestionHistory,
        reports: updatedReports,
        conceptProfiles: computeConceptProfiles(updatedQuestionHistory, updatedReports),
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
