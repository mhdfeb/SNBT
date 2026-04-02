import { runtimeConfig } from '../config/runtime';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
  }
}

let initialized = false;

const injectGtag = (measurementId: string) => {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: any[]) => {
    window.dataLayer?.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
  });
};

export const initAnalytics = () => {
  if (initialized || !runtimeConfig.analyticsId || typeof document === 'undefined') {
    return;
  }

  injectGtag(runtimeConfig.analyticsId);
  initialized = true;
};

export const trackPageView = (pagePath: string) => {
  if (!initialized || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: `${runtimeConfig.appBaseUrl}${pagePath}`,
    page_path: pagePath,
    app_version: runtimeConfig.appVersion,
  });
};

export const trackEvent = (eventName: string, params?: Record<string, string | number | boolean>) => {
  if (!initialized || !window.gtag) return;

  window.gtag('event', eventName, {
    app_version: runtimeConfig.appVersion,
    ...params,
  });
};
