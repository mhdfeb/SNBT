import { logEvent } from './logger';

export const SLO_TARGET = {
  mainPageRenderMsP95: 1200,
  questionNavigationLatencyMsP95: 250,
  crashFreeSessionRate: 99.5,
} as const;

const metrics = {
  navLatencies: [] as number[],
};

export const markMainPageRender = (start: number) => {
  const duration = performance.now() - start;
  logEvent('info', {
    event: 'slo_main_page_render',
    message: 'Main page render measurement',
    context: { durationMs: Math.round(duration), targetMsP95: SLO_TARGET.mainPageRenderMsP95 },
  });
};

export const markQuestionNavigationLatency = (durationMs: number) => {
  metrics.navLatencies.push(durationMs);
  if (metrics.navLatencies.length > 50) metrics.navLatencies.shift();

  logEvent('info', {
    event: 'slo_question_navigation',
    message: 'Question navigation latency measurement',
    context: {
      durationMs: Math.round(durationMs),
      targetMsP95: SLO_TARGET.questionNavigationLatencyMsP95,
    },
  });
};

export const recordSessionHealth = (isCrash: boolean) => {
  const key = 'snbt-session-health';
  const fallback = { sessions: 0, crashes: 0 };
  let current: typeof fallback = fallback;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<typeof fallback>;
      current = {
        sessions: Number.isFinite(parsed.sessions) ? Number(parsed.sessions) : fallback.sessions,
        crashes: Number.isFinite(parsed.crashes) ? Number(parsed.crashes) : fallback.crashes,
      };
    }
  } catch (error) {
    console.error('[slo] Failed to read session health, using fallback', error);
  }

  const next = {
    sessions: current.sessions + 1,
    crashes: current.crashes + (isCrash ? 1 : 0),
  };
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch (error) {
    console.error('[slo] Failed to persist session health', error);
  }

  const crashFreeRate = next.sessions > 0 ? ((next.sessions - next.crashes) / next.sessions) * 100 : 100;

  logEvent('info', {
    event: 'slo_crash_free_rate',
    message: 'Crash free session rate measurement',
    context: {
      crashFreeRate: Number(crashFreeRate.toFixed(2)),
      target: SLO_TARGET.crashFreeSessionRate,
      totalSessions: next.sessions,
    },
  });
};
