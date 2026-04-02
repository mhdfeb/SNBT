import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAnalytics } from './lib/analytics';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logEvent } from './lib/logger';
import { recordSessionHealth } from './lib/slo';

initAnalytics();
recordSessionHealth(false);

window.addEventListener('error', (event) => {
  recordSessionHealth(true);
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
  recordSessionHealth(true);
  logEvent('error', {
    event: 'unhandled_promise_rejection',
    message: String(event.reason),
    context: {
      reason: event.reason,
    },
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
