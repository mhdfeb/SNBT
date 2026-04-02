import { SUBTEST_BLUEPRINTS, resolveSubtest } from '../../data/questionGovernance';
import type { Category, Question, QuizSession, UserProgress } from '../../types/quiz';

const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

const take = <T,>(items: T[], count: number): T[] => items.slice(0, Math.max(0, count));

export interface SubTestConfig {
  name: string;
  questionCount: number;
  timeLimitSec: number;
  category?: Category;
  selector?: (question: Question) => boolean;
}

const PRODUCT_SUBTEST_TIME_LIMITS: Record<string, number> = {
  'Penalaran Induktif': 10 * 60,
  'Penalaran Deduktif': 10 * 60,
  'Penalaran Kuantitatif': 10 * 60,
  'Pengetahuan & Pemahaman Umum': 15 * 60,
  'Pemahaman Bacaan & Menulis': 25 * 60,
  'Pengetahuan Kuantitatif': 15 * 60,
  'Literasi Bahasa Indonesia': 35 * 60,
  'Literasi Bahasa Inggris': 25 * 60,
  'Penalaran Matematika': 25 * 60,
};

const GOVERNANCE_SUBTEST_CONFIG: SubTestConfig[] = SUBTEST_BLUEPRINTS.map((blueprint) => ({
  name: blueprint.subtest,
  questionCount: blueprint.quota,
  timeLimitSec: PRODUCT_SUBTEST_TIME_LIMITS[blueprint.subtest] ?? blueprint.quota * 60,
  category: blueprint.category,
  selector: (question) => resolveSubtest(question) === blueprint.subtest,
}));

const takeWithFallback = (preferredPool: Question[], fallbackPool: Question[], count: number): Question[] => {
  const preferred = take(shuffle(preferredPool), count);
  if (preferred.length >= count) return preferred;

  const usedIds = new Set(preferred.map((question) => question.id));
  const remainderFallback = shuffle(fallbackPool).filter((question) => !usedIds.has(question.id));
  return [...preferred, ...take(remainderFallback, count - preferred.length)];
};

export const buildSubTestConfig = (mode: QuizSession['mode']): SubTestConfig[] => {
  if (mode === 'tryout' || mode === 'simulation') return GOVERNANCE_SUBTEST_CONFIG;
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
      const perCategoryPool = basePool.filter((question) => {
        if (subTest.category !== undefined && question.category !== subTest.category) return false;
        if (subTest.selector && !subTest.selector(question)) return false;
        return true;
      });

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
