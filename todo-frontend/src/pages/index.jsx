// One tiny component per page. Each only declares WHICH API query it needs.
import { useState } from 'react';
import TaskListView, { controlCls } from '../components/TaskListView.jsx';
import { addDays, formatDate, today } from '../lib/dates.js';
import { STATUSES } from '../lib/constants.js';

export function TodayPage() {
  const t = today();
  return (
    <TaskListView
      title={`Today · ${formatDate(t)}`}
      params={{ from: t, to: t }}
      empty="Nothing scheduled for today 🎉"
      hideDoneToggle
    />
  );
}

export function AllPage() {
  return <TaskListView title="All tasks" params={{}} empty="No tasks yet. Create one with “New task”." hideDoneToggle />;
}

export function DuePage() {
  const [within, setWithin] = useState('7');
  const t = today();
  return (
    <TaskListView
      title="Due tasks"
      params={{ exclude_done: true, due_from: t, due_to: within === 'all' ? '' : addDays(t, Number(within)) }}
      empty="No upcoming due tasks."
      toolbar={
        <select className={controlCls} value={within} onChange={(e) => setWithin(e.target.value)} aria-label="Due within">
          <option value="1">Today / tomorrow</option>
          <option value="7">Next 7 days</option>
          <option value="30">Next 30 days</option>
          <option value="all">Any time</option>
        </select>
      }
    />
  );
}

export function OverduePage() {
  return <TaskListView title="Overdue tasks" params={{ overdue: true, today: today() }} empty="No overdue tasks. Nice work!" />;
}

export function StatusPage() {
  const [status, setStatus] = useState('todo');
  return (
    <TaskListView
      title={`Status: ${status === 'all' ? 'All' : STATUSES[status]}`}
      params={{ status: status === 'all' ? '' : status }}
      empty="No tasks with this status."
      toolbar={
        <div className="flex w-full flex-wrap gap-1.5">
          {[['all', 'All'], ...Object.entries(STATUSES)].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setStatus(v)}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${status === v ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
            >
              {l}
            </button>
          ))}
        </div>
      }
    />
  );
}

export function RangePage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(addDays(today(), 7));
  // Keep from <= to by nudging the other end.
  const changeFrom = (v) => { setFrom(v); if (to && v > to) setTo(v); };
  const changeTo = (v) => { setTo(v); if (from && v < from) setFrom(v); };
  return (
    <TaskListView
      title="Tasks by date range"
      params={{ from, to }}
      empty="No tasks in this date range."
      hideDoneToggle
      toolbar={
        <>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            From <input type="date" className={controlCls} value={from} onChange={(e) => changeFrom(e.target.value)} />
          </label>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            To <input type="date" className={controlCls} value={to} onChange={(e) => changeTo(e.target.value)} />
          </label>
        </>
      }
    />
  );
}

export function DayPage() {
  const [day, setDay] = useState(today());
  const step = (n) => setDay((d) => addDays(d, n));
  return (
    <TaskListView
      title={`Tasks on ${formatDate(day)}`}
      params={{ from: day, to: day }}
      empty="No tasks on this day."
      hideDoneToggle
      toolbar={
        <div className="flex items-center gap-1">
          <button onClick={() => step(-1)} className={controlCls} aria-label="Previous day">‹</button>
          <input type="date" className={controlCls} value={day} onChange={(e) => e.target.value && setDay(e.target.value)} />
          <button onClick={() => step(1)} className={controlCls} aria-label="Next day">›</button>
        </div>
      }
    />
  );
}
