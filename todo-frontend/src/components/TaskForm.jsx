import { useEffect, useState } from 'react';
import { ApiError, tasksApi } from '../api/index.js';
import { useTasksCtx } from '../hooks.js';
import { today } from '../lib/dates.js';
import { PRIORITIES, STATUSES } from '../lib/constants.js';

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-2 focus:outline-indigo-500';

function Field({ label, error, children }) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-sm text-slate-600">
      {label}
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

/** Create (task = null) or edit (task = object) modal. */
export default function TaskForm({ task }) {
  const { bump, closeForm } = useTasksCtx();
  const [v, setV] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    start_date: task ? task.start_date ?? '' : today(),
    due_date: task?.due_date ?? '',
    priority: task?.priority ?? 'medium',
    status: task?.status ?? 'todo',
    category: task?.category ?? '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeForm();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeForm]);

  async function submit(e) {
    e.preventDefault();
    // Empty strings become null so the API gets clean data.
    const body = {
      ...v,
      title: v.title.trim(),
      description: v.description.trim() || null,
      start_date: v.start_date || null,
      due_date: v.due_date || null,
      category: v.category.trim() || null,
    };
    setSaving(true);
    setErrors({});
    try {
      await (task ? tasksApi.update(task.id, body) : tasksApi.create(body));
      bump();
      closeForm();
    } catch (err) {
      // 422 from the backend carries per-field messages: { error: { fields: { title: "..." } } }
      setErrors(err instanceof ApiError ? { ...err.fields, _form: err.message } : { _form: String(err) });
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && closeForm()}>
      <form onSubmit={submit} noValidate className="flex max-h-[95vh] w-full max-w-lg flex-col gap-3 overflow-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold">{task ? 'Edit task' : 'New task'}</h2>

        <Field label="Title *" error={errors.title}>
          <input autoFocus className={inputCls} value={v.title} onChange={set('title')} maxLength={120} placeholder="What needs to be done?" />
        </Field>
        <Field label="Description" error={errors.description}>
          <textarea className={inputCls} rows={3} value={v.description} onChange={set('description')} placeholder="Details, notes…" />
        </Field>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label="Start date" error={errors.start_date}>
            <input type="date" className={inputCls} value={v.start_date} onChange={set('start_date')} />
          </Field>
          <Field label="Due date" error={errors.due_date}>
            <input type="date" className={inputCls} value={v.due_date} onChange={set('due_date')} />
          </Field>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field label="Priority" error={errors.priority}>
            <select className={inputCls} value={v.priority} onChange={set('priority')}>
              {Object.entries(PRIORITIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Status" error={errors.status}>
            <select className={inputCls} value={v.status} onChange={set('status')}>
              {Object.entries(STATUSES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Category" error={errors.category}>
          <input className={inputCls} value={v.category} onChange={set('category')} placeholder="e.g. Work, Home" />
        </Field>

        {errors._form && <p className="text-sm text-red-600">{errors._form}</p>}
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={closeForm} className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50">Cancel</button>
          <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
