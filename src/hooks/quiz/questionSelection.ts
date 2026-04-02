import type { Category, Question, QuizSession, UserProgress } from '../../types/quiz';

const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

const take = <T,>(items: T[], count: number): T[] => items.slice(0, Math.max(0, count));

export const pickQuestionsByMode = (
  allQuestions: Question[],
  progress: UserProgress,
  mode: QuizSession['mode'],
  category?: Category,
  concept?: string,
): Question[] => {
  const pool = allQuestions.filter((question) => {
    if (category && question.category !== category) return false;
    if (concept && question.concept !== concept) return false;
    return true;
  });

  const basePool = pool.length > 0 ? pool : allQuestions;
  const wrongFirst = shuffle(basePool.filter((question) => progress.wrongIds.includes(question.id)));
  const unseen = shuffle(basePool.filter((question) => !progress.completedIds.includes(question.id)));
  const mixed = shuffle(basePool);

  if (mode === 'daily') return take([...wrongFirst, ...unseen, ...mixed], 5);
  if (mode === 'mini' || mode === 'drill15' || mode === 'targeted') return take([...wrongFirst, ...unseen, ...mixed], 10);
  if (mode === 'tryout' || mode === 'simulation') return take(mixed, 90);
  return take([...unseen, ...mixed], 10);
};
