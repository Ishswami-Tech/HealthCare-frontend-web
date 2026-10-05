const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function load(source, imports = {}, globals = {}) {
  const filename = path.join(__dirname, '..', source);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandboxModule = { exports: {} };
  vm.runInNewContext(code, {
    module: sandboxModule, exports: sandboxModule.exports, process, console, ...globals,
    require: (name) => {
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
      return imports[name];
    },
  }, { filename });
  return sandboxModule.exports;
}

const { createSocketAuthRecovery } = load('src/lib/utils/socket-auth-recovery.ts');
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

function setup(refresh) {
  const pending = new Map();
  const delays = [];
  const tokens = [];
  let exhausted = 0;
  let nextId = 0;
  const recovery = createSocketAuthRecovery({
    refresh,
    onSuccess: (token) => tokens.push(token),
    onExhausted: () => exhausted++,
    schedule: (callback, delay) => {
      delays.push(delay);
      pending.set(++nextId, callback);
      return nextId;
    },
    clear: (id) => pending.delete(id),
  });
  return { recovery, pending, delays, tokens, exhausted: () => exhausted,
    advance: async () => {
      const [id, callback] = pending.entries().next().value;
      pending.delete(id);
      callback();
      await flush();
    },
  };
}

test('temporary failure retries and reconnects with a fresh token', async () => {
  let calls = 0;
  const s = setup(async () => { if (++calls === 1) throw new Error('offline'); return 'fresh'; });
  await s.recovery.recover();
  assert.deepEqual(s.delays, [2000]);
  await s.advance();
  assert.deepEqual(s.tokens, ['fresh']);
  assert.equal(s.pending.size, 0);
});

test('expiry events and proactive refresh coalesce while a request or retry is pending', async () => {
  let resolve;
  let calls = 0;
  const s = setup(() => { calls++; return new Promise((done) => { resolve = done; }); });
  const first = s.recovery.recover();
  await s.recovery.recover();
  assert.equal(calls, 1);
  resolve(null);
  await first;
  await s.recovery.recover();
  assert.equal(calls, 1);
  assert.equal(s.pending.size, 1);
});

test('persistent failure stops after four retries and leaves an actionable error', async () => {
  let calls = 0;
  const s = setup(async () => { calls++; return null; });
  await s.recovery.recover();
  while (s.pending.size) await s.advance();
  assert.equal(calls, 5);
  assert.deepEqual(s.delays, [2000, 4000, 8000, 16000]);
  assert.equal(s.exhausted(), 1);
  assert.deepEqual(s.tokens, []);
});

test('logout cancels pending retries and prevents a late refresh from reconnecting', async () => {
  const s = setup(async () => null);
  await s.recovery.recover();
  s.recovery.cancel();
  assert.equal(s.pending.size, 0);
  let resolve;
  const late = setup(() => new Promise((done) => { resolve = done; }));
  const work = late.recovery.recover();
  late.recovery.cancel();
  resolve('late-token');
  await work;
  assert.deepEqual(late.tokens, []);
});

test('shared refresh reports transient errors and cannot restore a logged-out session', async () => {
  let state = { session: { user: { id: 'user-1' } } };
  let applied = 0;
  let refresh = async () => { throw new Error('offline'); };
  Object.assign(state, { setRefreshing: () => {}, setSession: () => { applied++; } });
  const { refreshClientSessionForRealtime, isSessionInvalidError } = load('src/lib/utils/auth-recovery.ts', {
    '@/lib/config/routes': { ROUTES: {} },
    '@/lib/utils/token-manager': { clearTokens: () => {} },
    '@/lib/actions/auth.server': { refreshToken: () => refresh() },
    '@/stores/auth.store': { useAuthStore: { getState: () => state } },
    '@/stores': { resetAllStores: () => {} },
  });
  assert.equal(isSessionInvalidError(new Error('Failed to fetch')), false);
  assert.equal(isSessionInvalidError({ message: 'Network error', statusCode: 503 }), false);
  assert.equal(isSessionInvalidError({ statusCode: 401 }), true);
  await assert.rejects(refreshClientSessionForRealtime('test'), /offline/);
  let resolve;
  refresh = () => new Promise((done) => { resolve = done; });
  const work = refreshClientSessionForRealtime('test');
  state = { ...state, session: null };
  resolve({ access_token: 'late', user: { id: 'user-1' } });
  assert.equal(await work, null);
  assert.equal(applied, 0);
});

