const trimSlash = (value: string) => value.replace(/\/+$/, '');

const fallbackBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';

export const runtimeConfig = {
  appBaseUrl: trimSlash(import.meta.env.VITE_APP_BASE_URL || fallbackBaseUrl),
  appVersion: import.meta.env.VITE_APP_VERSION || 'dev',
  analyticsId: import.meta.env.VITE_ANALYTICS_ID || '',
};
