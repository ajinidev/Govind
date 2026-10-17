# TaskFlow API contract

This is the contract the frontend expects. Implement it in any language/framework, then run the
frontend with `VITE_USE_MOCK=false`. The in-browser mock ([src/api/mockApi.js](../src/api/mockApi.js))
is a working **reference implementation** of every rule below — read `queryTasks()` and `validate()`.

Base path: `/api` · JSON in/out · all dates are `YYYY-MM-DD` strings (no time zone) · timestamps are ISO-8601 UTC.
JSON and query-parameter names are `snake_case`.

## Task resource

| field         | type             | notes                                              |
|---------------|------------------|----------------------------------------------------|
| `id`          | string           | server-generated (UUID or stringified int)         |
| `title`       | string           | required, 1–120 chars after trimming               |
| `description` | string \| null   |                                                    |
| `start_date`  | date \| null     |                                                    |
| `due_date`    | date \| null     | must be ≥ `start_date` when both set              |
| `priority`    | enum             | `low` \| `medium` (default) \| `high` \| `urgent`  |
| `status`      | enum             | `todo` (default) \| `in_progress` \| `on_hold` \| `done` |
| `category`    | string \| null   | free text                                          |
| `created_at`  | timestamp        | server-set                                         |
| `updated_at`  | timestamp        | server-set on every change                         |

## Endpoints

| method | path             | body            | success                         |
|--------|------------------|-----------------|---------------------------------|
| GET    | `/tasks`         | –               | `200 { "data": Task[], "total": n }` |
| GET    | `/tasks/stats`   | –               | `200 { "today", "all", "due", "overdue" }` (counts) |
| GET    | `/tasks/{id}`    | –               | `200 Task` · `404`              |
| POST   | `/tasks`         | Task fields     | `201 Task` · `422`              |
| PATCH  | `/tasks/{id}`    | partial fields  | `200 Task` · `404` · `422`      |
| DELETE | `/tasks/{id}`    | –               | `204` · `404`                   |

Register `/tasks/stats` **before** `/tasks/{id}` or the router will treat "stats" as an id.
`PATCH` merges the supplied fields into the stored task, then validates the *merged* result.

### `GET /tasks` query parameters (all optional, combine with AND)

| param          | meaning                                                                                  |
|----------------|------------------------------------------------------------------------------------------|
| `status`       | one status or comma list: `todo,in_progress`                                             |
| `priority`     | exact match                                                                              |
| `category`     | exact match                                                                              |
| `q`            | case-insensitive substring over title + description + category                           |
| `exclude_done` | `true` → omit `status = done`                                                            |
| `overdue`      | `true` → `status != done` AND `due_date < today`                                         |
| `today`        | client's current date; used by `overdue`. Default: server date. (Clients send it so "today" is the *user's* day, not the server's.) |
| `due_from` / `due_to` | `due_date` within the inclusive range; tasks with no due date never match         |
| `from` / `to`  | **date-range overlap** (see below). Either bound may be omitted                          |
| `sort`         | `due_date` (default), `start_date`, `priority`, `title`, `created_at`; prefix `-` for descending. `priority` ranks low<medium<high<urgent. **Null dates always sort last.** |

**Date-range overlap.** A task occupies the span `[start_date, due_date]`. If one is null it falls back to
the other; if both are null the task has no span and never matches `from`/`to`. A task matches when
`span.start <= to` AND `span.end >= from`. Therefore:

- "Tasks for a specific day D" → `from=D&to=D`
- "Today's tasks" → `from=<today>&to=<today>`
- "Tasks in a date range" → `from=2026-10-01&to=2026-10-31`

### How each frontend page maps to the API

| page         | request                                                                       |
|--------------|-------------------------------------------------------------------------------|
| Today        | `GET /tasks?from=T&to=T`                                                      |
| All tasks    | `GET /tasks`                                                                  |
| Due          | `GET /tasks?exclude_done=true&due_from=T&due_to=T+N`                          |
| Overdue      | `GET /tasks?overdue=true&today=T`                                             |
| By status    | `GET /tasks?status=in_progress`                                               |
| Date range   | `GET /tasks?from=A&to=B`                                                      |
| Specific day | `GET /tasks?from=D&to=D`                                                      |

(every page also adds `q`, `priority`, `sort`, and optionally `exclude_done`). The exact request each page
makes is printed under its title in the UI.

### `GET /tasks/stats?today=YYYY-MM-DD`

Counts of **non-done** tasks used for the sidebar badges:
`today` (span contains today) · `all` · `due` (`due_date >= today`) · `overdue` (`due_date < today`).

## Errors

Non-2xx responses use one envelope:

```json
{ "error": { "code": "validation_error", "message": "Validation failed.",
             "fields": { "title": "Title is required.", "due_date": "due_date cannot be before start_date." } } }
```

| status | code               | when                              |
|--------|--------------------|-----------------------------------|
| 404    | `not_found`        | unknown task id                   |
| 422    | `validation_error` | invalid body; `fields` is per-field messages (shown under the form inputs) |

## Example

```http
POST /api/tasks
Content-Type: application/json

{ "title": "Write report", "start_date": "2026-10-17", "due_date": "2026-10-20",
  "priority": "high", "status": "todo", "category": "Work", "description": null }
```
```http
HTTP/1.1 201 Created
{ "id": "7c1e…", "title": "Write report", "start_date": "2026-10-17", "due_date": "2026-10-20",
  "priority": "high", "status": "todo", "category": "Work", "description": null,
  "created_at": "2026-10-17T09:12:00Z", "updated_at": "2026-10-17T09:12:00Z" }
```

## Suggested learning path

1. Implement `POST/GET/PATCH/DELETE /tasks` with validation → create/edit/delete work in the UI.
2. Add `status`, `priority`, `q`, `sort` filters.
3. Add `from`/`to` overlap (Today, Specific day, Date range pages).
4. Add `due_from`/`due_to`, `exclude_done`, `overdue` (Due, Overdue pages).
5. Add `/tasks/stats` (sidebar badges).
6. Later: pagination (`page`, `page_size`), auth, users — extend the contract and the `httpApi.js` client.
