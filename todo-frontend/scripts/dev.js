// Launcher with flags:  npm start -- [flags]     (or: node scripts/dev.js [flags])
// Starts the Vite dev server and, for --source=dummy, the dummy API server too. No dependencies.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const HELP = `
TaskFlow launcher

  npm start -- [flags]

Flags
  --source=<mock|dummy|real>  data source the UI uses            (default: real)
  --api-url=<url>             API base URL; for "real" this is your backend
                              (default: http://127.0.0.1:8080/api)
  --port=<n>                  web (Vite) port                    (default: 5173)
  --server-port=<n>           dummy server port                  (default: 3001)
  --latency=<ms>              artificial delay of the dummy API  (default: 150)
  --no-server                 don't start the dummy server (it is already running)
  --host                      expose the dev server on the network
  --open                      open the browser
  -h, --help                  show this help

Examples
  npm start                                         UI against real API at 127.0.0.1:8080
  npm start -- --source=dummy                       dummy server + UI
  npm start -- --source=real --api-url=http://localhost:8080/api
  npm start -- --source=mock                        no server needed
  npm start -- --latency=1500 --server-port=4000    simulate a slow API
`;

// ---- parse flags: --key=value, --key value, --flag ----
const flags = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const m = argv[i].match(/^--?([\w-]+)(?:=(.*))?$/);
  if (!m) { console.error(`Unexpected argument: ${argv[i]}`); process.exit(1); }
  const [, key, inline] = m;
  if (inline !== undefined) flags[key] = inline;
  else if (argv[i + 1] && !argv[i + 1].startsWith('-') && !['no-server', 'host', 'open', 'h', 'help'].includes(key)) flags[key] = argv[++i];
  else flags[key] = true;
}
if (flags.h || flags.help) { console.log(HELP); process.exit(0); }

const KNOWN = ['source', 'api-url', 'port', 'server-port', 'latency', 'no-server', 'host', 'open', 'h', 'help'];
const unknown = Object.keys(flags).filter((k) => !KNOWN.includes(k));
if (unknown.length) { console.error(`Unknown flag(s): ${unknown.map((k) => '--' + k).join(', ')}\n${HELP}`); process.exit(1); }

const source = flags.source ?? 'real';
if (!['mock', 'dummy', 'real'].includes(source)) { console.error(`--source must be mock, dummy or real (got "${source}")`); process.exit(1); }
const num = (name, def) => {
  const v = flags[name] === undefined ? def : Number(flags[name]);
  if (!Number.isFinite(v) || v < 0) { console.error(`--${name} must be a non-negative number`); process.exit(1); }
  return v;
};
const port = num('port', 5173);
const serverPort = num('server-port', 3001);
const latency = num('latency', 150);

// ---- environment handed to the frontend (read in src/api/config.js) ----
const dummyUrl = source === 'dummy' && typeof flags['api-url'] === 'string' ? flags['api-url'] : `http://localhost:${serverPort}/api`;
const env = {
  ...process.env,
  VITE_FORCE_SOURCE: source, // a flag beats whatever was saved in the browser
  VITE_DUMMY_API_URL: dummyUrl,
  ...(source === 'real' && flags['api-url'] ? { VITE_REAL_API_URL: String(flags['api-url']) } : {}),
};

const children = [];
function run(name, cmd, args, extraEnv = {}) {
  const child = spawn(cmd, args, { stdio: 'inherit', env: { ...env, ...extraEnv } });
  child.on('exit', (code) => { if (code) console.error(`[${name}] exited with code ${code}`); shutdown(code ?? 0); });
  children.push(child);
}
let closing = false;
function shutdown(code = 0) {
  if (closing) return;
  closing = true;
  children.forEach((c) => c.kill());
  setTimeout(() => process.exit(code), 100);
}
process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());

const useServer = source === 'dummy' && !flags['no-server'] && typeof flags['api-url'] !== 'string';
console.log(`\n  source : ${source}${source === 'mock' ? ' (in-browser)' : ` -> ${source === 'dummy' ? dummyUrl : env.VITE_REAL_API_URL ?? 'http://127.0.0.1:8080/api'}`}`);
console.log(`  web    : http://localhost:${port}`);
if (useServer) console.log(`  dummy  : http://localhost:${serverPort}/api (latency ${latency}ms)`);
console.log('');

if (useServer) run('api', process.execPath, ['mock-server/server.js'], { PORT: String(serverPort), LATENCY_MS: String(latency) });

const viteBin = join(dirname(createRequire(import.meta.url).resolve('vite/package.json')), 'bin', 'vite.js');
const viteArgs = [viteBin, '--port', String(port), '--strictPort'];
if (flags.host) viteArgs.push('--host');
if (flags.open) viteArgs.push('--open');
run('web', process.execPath, viteArgs);
