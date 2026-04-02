import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAnalytics } from './lib/analytics';
import { validateAllDataSchemas } from './data/validators';

initAnalytics();


if (import.meta.env.DEV) {
  const report = validateAllDataSchemas();
  if (report.issues.length > 0) {
    const details = report.issues.map((issue) => `${issue.entity}#${issue.id}.${issue.field}`).join(', ');
    throw new Error(`Data schema validation failed on startup: ${details}`);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
