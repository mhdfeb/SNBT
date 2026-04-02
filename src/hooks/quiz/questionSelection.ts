import type { Category, Question, QuizSession, UserProgress } from '../../types/quiz';

const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

const take = <T,>(items: T[], count: number): T[] => items.slice(0, Math.max(0, count));

export interface SubTestConfig {
  name: string;
  questionCount: number;
  timeLimitSec: number;
  category?: Category;
}

const DEFAULT_SUBTEST_CONFIG: SubTestConfig[] = [
  { name: 'TPS', questionCount: 30, timeLimitSec: 30 * 60, category: 'TPS' },
  { name: 'Literasi Indonesia', questionCount: 20, timeLimitSec: 20 * 60, category: 'Literasi Indonesia' },
  { name: 'Literasi Inggris', questionCount: 20, timeLimitSec: 20 * 60, category: 'Literasi Inggris' },
  { name: 'Penalaran Matematika', questionCount: 20, timeLimitSec: 20 * 60, category: 'Penalaran Matematika' },
];

const takeWithFallback = (preferredPool: Question[], fallbackPool: Question[], count: number): Question[] => {
  const preferred = take(shuffle(preferredPool), count);
  if (preferred.length >= count) return preferred;

  const usedIds = new Set(preferred.map((question) => question.id));
  const remainderFallback = shuffle(fallbackPool).filter((question) => !usedIds.has(question.id));
  return [...preferred, ...take(remainderFallback, count - preferred.length)];
};

export const buildSubTestConfig = (mode: QuizSession['mode']): SubTestConfig[] => {
  if (mode === 'tryout' || mode === 'simulation') return DEFAULT_SUBTEST_CONFIG;
  return [];
};

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
  if (mode === 'tryout' || mode === 'simulation') {
    const subTestConfig = buildSubTestConfig(mode);
    const usedQuestionIds = new Set<string>();
    const selected: Question[] = [];

    for (const subTest of subTestConfig) {
      const perCategoryPool =
        subTest.category === undefined
          ? basePool
          : basePool.filter((question) => question.category === subTest.category);

      const cleanCategoryPool = perCategoryPool.filter((question) => !usedQuestionIds.has(question.id));
      const cleanFallbackPool = mixed.filter((question) => !usedQuestionIds.has(question.id));
      const chunk = takeWithFallback(cleanCategoryPool, cleanFallbackPool, subTest.questionCount);

      for (const question of chunk) usedQuestionIds.add(question.id);
      selected.push(...chunk);
    }

    return selected;
  }
  return take([...unseen, ...mixed], 10);
};