test('HTTP refresh preserves the session on a temporary failure and clears invalid sessions', async () => {
  let cleared = 0;
  let recovered = 0;
  const state = {
    session: { access_token: 'old', user: { id: 'user-1' } },
    clearAuth: () => { cleared++; },
  };
  let refresh = async () => { throw new Error('offline'); };
  const imports = {
    '@/lib/config/config': {
      APP_CONFIG: { API: { BASE_URL: 'https://example.test', TIMEOUT: { REQUEST: 1000 }, RETRY: {} } },
      API_ENDPOINTS: { HEALTH: { BASE: '/health' } },
      HTTP_STATUS: { UNAUTHORIZED: 401 }, ERROR_CODES: { SYSTEM_ERROR: 'SYSTEM_ERROR', AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID' },
      ERROR_MESSAGES: {},
    },
    '@/lib/utils/error-handler': {},
    '@/lib/utils/logger': { logger: { warn: () => {}, error: () => {}, debug: () => {} } },
    '@/lib/utils/metrics': {}, '@/lib/utils/security': {}, '@/lib/utils/date-time': {},
    '@/lib/utils/fetch-with-abort': { fetchWithAbort: async () => { throw new Error('offline'); } },
    '@/lib/utils/token-manager': { getAccessToken: async () => null, getSessionId: async () => null, getClinicId: async () => null },
    '@/lib/utils/clinic-id': { normalizeClinicId: (id) => id },
    '@/stores/auth.store': { useAuthStore: { getState: () => state } },
    '@/lib/utils/auth-recovery': { refreshClientSessionOnce: () => refresh(), triggerClientAuthRecovery: () => { recovered++; } },
    '@/hooks/core/requestDeduper': {},
  };
  const { clinicApiClient } = load('src/lib/api/client.ts', imports, {
    window: {}, Headers, setInterval: () => 0,
  });
  await assert.rejects(clinicApiClient.performTokenRefresh(), { statusCode: 503 });
  assert.equal(cleared, 0);
  assert.equal(recovered, 0);
  refresh = async () => { state.session = null; return null; };
  await assert.rejects(clinicApiClient.performTokenRefresh(), { statusCode: 401 });
  assert.equal(cleared, 1);
  assert.equal(recovered, 1);
});

test('every replacement socket handles expiry before connect and retains auth recovery', () => {
  const { EventEmitter } = require('node:events');
  const sockets = [];
  let store;
  let calls = 0;
  const imports = {
    zustand: { create: () => (initializer) => {
      let state;
      const set = (update) => { state = { ...state, ...(typeof update === 'function' ? update(state) : update) }; };
      state = initializer(set, () => state);
      store = Object.assign(() => state, { getState: () => state, setState: set });
      return store;
    } },
    'zustand/middleware': { devtools: (initializer) => initializer },
    '@/lib/config/config': { APP_CONFIG: { WEBSOCKET: {}, API: {} } },
    'socket.io-client': { io: (_url, options) => {
      const socket = new EventEmitter();
      Object.assign(socket, {
        io: new EventEmitter(), connected: false, onAny: () => {},
        connect: () => {
          assert.equal(options.autoConnect, false);
          assert.ok(socket.listenerCount('token_expired') > 0);
          socket.connected = true;
          socket.emit('connect');
          return socket;
        },
        disconnect: () => { socket.connected = false; socket.emit('disconnect', 'io client disconnect'); },
      });
      sockets.push(socket);
      return socket;
    } },
  };
  load('src/stores/websocket.store.ts', imports);
  const options = { token: 'old', onAuthError: () => { calls++; } };
  store.getState().connect('https://example.test', options);
  sockets[0].emit('token_expired', { canReconnect: true });
  sockets[0].emit('token_expired', { canReconnect: true });
  assert.equal(calls, 1);
  assert.equal(store.getState().connectionMetrics.lastDisconnectReason, 'auth_expired');
  store.getState().connect('https://example.test', { ...options, token: 'fresh', forceReconnect: true });
  assert.equal(sockets[0].io.listenerCount('reconnect_error'), 0);
  assert.equal(store.getState().connectionMetrics.lastDisconnectReason, undefined);
  sockets[1].emit('token_expired', { canReconnect: true });
  assert.equal(calls, 2);
});
