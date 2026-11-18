// Run with: node --test scripts/health-realtime-auth-gate.test.cjs
// The /health socket must only exist while the user has an access token.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const SOURCE = 'src/hooks/realtime/useHealthRealtime.ts';

function setup() {
  const sockets = [];
  const timers = new Map();
  let nextTimer = 0;
  let refreshCalls = 0;
  let token = null;

  // Minimal React: one component, effects re-run when their deps change.
  let effect = null;
  const react = {
    useCallback: (fn) => fn,
    useEffect: (fn, deps) => {
      const changed = !effect || deps.some((d, i) => !Object.is(d, effect.deps[i]));
      if (!changed) return;
      if (effect && typeof effect.cleanup === 'function') effect.cleanup();
      effect = { deps, cleanup: fn() };
    },
  };

  const io = (url, opts) => {
    const socket = {
      url, opts, auth: opts.auth, connected: false, connects: 0, disconnects: 0,
      on() {}, emit() {},
      connect() { this.connects++; },
      disconnect() { this.disconnects++; this.connected = false; },
    };
    sockets.push(socket);
    return socket;
  };

  const healthState = new Proxy({}, { get: () => () => {} });
  const window = {
    setTimeout: (cb) => { timers.set(++nextTimer, cb); return nextTimer; },
    clearTimeout: (id) => { timers.delete(id); },
  };

  const filename = path.join(__dirname, '..', SOURCE);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const imports = {
    react,
    'socket.io-client': { io },
    '@/lib/utils/date-time': { nowIso: () => '1970-01-01T00:00:00.000Z' },
    '@/lib/config/config': { APP_CONFIG: { WEBSOCKET: { URL: 'https://api.example.test' } } },
    '@/stores': { useHealthStore: { getState: () => healthState } },
    '@/stores/auth.store': {
      useAuthStore: (select) => select({ session: token ? { access_token: token } : null }),
    },
    '@/lib/utils/auth-recovery': {
      getJwtRefreshDelayMs: () => null,
      refreshClientSessionForRealtime: async () => { refreshCalls++; return null; },
    },
  };
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod, exports: mod.exports, window, console,
    require: (name) => {
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
      return imports[name];
    },
  }, { filename });

  return {
    sockets,
    refreshCalls: () => refreshCalls,
    render(nextToken, options) {
      token = nextToken;
      return mod.exports.useHealthRealtime(options);
    },
    runTimers() {
      const pending = [...timers.values()];
      timers.clear();
      pending.forEach((cb) => cb());
    },
  };
}

test('signed-out pages never open the /health socket', () => {
  const h = setup();
  h.render(null);
  h.render(undefined);
  h.runTimers();
  assert.equal(h.sockets.length, 0);
  assert.equal(h.refreshCalls(), 0);
});

test('signed-in pages connect with the access token', () => {
  const h = setup();
  h.render('token-a');
  assert.equal(h.sockets.length, 1);
  assert.equal(h.sockets[0].url, 'https://api.example.test/health');
  assert.equal(h.sockets[0].opts.auth.token, 'token-a');
});

test('a disabled hook stays offline even with a token', () => {
  const h = setup();
  h.render('token-a', { enabled: false });
  assert.equal(h.sockets.length, 0);
});

test('logout closes the socket and never reconnects without a token', () => {
  const h = setup();
  h.render('token-a');
  const socket = h.sockets[0];
  h.render(null);
  h.runTimers();
  assert.equal(socket.disconnects, 1);
  assert.equal(socket.connects, 0);
  assert.equal(h.sockets.length, 1);
});

test('a refreshed token reuses the socket with the new token', () => {
  const h = setup();
  h.render('token-a');
  h.render('token-b');
  h.runTimers();
  assert.equal(h.sockets.length, 1);
  assert.equal(h.sockets[0].auth.token, 'token-b');
  assert.equal(h.sockets[0].disconnects, 0);
});

test('signing in again after logout opens a fresh socket with the new token', () => {
  const h = setup();
  h.render('token-a');
  h.render(null);
  h.runTimers();
  h.render('token-b');
  assert.equal(h.sockets.length, 2);
  assert.equal(h.sockets[1].opts.auth.token, 'token-b');
});
