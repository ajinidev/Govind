import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { tasksApi } from '../api/index.js';
import DataSourcePanel from './DataSourcePanel.jsx';
import { useAsync, useTasksCtx } from '../hooks.js';
import { today } from '../lib/dates.js';
import TaskForm from './TaskForm.jsx';

const NAV = [
  { to: '/today', label: 'Today', stat: 'today' },
  { to: '/all', label: 'All tasks', stat: 'all' },
  { to: '/due', label: 'Due', stat: 'due' },
  { to: '/overdue', label: 'Overdue', stat: 'overdue', danger: true },
  { to: '/status', label: 'By status' },
  { to: '/range', label: 'Date range' },
  { to: '/day', label: 'Specific day' },
];

export default function Layout() {
  const { revision, openForm, form } = useTasksCtx();
  const [open, setOpen] = useState(false);
  const { data: stats, error: statsError } = useAsync(() => tasksApi.stats(today()), [revision]);

  return (
    <div className="flex min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-60 shrink-0 border-r border-slate-200 bg-white p-4 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="mb-5 px-2 text-xl font-bold text-indigo-600">✔ TaskFlow</div>
        <button
          onClick={() => { openForm(null); setOpen(false); }}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
        >
          + New task
        </button>
        <nav className="mt-4 flex flex-col gap-0.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2 ${
                  isActive ? 'bg-indigo-600 font-semibold text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {n.label}
              {n.stat && stats?.[n.stat] > 0 && (
                <span className={`min-w-5 rounded-full px-1.5 text-center text-xs ${n.danger ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {stats[n.stat]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <DataSourcePanel error={statsError} />
      </aside>
      {open && <div className="fixed inset-0 z-10 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

      <main className="min-w-0 flex-1 px-4 py-6 md:px-10">
        <button onClick={() => setOpen(true)} className="mb-4 rounded-md border border-slate-300 px-3 py-1 md:hidden" aria-label="Open menu">
          ☰
        </button>
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>

      {form !== undefined && <TaskForm key={form?.id ?? 'new'} task={form} />}
    </div>
  );
}
