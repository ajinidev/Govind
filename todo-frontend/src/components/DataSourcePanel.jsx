import { useState } from 'react';
import { activeSource, settings } from '../api/index.js';
import { DEFAULT_URLS, SOURCES, saveSettings } from '../api/config.js';

/** Sidebar control to switch between mock / dummy endpoint / real endpoint. Applying reloads the page. */
export default function DataSourcePanel({ error }) {
  const [source, setSource] = useState(activeSource);
  const [urls, setUrls] = useState(settings.urls);
  const dirty = source !== activeSource || (source !== 'mock' && urls[source] !== settings.urls[source]);

  function apply() {
    saveSettings({ source, urls });
    location.reload();
  }

  return (
    <div className="absolute inset-x-3 bottom-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-slate-700">
        <span className={`size-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`} />
        Data source
      </div>
      <select value={source} disabled={settings.forced} onChange={(e) => setSource(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1">
        {Object.entries(SOURCES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
      </select>
      <p className="mt-1 text-slate-500">
        {settings.forced ? 'Set by the --source launch flag; restart to change.' : SOURCES[source].hint}
      </p>

      {source !== 'mock' && (
        <input
          readOnly={settings.forced}
          value={urls[source]}
          onChange={(e) => setUrls((u) => ({ ...u, [source]: e.target.value }))}
          placeholder={DEFAULT_URLS[source]}
          spellCheck={false}
          className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1 font-mono"
          aria-label="API base URL"
        />
      )}
      {error && !dirty && <p className="mt-1.5 text-red-600">{error.message}</p>}
      {dirty && (
        <button onClick={apply} className="mt-2 w-full rounded-md bg-indigo-600 py-1 font-semibold text-white hover:bg-indigo-700">
          Apply &amp; reload
        </button>
      )}
    </div>
  );
}
