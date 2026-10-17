# TaskFlow frontend (React + Tailwind)

A todo app front end for learning backend development. It can read data from three sources:

| source  | what it is                                              |
|---------|---------------------------------------------------------|
| `real`  | your backend at `http://127.0.0.1:8080/api` — **default** |
| `dummy` | local Node server with dummy data (`mock-server/`)     |
| `mock`  | in-browser fake, no network                             |

```bash
npm install
npm start                                   # UI (:5173) against your backend at 127.0.0.1:8080
npm run dev:dummy                           # dummy server (:3001) + UI
npm run dev:mock                            # in-browser mock, no server
npm run dev:real                            # same as npm start
npm start -- --help                         # all flags
```

Launcher flags (`scripts/dev.js`): `--source`, `--api-url`, `--port`, `--server-port`, `--latency`,
`--no-server`, `--host`, `--open`. Without flags you can also switch source from the sidebar.
Other scripts: `npm run server` (dummy API only), `npm run dev` (plain Vite), `npm run build`.

## Building the backend
The contract is in [docs/API.md](docs/API.md). `mock-server/server.js` and `src/api/taskLogic.js` are a
working reference implementation. Your server must allow CORS (the UI calls it directly from another origin).

## Layout
- `src/api/` — `index.js` picks the client; `httpApi.js` (real + dummy), `mockApi.js`, `taskLogic.js` (rules).
- `src/pages/` — one tiny component per page, declaring only its API query.
- `mock-server/server.js` — dependency-free dummy REST server.
