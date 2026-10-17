// HTTP client for any server that implements docs/API.md (the dummy server or your real backend).
import { ApiError } from './errors.js';
import { buildPath } from './query.js';

export function createHttpApi(baseUrl) {
  const base = baseUrl.replace(/\/+$/, '');

  async function request(method, path, { params, body } = {}) {
    let res;
    try {
      res = await fetch(base + buildPath(path, params), {
        method,
        headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      // fetch only rejects on network failure / CORS block / refused connection.
      throw new ApiError(0, 'network_error', `Cannot reach ${base}. Is the server running (and does it allow CORS)?`);
    }

    if (res.status === 204) return null;
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const e = payload?.error ?? {};
      throw new ApiError(res.status, e.code ?? 'http_error', e.message ?? `Request failed (${res.status})`, e.fields);
    }
    return payload;
  }

  return {
    list: (params) => request('GET', '/tasks', { params }), // -> { data: Task[], total }
    stats: (today) => request('GET', '/tasks/stats', { params: { today } }),
    get: (id) => request('GET', `/tasks/${id}`),
    create: (body) => request('POST', '/tasks', { body }),
    update: (id, patch) => request('PATCH', `/tasks/${id}`, { body: patch }),
    remove: (id) => request('DELETE', `/tasks/${id}`),
  };
}
