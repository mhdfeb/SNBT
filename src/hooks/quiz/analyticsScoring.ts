import type { AssessmentReport, Category, Question, QuestionAnswer, QuizSession, UserProgress } from '../../types/quiz';

const CATEGORIES: Category[] = ['TPS', 'Literasi Indonesia', 'Literasi Inggris', 'Penalaran Matematika'];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const mean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const stdDev = (values: number[]): number => {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const getReadinessLevel = (score: number): AssessmentReport['readinessBySubTest'][number]['readiness'] => {
  if (score >= 680) return 'Aman';
  if (score >= 550) return 'Waspada';
  return 'Kritis';
};

const getSubTestHistoryScores = (reports: AssessmentReport[], category: Category): number[] => {
  return reports
    .map((report) => report.categoryScores?.[category])
    .filter((score): score is number => Number.isFinite(score));
};

const getLinearTrend = (values: number[]): number => {
  if (values.length < 2) return 0;

  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  const numerator = values.reduce((sum, y, idx) => sum + (idx - xMean) * (y - yMean), 0);
  const denominator = values.reduce((sum, _, idx) => sum + (idx - xMean) ** 2, 0);

  if (denominator === 0) return 0;
  return numerator / denominator;
};

const buildFocusRecommendations = (
  categoryScores: Record<Category, number>,
  readinessBySubTest: AssessmentReport['readinessBySubTest'],
  consistency: number,
): string[] => {
  const weakestCategory = CATEGORIES.reduce((worst, category) => {
    if (!worst || categoryScores[category] < categoryScores[worst]) return category;
    return worst;
  }, null as Category | null);

  const criticalSubTests = readinessBySubTest.filter((item) => item.readiness === 'Kritis');
  const unstableSubTests = readinessBySubTest
    .filter((item) => item.stability < 60)
    .sort((a, b) => a.stability - b.stability);

  const recs: string[] = [];

  if (weakestCategory) {
    recs.push(
      `Prioritaskan ${weakestCategory} (skor ${categoryScores[weakestCategory]}) dengan 2 sesi targeted drill dalam 3 hari ke depan.`,
    );
  }

  if (criticalSubTests.length > 0) {
    const names = criticalSubTests.map((item) => item.subTest).join(', ');
    recs.push(`Fokus remedial untuk subtes ${names} karena readiness masih kategori Kritis.`);
  }

  if (consistency < 60 && unstableSubTests.length > 0) {
    recs.push(
      `Stabilkan performa di ${unstableSubTests[0].subTest} dengan simulasi bertimer dan review kesalahan per 5 soal.`,
    );
  }

  const lowTrend = readinessBySubTest
    .filter((item) => item.trend < -5)
    .sort((a, b) => a.trend - b.trend)[0];

  if (lowTrend) {
    recs.push(
      `Tren ${lowTrend.subTest} menurun (${lowTrend.trend.toFixed(1)} poin/sesi), tambahkan 1 sesi evaluasi konsep inti pekan ini.`,
    );
  }

  if (recs.length === 0) {
    recs.push('Pertahankan ritme latihan 3-4 sesi/minggu dan tingkatkan porsi soal campuran untuk menjaga kestabilan skor.');
  }

  return recs.slice(0, 3);
};

const buildPerformancePrediction = (
  totalScore: number,
  consistency: number,
  trend: number,
  historyLength: number,
): NonNullable<AssessmentReport['performancePrediction']> => {
  const projectedCenter = totalScore + trend * 1.5;
  const consistencyPenalty = clamp((100 - consistency) * 1.2, 0, 60);
  const spread = Math.round(clamp(35 + consistencyPenalty, 25, 110));

  const minScore = Math.round(clamp(projectedCenter - spread, 200, 800));
  const maxScore = Math.round(clamp(projectedCenter + spread, 200, 800));

  let confidenceLevel: 'Low' | 'Medium' | 'High' = 'Medium';
  if (historyLength >= 8 && consistency >= 78) confidenceLevel = 'High';
  else if (historyLength <= 3 || consistency < 60) confidenceLevel = 'Low';

  const trendLabel = trend >= 3 ? 'meningkat' : trend <= -3 ? 'menurun' : 'relatif stabil';

  return {
    scoreRange: [minScore, maxScore],
    confidenceLevel,
    summary: `Prediksi skor berada pada rentang ${minScore}-${maxScore} dengan tren ${trendLabel} berdasarkan ${historyLength} sesi terakhir.`,
  };
};

export const calculateSessionReport = (session: QuizSession, progress: UserProgress): AssessmentReport => {
  const results = session.questions.map((question) => {
    const answer = session.answers[question.id];
    const isCorrect = isAnswerCorrect(question, answer);
    return { question, isCorrect };
  });

  const correctCount = results.filter((result) => result.isCorrect).length;
  const accuracy = session.questions.length > 0 ? correctCount / session.questions.length : 0;

  const categoryScores = CATEGORIES.reduce((acc, category) => {
    const categoryResults = results.filter((result) => result.question.category === category);
    const categoryCorrect = categoryResults.filter((result) => result.isCorrect).length;
    const categoryAccuracy = categoryResults.length > 0 ? categoryCorrect / categoryResults.length : 0;
    acc[category] = Math.round(clamp(200 + categoryAccuracy * 600, 200, 800));
    return acc;
  }, {} as Record<Category, number>);

  const materialMastery = { ...(progress.materialMastery ?? {}) };
  results.forEach(({ question, isCorrect }) => {
    const prev = materialMastery[question.concept] ?? 50;
    const delta = isCorrect ? 3 : -2;
    materialMastery[question.concept] = clamp(prev + delta, 0, 100);
  });

  const totalScore = Math.round(clamp(200 + accuracy * 600, 200, 800));
  const recentReports = [...progress.reports].slice(-7);

  const readinessBySubTest = CATEGORIES.map((category) => {
    const historyScores = [...getSubTestHistoryScores(recentReports, category), categoryScores[category]];
    const trend = getLinearTrend(historyScores);
    const deviation = stdDev(historyScores);
    const stability = Math.round(clamp(100 - deviation / 3, 0, 100));

    return {
      subTest: category,
      score: categoryScores[category],
      trend: Number(trend.toFixed(2)),
      stability,
      readiness: getReadinessLevel(categoryScores[category]),
      sampleSize: historyScores.length,
    };
  });

  const recentTotalScores = [...recentReports.map((report) => report.totalScore), totalScore];
  const scoreStdDev = stdDev(recentTotalScores);
  const consistency = Math.round(clamp(100 - scoreStdDev / 3, 0, 100));
  const overallTrend = getLinearTrend(recentTotalScores);

  const focusRecommendations = buildFocusRecommendations(categoryScores, readinessBySubTest, consistency);
  const performancePrediction = buildPerformancePrediction(
    totalScore,
    consistency,
    overallTrend,
    recentTotalScores.length,
  );

  return {
    id: `rep-${Date.now()}`,
    date: new Date().toISOString(),
    mode: session.mode === 'simulation' ? 'simulation' : 'practice',
    totalScore,
    questionCount: session.questions.length,
    correctCount,
    categoryScores,
    readinessScore: Math.round(mean(readinessBySubTest.map((item) => item.score))),
    readinessBySubTest,
    nationalRank: 0,
    totalParticipants: 0,
    percentile: 0,
    materialMastery: materialMastery as AssessmentReport['materialMastery'],
    conceptEvaluations: [],
    recommendations: [],
    readinessIndex: totalScore,
    trendSessions: recentTotalScores.length,
    consistency,
    gapBySubTest: CATEGORIES.reduce((acc, category) => {
      acc[category] = Math.round(clamp(700 - categoryScores[category], -100, 500));
      return acc;
    }, {} as Record<Category, number>),
    focusRecommendations,
    performancePrediction,
    stabilityAnalysis: {
      level: consistency >= 75 ? 'Stabil' : consistency >= 55 ? 'Perlu Monitoring' : 'Tidak Stabil',
      flags:
        consistency >= 75
          ? ['Variasi skor antar sesi terkendali.']
          : ['Fluktuasi skor masih tinggi, prioritaskan ritme latihan dan evaluasi kesalahan berulang.'],
    },
  } as AssessmentReport;
};

const isAnswerCorrect = (question: Question, answer: QuestionAnswer): boolean => {
  if (answer === undefined || answer === null) return false;

  if (question.type === 'multiple_choice') {
    return answer === question.correctAnswer;
  }

  if (question.type === 'short_answer') {
    return Number(answer) === Number(question.shortAnswerCorrect);
  }

  if (question.type === 'complex_multiple_choice' && Array.isArray(answer) && Array.isArray(question.complexOptions)) {
    return question.complexOptions.every((option, index) => Boolean(answer[index]) === option.correct);
  }

  return false;
};
