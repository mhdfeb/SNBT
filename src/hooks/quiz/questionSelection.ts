import { SUBTEST_BLUEPRINTS } from '../../data/questionGovernance';
import type { Category, Question, QuizSession, UserProgress } from '../../types/quiz';

const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

const take = <T,>(items: T[], count: number): T[] => items.slice(0, Math.max(0, count));

const SECONDS_PER_QUESTION = 60;
const MIN_SUBTEST_FILL_RATIO_WARNING = 0.7;

export interface SubTestConfig {
  name: string;
  questionCount: number;
  timeLimitSec: number;
  category?: Category;
}

const PRODUCT_SUBTEST_CONFIG: SubTestConfig[] = [
  { name: 'Penalaran Induktif', questionCount: 10, timeLimitSec: 10 * SECONDS_PER_QUESTION, category: 'TPS' },
  { name: 'Penalaran Deduktif', questionCount: 10, timeLimitSec: 10 * SECONDS_PER_QUESTION, category: 'TPS' },
  { name: 'Penalaran Kuantitatif', questionCount: 10, timeLimitSec: 10 * SECONDS_PER_QUESTION, category: 'TPS' },
  {
    name: 'Pengetahuan & Pemahaman Umum',
    questionCount: 20,
    timeLimitSec: 20 * SECONDS_PER_QUESTION,
    category: 'TPS',
  },
  {
    name: 'Pemahaman Bacaan & Menulis',
    questionCount: 20,
    timeLimitSec: 20 * SECONDS_PER_QUESTION,
    category: 'TPS',
  },
  { name: 'Pengetahuan Kuantitatif', questionCount: 15, timeLimitSec: 15 * SECONDS_PER_QUESTION, category: 'TPS' },
  {
    name: 'Literasi Bahasa Indonesia',
    questionCount: 30,
    timeLimitSec: 30 * SECONDS_PER_QUESTION,
    category: 'Literasi Indonesia',
  },
  {
    // Explicit subtest naming is aligned with question governance metadata.
    name: 'Literasi Bahasa Inggris',
    questionCount: 20,
    timeLimitSec: 20 * SECONDS_PER_QUESTION,
    category: 'Literasi Inggris',
  },
  {
    name: 'Penalaran Matematika',
    questionCount: 20,
    timeLimitSec: 20 * SECONDS_PER_QUESTION,
    category: 'Penalaran Matematika',
  },
];

const DEFAULT_SUBTEST_CONFIG: SubTestConfig[] = SUBTEST_BLUEPRINTS.map((blueprint) => {
  const configured = PRODUCT_SUBTEST_CONFIG.find((subtest) => subtest.name === blueprint.subtest);

  if (!configured) {
    return {
      name: blueprint.subtest,
      category: blueprint.category,
      questionCount: blueprint.quota,
      timeLimitSec: blueprint.quota * SECONDS_PER_QUESTION,
    };
  }

  return {
    ...configured,
    category: blueprint.category,
    questionCount: blueprint.quota,
  };
});

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

      const minExpectedCount = Math.ceil(subTest.questionCount * MIN_SUBTEST_FILL_RATIO_WARNING);
      if (chunk.length < minExpectedCount) {
        console.warn(
          `[questionSelection] Subtest "${subTest.name}" selected ${chunk.length}/${subTest.questionCount} questions (category: ${subTest.category ?? 'ALL'}).`,
        );
      }

      for (const question of chunk) usedQuestionIds.add(question.id);
      selected.push(...chunk);
    }

    return selected;
  }
  return take([...unseen, ...mixed], 10);
};
