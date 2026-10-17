// Dummy REST endpoint implementing docs/API.md with in-memory dummy data. Zero dependencies.
//   node mock-server/server.js         (PORT=3001, LATENCY_MS=150 by default)
// Data resets when the server restarts. Read this file as a template for your real backend.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { ApiError } from '../src/api/errors.js';
import { buildSeed } from '../src/api/seed.js';
import { buildTask, computeStats, patchTask, queryTasks } from '../src/api/taskLogic.js';

const PORT = Number(process.env.PORT) || 3001;
const LATENCY_MS = Number(process.env.LATENCY_MS ?? 150);

let tasks = buildSeed();

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function send(res, status, payload) {
  const body = payload === undefined ? '' : JSON.stringify(payload);
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json' });
  res.end(body);
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new ApiError(400, 'bad_request', 'Body must be valid JSON.'); }
}

const notFound = (what) => new ApiError(404, 'not_found', `${what} not found.`);

/** Route table: returns [status, payload]. */
async function route(req, url) {
  const { pathname, searchParams } = url;
  const params = Object.fromEntries(searchParams);
  const parts = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean); // ['tasks', ':id'?]
  if (parts[0] !== 'tasks' || parts.length > 2) throw notFound('Route');
  const id = parts[1];
  const m = req.method;

  if (!id) {
    if (m === 'GET') {
      const data = queryTasks(tasks, params);
      return [200, { data, total: data.length }];
    }
    if (m === 'POST') {
      const task = buildTask(await readJson(req), randomUUID());
      tasks.push(task);
      return [201, task];
    }
  } else if (id === 'stats') {
    // Must be matched before the generic :id route.
    if (m === 'GET') return [200, computeStats(tasks, params.today || undefined)];
  } else {
    const i = tasks.findIndex((t) => t.id === id);
    if (m === 'GET') {
      if (i < 0) throw notFound(`Task ${id}`);
      return [200, tasks[i]];
    }
    if (m === 'PATCH') {
      if (i < 0) throw notFound(`Task ${id}`);
      tasks[i] = patchTask(tasks[i], await readJson(req));
      return [200, tasks[i]];
    }
    if (m === 'DELETE') {
      if (i < 0) throw notFound(`Task ${id}`);
      tasks.splice(i, 1);
      return [204, undefined];
    }
  }
  throw new ApiError(405, 'method_not_allowed', `${m} not allowed on ${pathname}.`);
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); } // CORS preflight
    await new Promise((r) => setTimeout(r, LATENCY_MS));
    try {
      const [status, payload] = await route(req, url);
      send(res, status, payload);
      console.log(`${req.method} ${url.pathname}${url.search} -> ${status}`);
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(500, 'internal_error', 'Unexpected server error.');
      if (!(e instanceof ApiError)) console.error(e);
      send(res, err.status, { error: { code: err.code, message: err.message, fields: err.fields } });
      console.log(`${req.method} ${url.pathname}${url.search} -> ${err.status} ${err.code}`);
    }
  })
  .listen(PORT, () => console.log(`Dummy TaskFlow API on http://localhost:${PORT}/api  (${tasks.length} tasks)`));
