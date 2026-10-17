import { useState } from 'react';
import { activeBaseUrl, buildPath, tasksApi } from '../api/index.js';
import { useAsync, useDebounced, useTasksCtx } from '../hooks.js';
import { SORT_OPTIONS, PRIORITIES } from '../lib/constants.js';
import TaskCard from './TaskCard.jsx';

export const controlCls = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-indigo-500';

/**
 * Generic list page. Each page supplies the *page-specific* API query via `params`
 * (e.g. { overdue: true }); this component adds search / priority / sort / hide-done on top.
 */
export default function TaskListView({ title, params, empty, toolbar, hideDoneToggle = false }) {
  const { revision } = useTasksCtx();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState('due_date');
  const [hideDone, setHideDone] = useState(false);
  const q = useDebounced(search, 300);

  const query = { ...params, q, priority, sort, exclude_done: params.exclude_done || hideDone };
  const key = JSON.stringify(query);
  const { data, loading, error } = useAsync(() => tasksApi.list(query), [key, revision]);

  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {/* Handy for backend devs: the exact request this page makes. */}
      <p className="mt-1 mb-4 font-mono text-xs break-all text-slate-400">
        GET {activeBaseUrl ?? '(in-browser mock)'}{buildPath('/tasks', query)}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {toolbar}
        <input type="search" className={`${controlCls} min-w-48`} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={controlCls} value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority">
          <option value="">All priorities</option>
          {Object.entries(PRIORITIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select className={controlCls} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hideDoneToggle && (
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="accent-indigo-600" />
            Hide completed
          </label>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Couldn’t load tasks: {error.message}
        </div>
      )}
      {data && (
        <p className={`mb-2 text-sm text-slate-500 ${loading ? 'animate-pulse' : ''}`}>
          {data.total} task{data.total === 1 ? '' : 's'}
        </p>
      )}
      {loading && !data && <p className="py-12 text-center text-slate-400">Loading…</p>}
      {data && data.data.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-500">{empty}</div>
      )}
      <div className={`flex flex-col gap-2.5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {data?.data.map((t) => <TaskCard key={t.id} task={t} />)}
      </div>
    </div>
  );
}
