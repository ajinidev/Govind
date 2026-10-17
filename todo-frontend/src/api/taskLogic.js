// Pure business rules of the API (no browser or Node specifics), so the in-browser mock AND the
// dummy HTTP server (mock-server/server.js) behave identically. Reference implementation of docs/API.md.
import { ApiError } from './errors.js';
import { today as todayISO } from '../lib/dates.js';

export const PRIORITY_RANK = { low: 0, medium: 1, high: 2, urgent: 3 };
export const STATUSES = ['todo', 'in_progress', 'on_hold', 'done'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Query-string values arrive as strings ("true"); the in-browser mock passes real booleans.
const isTrue = (v) => v === true || v === 'true';

// ---------- validation (422) ----------
export function validate(t) {
  const fields = {};
  if (!t.title || !String(t.title).trim()) fields.title = 'Title is required.';
  else if (t.title.length > 120) fields.title = 'Title must be at most 120 characters.';
  if (!(t.priority in PRIORITY_RANK)) fields.priority = 'Must be one of: low, medium, high, urgent.';
  if (!STATUSES.includes(t.status)) fields.status = `Must be one of: ${STATUSES.join(', ')}.`;
  for (const f of ['start_date', 'due_date']) {
    if (t[f] != null && !DATE_RE.test(t[f])) fields[f] = 'Must be YYYY-MM-DD.';
  }
  if (!fields.start_date && !fields.due_date && t.start_date && t.due_date && t.due_date < t.start_date) {
    fields.due_date = 'due_date cannot be before start_date.';
  }
  if (Object.keys(fields).length) {
    throw new ApiError(422, 'validation_error', 'Validation failed.', fields);
  }
}

/** POST /tasks: defaults + server-set fields, validated. */
export function buildTask(body, id) {
  const now = new Date().toISOString();
  const task = {
    description: null, start_date: null, due_date: null, category: null,
    priority: 'medium', status: 'todo',
    ...body,
    id, created_at: now, updated_at: now,
  };
  validate(task);
  task.title = task.title.trim();
  return task;
}

/** PATCH /tasks/{id}: merge, then validate the merged result. */
export function patchTask(existing, patch) {
  const merged = { ...existing, ...patch, id: existing.id, created_at: existing.created_at, updated_at: new Date().toISOString() };
  validate(merged);
  return merged;
}

// ---------- query semantics ----------
/** The [start, end] span of a task. A missing end falls back to the other; no dates => null. */
const span = (t) => {
  const s = t.start_date ?? t.due_date;
  const e = t.due_date ?? t.start_date;
  return s ? [s, e] : null;
};

export function queryTasks(all, p = {}) {
  const today = p.today || todayISO();
  const q = p.q?.trim().toLowerCase();
  const statuses = p.status ? String(p.status).split(',') : null;

  let rows = all.filter((t) => {
    if (statuses && !statuses.includes(t.status)) return false;
    if (p.priority && t.priority !== p.priority) return false;
    if (p.category && t.category !== p.category) return false;
    if (isTrue(p.exclude_done) && t.status === 'done') return false;
    if (isTrue(p.overdue) && !(t.status !== 'done' && t.due_date && t.due_date < today)) return false;
    if (p.due_from && !(t.due_date && t.due_date >= p.due_from)) return false;
    if (p.due_to && !(t.due_date && t.due_date <= p.due_to)) return false;
    if (p.from || p.to) {
      // Overlap test: task span intersects [from, to]. from=to=D means "tasks active on day D".
      const sp = span(t);
      if (!sp) return false;
      if (p.to && sp[0] > p.to) return false;
      if (p.from && sp[1] < p.from) return false;
    }
    if (q && !`${t.title} ${t.description ?? ''} ${t.category ?? ''}`.toLowerCase().includes(q)) return false;
    return true;
  });

  // sort=field or sort=-field (descending). Null dates always sort last.
  const sort = p.sort || 'due_date';
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  const val = (t) => (field === 'priority' ? PRIORITY_RANK[t.priority] : t[field]);
  return rows.sort((a, b) => {
    const x = val(a), y = val(b);
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    const c = x < y ? -1 : x > y ? 1 : 0;
    return desc ? -c : c;
  });
}

export function computeStats(all, today = todayISO()) {
  const open = all.filter((t) => t.status !== 'done');
  return {
    today: open.filter((t) => { const s = span(t); return s && s[0] <= today && today <= s[1]; }).length,
    all: open.length,
    due: open.filter((t) => t.due_date && t.due_date >= today).length,
    overdue: open.filter((t) => t.due_date && t.due_date < today).length,
  };
}
