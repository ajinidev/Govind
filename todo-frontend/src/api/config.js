// Which data source the UI uses. Chosen at runtime from the sidebar and remembered in localStorage.
const env = import.meta.env;

export const SOURCES = {
  mock: { label: 'In-browser mock', hint: 'No network, dummy data in localStorage.' },
  dummy: { label: 'Dummy endpoint', hint: 'Local Node server with dummy data (npm run server).' },
  real: { label: 'Real endpoint', hint: 'Your own backend implementing docs/API.md.' },
};

export const DEFAULT_URLS = {
  dummy: env.VITE_DUMMY_API_URL || 'http://localhost:3001/api',
  real: env.VITE_REAL_API_URL || 'http://127.0.0.1:8080/api',
};

const KEY = 'taskflow.datasource';

export function getSettings() {
  // `npm start -- --source=...` sets VITE_FORCE_SOURCE; it overrides anything saved in the browser.
  if (env.VITE_FORCE_SOURCE in SOURCES) return { source: env.VITE_FORCE_SOURCE, urls: { ...DEFAULT_URLS }, forced: true };
  const fallback = { source: env.VITE_DEFAULT_SOURCE in SOURCES ? env.VITE_DEFAULT_SOURCE : 'real', urls: { ...DEFAULT_URLS } };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.source in SOURCES) return { source: saved.source, urls: { ...DEFAULT_URLS, ...saved.urls } };
  } catch { /* ignore */ }
  return fallback;
}

export function saveSettings(settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}
