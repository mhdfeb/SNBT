import type { Category, SubTestHistoryEntry, UserProgress } from '../../types/quiz';

export const STORAGE_KEY = 'ppu_master_progress_v4';
export const LEGACY_STORAGE_KEYS = ['ppu_master_progress_v3'];
export const STORAGE_VERSION = 4;

const CATEGORIES: Category[] = ['TPS', 'Literasi Indonesia', 'Literasi Inggris', 'Penalaran Matematika'];
const LEGACY_SUBTEST_FALLBACK_KEY = '__legacy__';

export const createInitialProgress = (): UserProgress => ({
  storageVersion: STORAGE_VERSION,
  completedIds: [],
  wrongIds: [],
  streak: 0,
  qualityStreak: 0,
  qualityDays: {},
  dailyProgress: {},
  categoryStats: Object.fromEntries(CATEGORIES.map((category) => [category, { correct: 0, total: 0 }])) as UserProgress['categoryStats'],
  currentDifficulty: 'easy',
  reports: [],
  simulationReports: [],
  materialMastery: {},
  drillHistory: [],
  subTestHistory: {},
  questionUsage: {},
  questionPerformance: {},
  conceptLastSeen: {},
  conceptHistory: {},
  conceptReviewState: {},
  strategyOutcomes: {},
  questionHistory: {},
  conceptProfiles: {},
  remedialCycles: [],
});

const normalizeMastery = (raw: unknown): Record<string, number> => {
  if (!raw || typeof raw !== 'object') return {};

  const output: Record<string, number> = {};
  Object.entries(raw as Record<string, unknown>).forEach(([concept, value]) => {
    if (typeof value === 'number') {
      output[concept] = Math.max(0, Math.min(100, Math.round(value)));
      return;
    }

    if (
      value &&
      typeof value === 'object' &&
      typeof (value as { correct?: unknown }).correct === 'number' &&
      typeof (value as { total?: unknown }).total === 'number'
    ) {
      const correct = (value as { correct: number }).correct;
      const total = (value as { total: number }).total || 1;
      output[concept] = Math.max(0, Math.min(100, Math.round((correct / total) * 100)));
    }
  });

  return output;
};

const normalizeSubTestEntry = (value: unknown): SubTestHistoryEntry | null => {
  if (!value || typeof value !== 'object') return null;

  const entry = value as SubTestHistoryEntry;
  if (typeof entry.date !== 'string' || entry.date.length === 0) return null;

  return entry;
};

const normalizeSubTestHistory = (raw: unknown): UserProgress['subTestHistory'] => {
  if (Array.isArray(raw)) {
    const normalized = raw.map(normalizeSubTestEntry).filter((entry): entry is SubTestHistoryEntry => entry !== null);
    return normalized.length > 0 ? { [LEGACY_SUBTEST_FALLBACK_KEY]: normalized } : {};
  }

  if (!raw || typeof raw !== 'object') return {};

  const output: UserProgress['subTestHistory'] = {};
  Object.entries(raw as Record<string, unknown>).forEach(([subTestName, entries]) => {
    if (!Array.isArray(entries)) return;

    const normalized = entries.map(normalizeSubTestEntry).filter((entry): entry is SubTestHistoryEntry => entry !== null);
    if (normalized.length === 0) return;

    output[subTestName] = normalized;
  });

  return output;
};

export const migrateProgress = (raw: unknown): UserProgress => {
  const initial = createInitialProgress();

  if (!raw || typeof raw !== 'object') {
    return initial;
  }

  const parsed = raw as Partial<UserProgress> & { materialMastery?: unknown; subTestHistory?: unknown };

  return {
    ...initial,
    ...parsed,
    storageVersion: STORAGE_VERSION,
    reports: parsed.reports ?? [],
    simulationReports: parsed.simulationReports ?? [],
    materialMastery: normalizeMastery(parsed.materialMastery),
    drillHistory: parsed.drillHistory ?? [],
    subTestHistory: normalizeSubTestHistory(parsed.subTestHistory),
    questionUsage: parsed.questionUsage ?? {},
    questionPerformance: parsed.questionPerformance ?? {},
    conceptLastSeen: parsed.conceptLastSeen ?? {},
    conceptHistory: parsed.conceptHistory ?? {},
    conceptReviewState: parsed.conceptReviewState ?? {},
    strategyOutcomes: parsed.strategyOutcomes ?? {},
    questionHistory: parsed.questionHistory ?? {},
    conceptProfiles: parsed.conceptProfiles ?? {},
    remedialCycles: parsed.remedialCycles ?? [],
  } as UserProgress;
};

export const loadProgressFromStorage = (): UserProgress => {
  const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      return migrateProgress(parsed);
    } catch {
      // ignore invalid legacy payload
    }
  }

  return createInitialProgress();
};
