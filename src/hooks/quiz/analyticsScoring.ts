import type { AssessmentReport, Category, Question, QuizSession, UserProgress } from '../../types/quiz';

const CATEGORIES: Category[] = ['TPS', 'Literasi Indonesia', 'Literasi Inggris', 'Penalaran Matematika'];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

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

  return {
    id: `rep-${Date.now()}`,
    date: new Date().toISOString(),
    mode: session.mode === 'simulation' ? 'simulation' : 'practice',
    totalScore,
    questionCount: session.questions.length,
    correctCount,
    categoryScores,
    readinessScore: totalScore,
    readinessBySubTest: [],
    nationalRank: 0,
    totalParticipants: 0,
    percentile: 0,
    materialMastery: materialMastery as AssessmentReport['materialMastery'],
    conceptEvaluations: [],
    recommendations: [],
    readinessIndex: totalScore,
    trendSessions: Math.min(8, progress.reports.length + 1),
    consistency: 75,
    gapBySubTest: CATEGORIES.reduce((acc, category) => {
      acc[category] = Math.round(700 - categoryScores[category]);
      return acc;
    }, {} as Record<Category, number>),
    focusRecommendations: [],
  } as AssessmentReport;
};

export const isAnswerCorrect = (question: Question, answer: unknown): boolean => {
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
