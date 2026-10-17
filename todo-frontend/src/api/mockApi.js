// In-browser fake backend (no network). Rules live in taskLogic.js; data persists in localStorage.
import { ApiError } from './errors.js';
import { buildPath } from './query.js';
import { buildSeed } from './seed.js';
import { buildTask, computeStats, patchTask, queryTasks } from './taskLogic.js';

const KEY = 'taskflow.mock.v2';
const LATENCY_MS = 250;

let tasks = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const seed = buildSeed();
  persist(seed);
  return seed;
}
function persist(list = tasks) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/** Pretend to be a network call: log it, wait, then resolve (deep-copied) or reject. */
async function respond(label, fn) {
  console.info(`[mock api] ${label}`);
  await new Promise((r) => setTimeout(r, LATENCY_MS));
  return structuredClone(fn());
}

const notFound = (id) => new ApiError(404, 'not_found', `Task ${id} not found.`);

export const mockApi = {
  list: (params) =>
    respond(`GET ${buildPath('/tasks', params)}`, () => {
      const data = queryTasks(tasks, params);
      return { data, total: data.length };
    }),

  stats: (today) => respond(`GET /tasks/stats?today=${today}`, () => computeStats(tasks, today)),

  get: (id) =>
    respond(`GET /tasks/${id}`, () => {
      const t = tasks.find((x) => x.id === id);
      if (!t) throw notFound(id);
      return t;
    }),

  create: (body) =>
    respond('POST /tasks', () => {
      const task = buildTask(body, crypto.randomUUID());
      tasks.push(task);
      persist();
      return task;
    }),

  update: (id, patch) =>
    respond(`PATCH /tasks/${id}`, () => {
      const i = tasks.findIndex((x) => x.id === id);
      if (i < 0) throw notFound(id);
      tasks[i] = patchTask(tasks[i], patch);
      persist();
      return tasks[i];
    }),

  remove: (id) =>
    respond(`DELETE /tasks/${id}`, () => {
      if (!tasks.some((x) => x.id === id)) throw notFound(id);
      tasks = tasks.filter((x) => x.id !== id);
      persist();
      return null;
    }),
};

/** Dev helper: window.resetMockData() restores the dummy dataset. */
window.resetMockData = () => { tasks = buildSeed(); persist(); location.reload(); };
