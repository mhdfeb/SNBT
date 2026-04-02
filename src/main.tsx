import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAnalytics } from './lib/analytics';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logEvent } from './lib/logger';
import { recordSessionHealth } from './lib/slo';
import { validateAllDataSchemas } from './data/validators';

try {
  initAnalytics();
} catch (error) {
  console.error('[startup] initAnalytics failed', error);
}

try {
  recordSessionHealth(false);
} catch (error) {
  console.error('[startup] recordSessionHealth failed', error);
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    try {
      recordSessionHealth(true);
    } catch (error) {
      console.error('[startup] recordSessionHealth on error failed', error);
    }
    logEvent('error', {
      event: 'runtime_error',
      message: event.message,
      stack: event.error?.stack,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    try {
      recordSessionHealth(true);
    } catch (error) {
      console.error('[startup] recordSessionHealth on rejection failed', error);
    }
    logEvent('error', {
      event: 'unhandled_promise_rejection',
      message: String(event.reason),
      context: {
        reason: event.reason,
      },
    });
  });
}


if (import.meta.env.DEV) {
  try {
    const report = validateAllDataSchemas();
    if (report.issues.length > 0) {
      const details = report.issues.map((issue) => `${issue.entity}#${issue.id}.${issue.field}`).join(', ');
      throw new Error(`Data schema validation failed on startup: ${details}`);
    }
  } catch (error) {
    console.error('[startup] data schema validation failed', error);
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('[startup] Root element #root not found');
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
