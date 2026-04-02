export type LogLevel = 'info' | 'warn' | 'error';

export interface LogPayload {
  event: string;
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
  timestamp?: string;
}

const emitConsole = (level: LogLevel, payload: LogPayload) => {
  const fullPayload = {
    ...payload,
    timestamp: payload.timestamp ?? new Date().toISOString(),
  };

  if (level === 'error') {
    console.error('[app-log]', fullPayload);
    return;
  }

  if (level === 'warn') {
    console.warn('[app-log]', fullPayload);
    return;
  }

  console.info('[app-log]', fullPayload);
};

export const logEvent = (level: LogLevel, payload: LogPayload) => {
  emitConsole(level, payload);
};
