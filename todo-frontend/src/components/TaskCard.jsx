import { useState } from 'react';
import { tasksApi } from '../api/index.js';
import { useTasksCtx } from '../hooks.js';
import { formatDate, today } from '../lib/dates.js';
import { PRIORITIES, STATUSES } from '../lib/constants.js';
import Badge, { PRIORITY_TONE, STATUS_TONE } from './Badge.jsx';

const BORDER = { low: 'border-l-green-500', medium: 'border-l-blue-500', high: 'border-l-orange-500', urgent: 'border-l-red-600' };

export default function TaskCard({ task }) {
  const { bump, openForm } = useTasksCtx();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const done = task.status === 'done';
  const overdue = !done && task.due_date && task.due_date < today();

  async function run(fn) {
    setBusy(true);
    setError(null);
    try { await fn(); bump(); } catch (e) { setError(e.message); setBusy(false); }
  }
  const setStatus = (status) => run(() => tasksApi.update(task.id, { status }));
  const remove = () => confirm(`Delete "${task.title}"?`) && run(() => tasksApi.remove(task.id));

  return (
    <article className={`flex flex-wrap items-start gap-3 rounded-xl border border-l-4 border-slate-200 bg-white p-4 ${BORDER[task.priority]} ${done ? 'opacity-70' : ''} ${busy ? 'pointer-events-none opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => setStatus(e.target.checked ? 'done' : 'todo')}
        className="mt-1 size-4 accent-indigo-600"
        aria-label="Mark complete"
      />
      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openForm(task)}>
        <div className={`font-semibold break-words ${done ? 'text-slate-500 line-through' : ''}`}>{task.title}</div>
        {task.description && <p className="mt-0.5 whitespace-pre-wrap text-sm break-words text-slate-500">{task.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={PRIORITY_TONE[task.priority]}>{PRIORITIES[task.priority]}</Badge>
          <Badge tone={STATUS_TONE[task.status]}>{STATUSES[task.status]}</Badge>
          {overdue && <Badge tone="solidRed">Overdue</Badge>}
          {task.category && <Badge>{task.category}</Badge>}
          {(task.start_date || task.due_date) && (
            <span className={`text-xs ${overdue ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
              {task.start_date && `Start ${formatDate(task.start_date)}`}
              {task.start_date && task.due_date && ' → '}
              {task.due_date && `Due ${formatDate(task.due_date)}`}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <select
          value={task.status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs"
          aria-label="Change status"
        >
          {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button onClick={() => openForm(task)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Edit">✎</button>
        <button onClick={remove} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete">🗑</button>
      </div>
    </article>
  );
}
