# Cache-First Realtime: Eliminate Skeletons & Flicker

> Problem statement, root-cause analysis, and implementation plan for the
> appointment list flicker on `/patient/appointments` and related pages.
> Status: **Analysis + Plan, no code yet.**

---

## 0. Scope: What This Plan Does NOT Change

This plan is **frontend-only**. Before reading further, please note:

- **No API endpoints change.** `GET /appointments/my-appointments`,
  `GET /appointments/view`, and every other REST URL stays exactly as it
  is. The backend team is not required to do anything for Phases 1–3.
- **No WebSocket event names or payload shapes change.** The backend
  keeps emitting `appointment.created`, `appointment.updated`,
  `appointment.cancelled`, etc. with whatever shape it emits today.
- **No backend service logic changes.** `CoreAppointmentService`,
  `AppGateway`, and `SocketAuthMiddleware` are read-only references here.
- **No new environment variables, no new feature flags, no new
  provider tokens.** This is purely a rewrite of how the frontend's
  React Query cache and WebSocket manager cooperate.

**What IS changing is *when* the frontend chooses to call a REST
endpoint, and *what* it does with the WebSocket events it already
receives.** All the "REST calls" referenced in the phases below are
calls to URLs that already exist; we're just stopping the frontend from
making them at times when its own cache is already correct.

The only backend coordination items are the four open questions in
§10.8. None of them block the frontend work.

---

## 1. Problem Statement

The `/patient/appointments` page (and any page using `useMyAppointments`)
shows a loading skeleton for 4–5 seconds on every navigation, and
flickers on every WebSocket event. Backend logs show the same appointment
view query being repeated dozens of times in a single user session, each
one paired with a `Token has expired - please refresh` rejection from
the socket.

**Expected behavior**

- Cold cache (first-ever visit, hard refresh, cleared cache) → skeleton
  is acceptable.
- Warm cache (any previous data within freshness window) → show previous
  data immediately, update numbers in place, never show a skeleton.
- WebSocket event → mutate cache in place, re-render with new data, no
  REST refetch, no skeleton, no row unmount.
- Socket reconnect → only REST-refetch if cache is older than the
  reconnect timestamp OR socket has been disconnected for >30s.

**Why it matters**

- Every flicker is a perceived slowness bug. The user sees the page as
  "loading" even when the data is already in memory.
- Each socket flap currently triggers 1+ REST round-trips. With token
  expiry on every connection, this is multiplying into dozens of
  redundant `VIEW_APPOINTMENTS` audit log entries per session.
- The skeleton is a *symptom* of an architectural problem: the WebSocket
  is not actually the source of truth, even though it's supposed to be.

---

## 2. Root-Cause Analysis

Four independent layers each contribute to the skeleton. Fixing only one
will not eliminate it.

### 2.1 Socket churn (effect re-runs kill the connection)

**File:** `src/hooks/realtime/useWebSocketIntegration.ts`, lines
`1294–1363`.

The connection-init `useEffect` lists `connect`, `disconnect`,
`clearError`, `scheduleAuthRefresh`, `clearAuthRefreshTimer`,
`registerRealtimeSubscriptions` in its dependency array. Every one of
these is a method on the Zustand `useWebSocketStore` — and method
references change identity on every store update. So:

- Any message arrives → store updates `messagesReceived` → effect
  re-runs → `connect()` is called → old socket is killed → new `sid` is
  issued.
- Any heartbeat fires → same thing.
- Any `connectionStatus` flip → same thing.

Network log evidence (each new `sid` is one churn cycle):

```
sid=rInGFkeEp8DNZ4nmAAYY
sid=WEMcPAWIAAZJgEi5AAYa
sid=qofIWN5tIBScoUW8AAYf
sid=iEAs9kgBpRPCUzPFAAYc
sid=qofIWN5tIBScoUW8AAYf  (reconnect)
sid=sekUSBfjs7gLWxUaAAYl
sid=HajYTkKw_woXNdmlAAYh
sid=IT84ALbjLwiP-fBuAAYn  ← 400 Bad Request
...
```

A single page session can churn through 10+ connections. None of them
stay alive long enough to deliver any meaningful realtime updates.

### 2.2 Socket auth loop (expired token, no proactive refresh)

**File:** `src/hooks/realtime/useWebSocketIntegration.ts`, lines
`1230–1345`.
**Server:** `AppGateway` + `SocketAuthMiddleware`.

Backend log pattern, one per connection:

```
[WARN]  [SocketAuthMiddleware] Token expired for JVN3wtUsyjTsdb4OAAPi
[ERROR] [AppGateway]             Token has expired - please refresh
```

What happens:

1. The first `connect()` call ships the session's `access_token`. If the
   session has been idle for a while, the JWT is already expired.
2. Server's `SocketAuthMiddleware` rejects the connection with 400 on
   the polling POST.
3. Client's `socket.io` parser does **not** surface this as a
   `connect_error` whose `message` matches the existing
   `isAuthError` regex
   (`/jwt expired|authentication required|no token or session/i`).
   The server's actual message is `"Token has expired - please refresh"`,
   which doesn't match.
4. Therefore the `onAuthError` callback (`useWebSocketIntegration.ts:1317`)
   **never fires**. The token-refresh path is dead.
5. Client retries with `reconnectionAttempts: 5`. All 5 fail with the
   same dead token. Eventually `reconnect_failed` fires.
6. The user navigates → effect re-runs → new connection attempt → same
   dead token → repeat.

There is no proactive "is this token about to expire? refresh first"
step before `connect()`.

### 2.3 Cache invalidation on every socket event

**File:** `src/hooks/realtime/useWebSocketIntegration.ts`, lines
`283–316`, `647–770`.
**Helper:** `invalidateAppointmentQueryFamilies` (lines `23–37`).

Every socket event handler does this exact pattern:

```ts
if (appointment) {
  upsertRealtimeAppointmentCaches(queryClient, appointment);
}
if (!hasRealtimeAppointmentSnapshot(rawData)) {
  invalidateAppointmentQueryFamilies(queryClient);
}
```

The handler updates the cache directly via the merge function **and then
invalidates the same cache key**, forcing React Query to refetch. This
defeats the entire point of the WebSocket: the data was just delivered,
and we're throwing it away to ask the REST API for the same thing.

Additionally, the "sync on connect" effect at line `1369`:

```ts
useEffect(() => {
  if (!isConnected) {
    hasSyncedOnConnectRef.current = false;
    return;
  }
  hasSyncedOnConnectRef.current = true;
  invalidateAppointmentQueryFamilies(queryClient);
}, [isConnected, ...]);
```

Invalidates the entire appointment query family on every `isConnected`
flip. With the socket churn from §2.1, this fires 10+ times per page
session.

### 2.4 REST fallback over-triggered

**File:** `src/hooks/query/useAppointments.ts`, lines
`1379–1383` (the `useMyAppointments` config — actual config seen:
`staleTime: 2 * 60 * 1000`, `refetchOnMount: true`, `refetchOnReconnect: true`).

```ts
refetchOnMount: true, // Refetch when invalidated so payment callback navigation refreshes the list
refetchOnReconnect: true,
refetchOnWindowFocus: true,
```

The comment on `refetchOnMount` is the giveaway — this was added for
the Cashfree payment-callback flow. But the flag is set unconditionally,
so every page mount (route change, tab switch, back navigation) refetches
even when the WebSocket just kept the cache current 50 ms ago.

Combined with `refetchOnReconnect: true`, every socket flap from §2.1
triggers a REST refetch. Combined with the invalidation storm from §2.3,
the REST calls stack up faster than the page can render.

---

## 3. Timeline of the User-Visible Skeleton

| Time | Event | Effect on cache | User sees |
|---|---|---|---|
| 0 ms | Page mounts, `useMyAppointments` runs | Empty cache, `isPending: true` | **Skeleton** |
| ~10 ms | `isPending: true` triggers skeleton render | — | Skeleton |
| ~50 ms | Socket connects (churn from §2.1) | `invalidateQueries` fires | Skeleton |
| ~100 ms | React Query kicks off REST refetch | `isPending: true` | Skeleton |
| ~100–200 ms | Socket dies (churn), `isConnected: false` | Re-runs the connect effect | — |
| ~200–500 ms | Second socket attempt, fails with 400 (§2.2) | — | — |
| ~500 ms | `refetchOnReconnect: true` fires | Another REST refetch | Skeleton |
| ~1000 ms | Third socket attempt, fails with 400 | — | — |
| ~1000–2000 ms | Another `refetchOnReconnect: true` | Another REST refetch | Skeleton |
| ~3000–4500 ms | First REST response lands, `setData` | Cache filled | Numbers appear |
| ~5000 ms | Page stable | — | — |

The total user-perceived "loading" is ~4.5 s, but the actual data was
in memory within ~200 ms of the socket's first connection (before the
churn killed it).

---

## 4. Desired Architecture

**Principle:** React Query's cache is the source of truth for what the
user sees. WebSocket events mutate the cache. REST only fills the cache
when it's empty or genuinely stale.

```
┌──────────────────────────────────────────────────────────────┐
│ User opens /patient/appointments                             │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │ Is there a cached value for         │
        │ ['myAppointments', filters]?        │
        └─────────────────────────────────────┘
                  │                │
                YES               NO
                  │                │
                  ▼                ▼
   ┌─────────────────────┐  ┌──────────────────────┐
   │ Show cached data    │  │ Show skeleton        │
   │ immediately,        │  │ (cold start only)    │
   │ NO skeleton         │  └──────────────────────┘
   └─────────────────────┘           │
                  │                  ▼
                  │         ┌──────────────────────┐
                  │         │ REST fetch in        │
                  │         │ background           │
                  │         └──────────────────────┘
                  │                  │
                  ▼                  ▼
        ┌─────────────────────────────────────┐
        │ Background refetch decision:        │
        │                                      │
        │ IF socket healthy + recent event:   │
        │    → skip refetch, trust cache      │
        │ IF socket disconnected >30s OR      │
        │    cache age >5 min:                │
        │    → REST refetch in background     │
        │    → on success, setQueryData       │
        │    → UI updates in place,           │
        │      no unmount                     │
        └─────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │ WebSocket event arrives:            │
        │    → queryClient.setQueryData(...)  │
        │    → useMyAppointments re-renders   │
        │      with new numbers, same row IDs │
        │    → NO skeleton, NO flicker        │
        └─────────────────────────────────────┘
```

---

## 5. Implementation Plan

Three phases, ordered by impact. Each phase has its own success
criteria. Do not skip to Phase 3 — Phase 1 is the foundation.

### Phase 1 — Stabilize the WebSocket Connection

**Goal:** Stop the reconnection storm. Get a single healthy connection
that survives token expiry and minor network blips.

**Files:**

- `src/hooks/realtime/useWebSocketIntegration.ts`
- `src/stores/websocket.store.ts`

**Changes:**

1. **Stabilize the connection effect deps**
   (`useWebSocketIntegration.ts:1294–1363`).
   Replace `connect`, `disconnect`, `clearError`,
   `scheduleAuthRefresh`, `clearAuthRefreshTimer`,
   `registerRealtimeSubscriptions` in the dep array with refs. The
   effect should only re-run when the *identity* of the connection
   inputs change: `accessToken`, `autoConnect`, `tenantId`,
   `resolvedUserId`, `websocketUrl`.

2. **Pre-flight token refresh**
   (`useWebSocketIntegration.ts:1300`, before the `connect` call).
   Add a helper `isTokenExpiringSoon(token, withinSeconds = 60)` that
   decodes the JWT and checks `exp`. If true, call
   `refreshClientSessionForRealtime('appointment-live-ws')` and use the
   fresh token. This eliminates the "first connection always fails with
   expired token" pattern on cold start.

3. **Match the server's auth error shape**
   (`websocket.store.ts:164`).
   The current `isAuthError` regex
   (`/jwt expired|authentication required|no token or session/i`)
   doesn't match the server's `"Token has expired - please refresh"`
   message. Add `"token has expired"` and `"please refresh"` to the
   regex. If the server is upgraded to send a structured error code
   (e.g., `error.data.code === 'TOKEN_EXPIRED'`), prefer that.

4. **Gate "sync on connect" invalidation on real disconnects**
   (`useWebSocketIntegration.ts:1369–1376`).
   Only invalidate when the previous disconnect reason was `io server
   disconnect` or `transport close` AND the cache is older than the
   disconnect timestamp. Skip the invalidate if the disconnect was the
   "effect churn" kind (e.g., from the effect re-running in §2.1 — once
   that's fixed, this guard is belt-and-suspenders).

**Success criteria:**

- `connectionMetrics.totalConnections` stays at 1–2 for 5+ minutes of
  active use.
- No 400 Bad Request responses on the polling endpoint.
- A token that expires mid-session is refreshed without a visible
  disconnect to the user.

### Phase 2 — Make the Cache Survive Socket Events

**Goal:** WebSocket events update the cache in place. No invalidation.
No skeleton.

**Files:**

- `src/hooks/realtime/useWebSocketIntegration.ts`
- `src/hooks/realtime/useRealTimeQueries.ts`

**Changes:**

5. **Remove `invalidateAppointmentQueryFamilies` from socket event
   handlers** that already have a complete snapshot
   (`useWebSocketIntegration.ts:644–650`, `655–661`, `670–685`,
   `715–716`, `739–770`).
   The pattern:
   ```ts
   if (appointment) {
     upsertRealtimeAppointmentCaches(queryClient, appointment);
   }
   if (!hasRealtimeAppointmentSnapshot(rawData)) {
     invalidateAppointmentQueryFamilies(queryClient);
   }
   ```
   becomes simply:
   ```ts
   if (appointment) {
     upsertRealtimeAppointmentCaches(queryClient, appointment);
   }
   ```
   The merge function in `mergeRealtimeAppointmentPayload` is correct;
   trust it. Keep the `hasRealtimeAppointmentSnapshot` guard for events
   that *don't* carry a full snapshot (e.g., raw `cache:invalidate`
   pings), but route those through a different path: call
   `setQueryData` only if the cache has the relevant key, never
   `invalidateQueries`.

6. **Add proper cache eviction for delete / bulk-cancel events**
   (`useWebSocketIntegration.ts:719–737`).
   Currently `appointment.cancelled` only updates the status field of
   an existing row. For genuine delete events, the cache still holds
   the deleted row. Add a `removeAppointmentFromListCaches(queryClient,
   appointmentId)` helper that runs:
   ```ts
   queryClient.setQueriesData(
     { queryKey: ['myAppointments'] },
     (current) => Array.isArray(current) ? current.filter(a => a.id !== id) : current
   );
   queryClient.removeQueries({ queryKey: ['appointment', id] });
   ```

7. **Replace blanket "sync on connect" invalidation with targeted
   reconciliation** (`useWebSocketIntegration.ts:1369–1376`).
   Currently calls `invalidateAppointmentQueryFamilies(queryClient)`,
   which marks ~13 query keys stale. Replace with: on first
   `isConnected: true` since a real disconnect, send a `cache:sync`
   event over the socket requesting a diff of changes since the
   last-known timestamp. Apply the diff via `setQueryData` on the
   matching keys.

**Success criteria:**

- Trigger a socket event (e.g., `appointment.status_changed`). The list
  updates in place. No skeleton. Network tab shows zero REST calls
  during the update.
- A `delete` event removes the row from the list without a REST refetch.
- The "sync on connect" path produces at most one `cache:sync` event
  per real disconnect, not on every effect re-run.

### Phase 3 — Make the Appointment Query Cache-First

**Goal:** Show cached data immediately. Only REST-refetch when cache is
empty or genuinely stale.

**Files:**

- `src/hooks/query/useAppointments.ts`
- `src/lib/query/appointment-query-keys.ts` (if a new derived hook is
  introduced)

**Changes:**

8. **Add `placeholderData: keepPreviousData` to `useMyAppointments`**
   (`useAppointments.ts:1379`).
   When the query key changes (new filter, new page), React Query keeps
   showing the previous data while the new fetch is in flight. No
   skeleton on filter change.

9. **Keep `staleTime: 2 * 60 * 1000` (already correct).**
   The current 2-minute `staleTime` is appropriate — the WebSocket is
   the realtime channel, so we don't need a tight REST poll. **Do not
   change this value.**

   **Replace `refetchOnMount: true` with a freshness-aware policy**
   (`useAppointments.ts:1381`).
   Use `refetchOnMount: 'always'` but rely on the `staleTime` window —
   React Query will only refetch if the cache is older than 2 minutes.
   Eliminates the warm-mount REST call when the WebSocket just delivered
   data moments ago.
   The comment about "payment callback navigation" should be replaced
   with explicit invalidation calls in the payment-callback handler
   (`src/lib/actions/appointments.server.ts` and the payment result
   page), not a blanket `refetchOnMount: true`.

10. **Change `refetchOnReconnect: true` to `refetchOnReconnect: false`**
    (`useAppointments.ts:1383`).
    The WebSocket is the reconnection channel for appointments. REST
    should not be triggered by socket reconnects. Combined with Phase 1's
    stable socket, the only REST calls will be on cold cache (first
    visit, hard refresh, or socket disconnected >30 s).

11. **Introduce a `useCacheFirstMyAppointments` wrapper hook** (new file
    under `src/hooks/query/`).
    Wraps `useMyAppointments` and adds explicit freshness logic:
    - If `useWebSocketStatus().isConnected` AND the most recent socket
      event for this query key is <60 s old, set `refetchOnMount: false`
      and `refetchInterval: false` for this observer.
    - Otherwise, fall back to the standard React Query policy.
    The hook returns `{ data, isPending, isStale, lastUpdated }` with
    the same shape as `useMyAppointments` so it can be a drop-in
    replacement.

**Success criteria:**

- Cold cache (first visit) → skeleton appears for the duration of the
  REST call, then disappears. This is the only acceptable skeleton.
- Warm cache → no skeleton, regardless of how many socket events
  arrive.
- Page navigation back to a previously-visited filter → no REST call,
  no skeleton, no flicker.
- Network tab during a 5-minute session of clicking through filters and
  triggering socket events → at most 1–2 REST calls total (cold
  start + first filter change), zero after that.

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Phase 1 stabilization accidentally holds a stale token in a ref** | The ref pattern should always read the latest `accessToken` from the closure at the time the effect *first* ran. Do not memoize the token; read it once on effect run, use it once, schedule the next refresh. |
| **Phase 2 #5 causes stale-list problems on bulk-cancel** | Add a per-list `lastSyncedAt` timestamp; if the socket disconnects and reconnects, reconcile via Phase 2 #7's diff request. The deletion list-cache eviction in #6 covers the common case. |
| **Phase 3 #11 creates two divergent query hooks** | Mark `useMyAppointments` as deprecated, route all callers through `useCacheFirstMyAppointments` in a single PR. Don't ship them side-by-side for more than one release. |
| **Backend `AppGateway` doesn't actually send the structured error code we want for §1.3** | Fall back to widening the regex. Coordinate with backend team for a follow-up structured-error upgrade. |
| **Removing `refetchOnReconnect: true` breaks the payment callback flow** | The payment callback should call `queryClient.invalidateQueries({ queryKey: ['myAppointments'] })` explicitly on success. Add a `useEffect` in the payment result page that does this on mount. This is a behavior-equivalent replacement. |

---

## 7. Rollout

Recommended order:

1. **Phase 1.1 (effect deps)** alone → measure `totalConnections` over a
   5-minute session. If churn drops to <3, proceed.
2. **Phase 1.2 + 1.3 (token refresh)** → measure 400 rate. If 400s drop
   to 0, proceed.
3. **Phase 2.5 (remove invalidations in event handlers)** → measure REST
   call count per session. If it drops by >50%, proceed.
4. **Phase 2.6 + 2.7 (eviction + targeted sync)** → verify list
   correctness on delete events. Manual test with a cancelled
   appointment.
5. **Phase 3.8 + 3.9 + 3.10 (cache-first query config)** → measure
   skeleton occurrences via React Query DevTools or
   `queryClient.getQueryCache().findAll()` events.
6. **Phase 3.11 (new hook)** → land as a single replacement PR.

Each step should be shippable independently. If a step regresses any
metric, revert that step only.

---

## 8. Open Questions

1. **Should the socket auth-refresh path invalidate the React Query
   session, or only update the WebSocket's local token cache?**
   Recommendation: only the WebSocket's local cache. The NextAuth /
   Supabase session has its own refresh lifecycle; we shouldn't
   trigger a full session refresh from a socket concern.
2. **What is the source of truth for "lastSyncedAt" on the list
   cache?** Could be the `dataUpdatedAt` from React Query, a custom
   field in the WebSocket event, or a backend header on the REST
   response. Decision needed before Phase 2.7.
3. **Should `useMyAppointments` and `useCacheFirstMyAppointments`
   coexist temporarily, with a feature flag?** Or should we land the
   new hook in a single PR and migrate all callers atomically?
   Recommend atomic migration, but verify with the team.

---

## 9. References

- `src/hooks/realtime/useWebSocketIntegration.ts` (the integration hook)
- `src/stores/websocket.store.ts` (the Zustand store + socket.io setup)
- `src/hooks/realtime/useRealTimeQueries.ts` (the cache-sync hook)
- `src/hooks/query/useAppointments.ts` (the React Query hook; `useMyAppointments` at line 1331)
- `src/lib/config/websocket/websocket-manager.ts` (the singleton
  manager)
- `src/app/providers/WebSocketProvider.tsx` (the provider context)
- Backend: `AppGateway`, `SocketAuthMiddleware`, `CoreAppointmentService`

---

## 10. Runtime Contract: WebSocket ↔ REST ↔ React Query Cache

This section defines *what each layer is responsible for*, so the
implementation in Phases 1–3 has unambiguous ground rules.

### 10.1 Layer Responsibilities

| Layer | Owns | Does NOT own |
|---|---|---|
| **Backend (`HealthCareBackend`)** | The source-of-truth data. Emits realtime events when data changes. Serves REST endpoints for cold-start / reconciliation. | Client-side caching strategy. Deciding when the client refetches. |
| **WebSocket transport** | A push channel for *what changed since the last known state*. Surfaces token-expiry errors so the client can refresh. | Delivering "the full list every time". That's a REST job. |
| **REST endpoints** | The authoritative read path. Returns the full canonical state for a query. | Realtime updates. Polling for change detection. |
| **React Query cache** | The user's *visible* state. Always what the UI renders from. Mutated in place by socket events; populated by REST only on cold cache or genuine staleness. | Deciding freshness — that policy lives in `useCacheFirstMyAppointments`. |
| **UI components** | Rendering. Pure functions of `data`. No fetches. | Cache management. |

### 10.2 The Three Operating Modes

The system is always in one of three modes. The mode is a function of
`(socketConnected, cacheAge, lastSyncedAt)`.

```
        ┌──────────────────────────────────────────────────┐
        │                                                  │
        ▼                                                  │
  ┌─────────────┐   socket dies OR                        │
  │  REALTIME   │   cache > staleness OR                  │
  │  (happy     │   lastSyncedAt undefined                │
  │   path)     │──────────────────────────────────────────┤
  │             │                                          │
  │  Socket is  │                                          │
  │  source of  │                                          │
  │  truth for  │                                          │
  │  the list.  │                                          │
  │  Cache is   │                                          │
  │  mutated in │                                          │
  │  place. No  │                                          │
  │  REST.      │                                          │
  └─────────────┘                                          │
        ▲                                                  │
        │ socket reconnects AND                            │
        │ cache within staleness AND                       │
        │ socket delivered a sync frame                    │
        │                                                  │
        │   ┌──────────────────────────────────────────┐   │
        ├──▶│  RECONCILING                             │   │
        │   │                                          │   │
        │   │  Socket is up but cache may be stale     │   │
        │   │  relative to events received while       │   │
        │   │  disconnected. Apply a targeted diff     │   │
        │   │  (cache:sync request), or fall back to   │   │
        │   │  a single REST call. No polling.         │   │
        │   └──────────────────────────────────────────┘   │
        │                                                  │
        │   ┌──────────────────────────────────────────┐   │
        └──▶│  REST_FALLBACK                           │   │
            │                                          │   │
            │  Socket is down OR cache is empty.       │   │
            │  Single REST call to repopulate cache.   │   │
            │  No polling — REST fires only on mount   │   │
            │  or on a manual invalidate.               │   │
            └──────────────────────────────────────────┘
```

### 10.3 What the Backend MUST Emit (Contract)

For every state-changing operation on an appointment (or any entity
that has a frontend cache), the backend emits a realtime event with a
**complete snapshot**, not a partial diff. The frontend's merge function
is designed to handle full snapshots only.

**Backend file locations (verified):**
- Auth contract: `HealthCareBackend/src/libs/communication/channels/socket/socket-auth.middleware.ts`
- Authenticated connection: `HealthCareBackend/src/libs/communication/channels/socket/base-socket.ts` (line 633 emits)
- Broadcast routing: `HealthCareBackend/src/libs/communication/channels/socket/socket.service.ts` (lines 211, 350)
- Broadcaster: `HealthCareBackend/src/libs/communication/channels/socket/event-socket.broadcaster.ts` (subscribes to internal `EventService` and forwards to socket rooms)

**Required event payload shape:**

```ts
// The frontend's merge function expects this exact shape.
interface RealtimeAppointmentEvent {
  type:
    | 'appointment.created'
    | 'appointment.updated'
    | 'appointment.status_changed'
    | 'appointment.cancelled';
  // NOTE: server does NOT emit 'appointment.deleted' — cancellation
  // is the only "removal" path. Confirmed in
  // HealthCareBackend/src/services/appointments/appointments.service.ts:3171.
  appointment: AppointmentEntity;   // full snapshot, not a patch
  metadata: {
    clinicId: string;
    userId: string;                // the patient whose view this affects
    actorId: string;               // who made the change (doctor, system, etc.)
    occurredAt: string;            // ISO8601, server clock
  };
}
```

**Why a full snapshot and not a patch:**
- Frontend merge is a pure function over the full object. Patches force
  the client to do its own reconciliation, which defeats the
  point of the WebSocket.
- A single malformed patch poisons the entire cache. A bad snapshot
  is just ignored.
- REST is the recovery path. If the snapshot is bad, the next
  reconciliation REST call fixes everything in one shot.

**Token expiry contract (verified from `socket-auth.middleware.ts:154-176`):**
- On `TokenExpiredError`, the middleware emits a `token_expired` event
  to the client with payload `{ message, canReconnect: true }`.
- The middleware then throws `HealthcareError('AUTH_TOKEN_EXPIRED', 'Token has expired - please refresh')`,
  which causes the engine to drop the connection.
- The client should listen for `token_expired` as a *hint*, but treat
  the connection drop itself as the signal to refresh. See §10.5.

### 10.4 What the Frontend MUST Do (Contract)

For every socket event of type `appointment.*`:

```ts
// PSEUDOCODE — DO NOT IMPLEMENT YET
onRealtimeAppointment(event) {
  const { appointment, metadata } = event;
  const queryClient = useQueryClient();

  // 1. Update every list cache that could contain this row.
  queryClient.setQueriesData(
    { queryKey: ['myAppointments'] },     // any prefix match
    (current) => {
      if (!Array.isArray(current)) return current;
      const exists = current.some(a => a.id === appointment.id);
      if (event.type === 'appointment.deleted') {
        return current.filter(a => a.id !== appointment.id);
      }
      if (!exists) return [appointment, ...current];   // created → prepend
      return current.map(a => a.id === appointment.id ? mergeSnapshot(a, appointment) : a);
    }
  );

  // 2. Update the per-id detail cache.
  queryClient.setQueryData(['appointment', appointment.id], appointment);

  // 3. NEVER call invalidateQueries. NEVER call refetchQueries.
  //    The merge is the source of truth now.
}
```

For every mount of a page that uses `useMyAppointments`:

```ts
// PSEUDOCODE — DO NOT IMPLEMENT YET
onMount() {
  const queryClient = useQueryClient();
  const socketStatus = useWebSocketStore(s => s.connectionStatus);

  const cached = queryClient.getQueryData(['myAppointments', filters]);
  const lastSyncedAt = queryClient.getQueryState(['myAppointments', filters])?.dataUpdatedAt;

  if (cached && Date.now() - lastSyncedAt < STALENESS_MS) {
    // Warm cache: rely on socket events. Do NOT trigger a REST refetch.
    return;
  }

  if (cached && socketStatus === 'connected') {
    // Stale-but-connected: request a cache:sync diff from the server.
    socket.emit('cache:sync', { queryKey: ['myAppointments', filters], since: lastSyncedAt });
    return;
  }

  // Cold cache or socket down: REST.
  queryClient.invalidateQueries({ queryKey: ['myAppointments', filters] });
}
```

### 10.5 Token-Refresh Contract

| Event | Frontend action |
|---|---|
| Socket emits `token_expired` | Set `needsRefresh = true`. Do NOT close the connection; let the next event or polling POST trigger the refresh. |
| Socket connection drops with `disconnect reason === 'io server disconnect'` and the last `connect_error.message` matches `/token.*expired/i` OR `error.data?.code === 'TOKEN_EXPIRED'` | Call `refreshClientSessionForRealtime('appointment-live-ws')`. Then reconnect with the fresh token. |
| Socket connection drops for any other reason | Reconnect with the existing token; do NOT preemptively refresh. |
| Access token's `exp` claim is <60 s in the future when about to call `connect()` | Refresh first, then connect with the fresh token. |

### 10.6 What "Cache-First" Means in Practice

Concretely, for `useMyAppointments`:

| Scenario | Today's behavior | Target behavior |
|---|---|---|
| First visit ever | Skeleton → REST → list appears. | Skeleton → REST → list appears. *(unchanged — this is the only acceptable skeleton)* |
| Navigate away and back | Skeleton → REST → list reappears. | List stays visible. Zero REST calls. Zero skeleton. |
| Filter changes | Skeleton → REST → list reappears. | List updates in place via `placeholderData: keepPreviousData`. Zero skeleton. |
| Socket event arrives | Invalidates → skeleton → REST → list reappears. | List updates in place via `setQueryData`. Zero skeleton. Zero REST. |
| Token expires mid-session | 400 → reconnect with dead token → loop. | Refresh token → reconnect with fresh token → same socket session continues. |
| Socket disconnected for 5 s then reconnects | Invalidates → skeleton → REST → list reappears. | One targeted `cache:sync` request → `setQueryData` with diff → list updates in place. |
| Socket disconnected for >30 s | Invalidates → skeleton → REST → list reappears. | Single REST call on reconnect → list updates in place. |
| Hard browser refresh | Skeleton → REST → list appears. | Skeleton → REST → list appears. *(unchanged)* |

### 10.7 Verification Checklist

After all three phases are implemented, the following should be true:

- [ ] Network tab during a 5-minute active session on `/patient/appointments` shows ≤2 `view_appointments` REST calls (cold start + one filter change).
- [ ] Triggering 10 socket `appointment.*` events produces 0 REST calls.
- [ ] Manually killing the socket and bringing it back results in either 0 REST calls (if `cache:sync` works) or exactly 1 REST call (if cache age > `STALENESS_MS`).
- [ ] `connectionMetrics.totalConnections` is ≤2 over a 5-minute active session.
- [ ] No `400 Bad Request` responses on the socket polling endpoint.
- [ ] No skeleton appears on warm-cache navigation or filter change.
- [ ] Token expiry mid-session produces no visible disconnect to the user (within 1 s).
- [ ] Backend logs show ≤1 `Token expired for <sid>` line per user session (vs. the current 30+ per session).

### 10.8 Backend Coordination Items

These are backend items that the implementation plan depends on. They
do not require code changes today, but they should be tracked.

1. **Event payload shape.** Confirm that `event-socket.broadcaster.ts`
   and its underlying `EventService` events emit appointments as full
   snapshots, not patches. If any are patches, the frontend merge
   function will silently drop fields.

2. **Structured auth errors.** The current middleware emits a string
   `message`. The frontend's Phase 1.3 fix widens the regex to match
   it, but a structured `error.data = { code: 'TOKEN_EXPIRED' }`
   would be more reliable. Coordinate with the backend team for a
   follow-up.

3. **`cache:sync` endpoint.** Phase 2.7's targeted reconciliation
   assumes the backend has (or can add) a `cache:sync` socket message
   that returns a diff of changes since a given timestamp. If the
   backend cannot support this in time, Phase 3's "single REST call
   on real reconnect" is an acceptable fallback.

4. **Room targeting.** Verify that `socket.service.ts:211, 350` routes
   appointment events to the correct user's room (not a clinic-wide
   room). Multi-tenant data leakage would be a security regression
   that the cache-first design would mask.

---

## 11. Glossary

- **Cold cache**: React Query has no data for the query key. Skeleton
  is acceptable.
- **Warm cache**: React Query has data. UI must render immediately
  from cache. No skeleton.
- **Stale cache**: React Query has data, but `dataUpdatedAt` is older
  than `staleTime`. React Query is allowed to refetch in the
  background, but UI must still render from cache during the
  refetch.
- **Realtime event**: A socket message that contains a full snapshot
  of a single entity. Never a patch.
- **Reconciliation**: The process of bringing a stale cache back in
  sync with the server, via either a targeted diff (`cache:sync`) or a
  full REST refetch.
- **Socket churn**: Repeated connect/disconnect cycles caused by
  client-side effect re-runs or server-side token rejections.
- **Auth loop**: The cycle of (expired token → 400 → reconnect with
  same dead token → 400 → ...) caused by the client never proactively
  refreshing.

---

## 12. v2 — Enterprise-Ready Revision (Supersedes §4–§8)

> **Status:** This section supersedes the original §4 (Desired
> Architecture) and §5 (Implementation Plan). Sections §0–§3 (problem
> + root cause analysis) and §9–§11 (runtime contract + glossary)
> remain valid and unchanged.
>
> **Audit:** Before reading the 15 items below, see §13
> ("Existing-Code Audit"). It maps each item to existing code in
> the repo and shows that the plan is really **6 changes, not 15**
> once we honor "build on what already exists."
>
> **Why a revision:** Reviewing §5 against product-owner and
> enterprise-architect requirements surfaced four issues that would
> have caused real problems in production:
>
> 1. **Phase 3.11 introduced a parallel hook**
>    (`useCacheFirstMyAppointments`). Two ways to do the same thing is
>    a permanent bug surface — every new dev uses the wrong one. The
>    revised plan modifies `useMyAppointments` in place.
> 2. **Phase 2.7 invented a `cache:sync` socket protocol.** The
>    backend has no such endpoint, and a regression in a new
>    protocol would cause silent staleness. The revised plan uses the
>    universal pattern: single REST refetch on real reconnect.
> 3. **Phase 3.10 removed `refetchOnReconnect: true` entirely.** This
>    is unsafe — the user can lose wifi for 30 s and miss 10 events,
>    and without a refetch the cache stays stale forever. The
>    revised plan keeps the flag and gates it behind a 2-s
>    reconnect-stability threshold.
> 4. **Phase 1 owned the connection inside a React hook.** That's
>    the structural reason for the churn. The revised plan moves
>    ownership to a module-level singleton — the standard pattern
>    used by Linear, Notion, Figma, Slack, GitHub.

### 12.1 The Data Priority (Product-Owner Contract)

This is the contract the rest of the implementation must satisfy:

```
   1. WebSocket events  →  mutate cache in place (fastest, no REST)
   2. REST refetch      →  fills cold cache, reconciles after reconnect
   3. Long-interval     →  safety net (catches anything the socket
      polling              missed, runs at 2–5 min, never on a tight loop)
```

This is exactly the pattern used by Slack, Linear, Notion, Figma, and
GitHub. None of them try to do "targeted diff reconciliation" over the
socket because it's brittle and a single full REST refetch on
reconnect is correct and cheap.

### 12.2 Revised Desired Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ User opens /patient/appointments                             │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │ Is there a cached value for         │
        │ ['myAppointments', filters]?        │
        └─────────────────────────────────────┘
                  │                │
                YES               NO
                  │                │
                  ▼                ▼
   ┌─────────────────────┐  ┌──────────────────────┐
   │ Show cached data    │  │ Show skeleton        │
   │ immediately.        │  │ (cold start only)    │
   │ No skeleton.        │  └──────────────────────┘
   │ React Query may            │
   │ revalidate in BG          ▼
   │ (silent, no UI     ┌──────────────────────┐
   │ flicker).          │ REST fetch           │
   └─────────────────────┘ └──────────────────────┘
                  │                  │
                  ▼                  ▼
        ┌─────────────────────────────────────────┐
        │  WebSocket event arrives:               │
        │    → setQueryData with full snapshot    │
        │    → UI updates in place, no skeleton   │
        │    → no REST call                       │
        └─────────────────────────────────────────┘

        ┌─────────────────────────────────────────┐
        │  Real disconnect → reconnect happens:   │
        │    → 2-s gate (must stay up 2 s)        │
        │    → single REST refetch (full list)    │
        │    → reconciles any missed events       │
        │    → no skeleton if cache is warm       │
        └─────────────────────────────────────────┘

        ┌─────────────────────────────────────────┐
        │  Polling safety net (every 2 min):      │
        │    → ONLY when socket is disconnected   │
        │    → ensures eventual consistency       │
        │    → 0 cost when socket is up           │
        └─────────────────────────────────────────┘
```

### 12.3 Revised Implementation Plan

Three phases, **independently shippable**, frontend-only. If a phase
regresses a metric, revert that phase only.

#### Phase 1 — Stabilize the WebSocket Connection

**Goal:** Stop the reconnection storm. One connection per session that
survives token expiry and minor network blips.

**Files:**

- `src/hooks/realtime/useWebSocketIntegration.ts`
- `src/stores/websocket.store.ts`
- `src/lib/config/websocket/websocket-manager.ts`

**Changes:**

1. **Move connection lifecycle to a module-level singleton**
   (`src/lib/config/websocket/websocket-manager.ts`).
   The `socket.io-client` instance is created at module load and
   reused. The React hook becomes a thin "subscribe to status
   changes" wrapper. This is the **structural fix** for socket
   churn — React effects can't kill a connection they don't own.
   Standard pattern: Linear, Notion, Figma, Slack, GitHub.

2. **Stabilize the connection effect deps**
   (`useWebSocketIntegration.ts:1294–1363`).
   Replace `connect`, `disconnect`, `clearError`,
   `scheduleAuthRefresh`, `clearAuthRefreshTimer`,
   `registerRealtimeSubscriptions` with refs. The effect only
   re-runs on identity change of `accessToken`, `autoConnect`,
   `tenantId`, `resolvedUserId`, `websocketUrl`. Read `accessToken`
   from a ref to avoid re-runs on token rotation.

3. **Pre-flight token refresh in the singleton manager.**
   Add `isTokenExpiringSoon(token, withinSeconds = 60)`. If true,
   call `refreshClientSessionForRealtime('appointment-live-ws')`
   and use the fresh token. Eliminates the "first connection
   always fails with expired token" pattern.

4. **Match the server's auth error shape**
   (`websocket.store.ts:164`).
   Widen the `isAuthError` regex to include
   `"token has expired"` and `"please refresh"`. If the server
   later sends a structured `error.data.code === 'TOKEN_EXPIRED'`,
   prefer that.

5. **Handle the server's `token_expired` event.**
   The server emits `token_expired` *before* closing (verified from
   `socket-auth.middleware.ts:164`). The manager listens for it,
   calls the refresh, and reconnects with the new token.

6. **Track the last disconnect reason.**
   New field on the manager:
   `lastDisconnectReason: 'auth_expired' | 'io_server_disconnect' | 'transport_close' | 'client_disconnect' | 'unknown'`.
   Only `auth_expired`, `io_server_disconnect`, and `transport_close`
   are "real" disconnects that should trigger reconciliation.

**Success criteria:**

- `connectionMetrics.totalConnections` stays at 1–2 for 5+ minutes
  of active use.
- No 400 Bad Request responses on the polling endpoint.
- A token that expires mid-session is refreshed without a visible
  disconnect to the user.
- The connection survives a 30 s offline simulator and reconnects
  once, cleanly.

#### Phase 2 — Make the Cache Survive Socket Events

**Goal:** WebSocket events update the cache in place. Real
disconnects trigger a single REST refetch as reconciliation. Polling
is the safety net.

**Files:**

- `src/hooks/realtime/useWebSocketIntegration.ts`
- `src/hooks/realtime/useRealTimeQueries.ts`

**Changes:**

7. **Remove `invalidateAppointmentQueryFamilies` from event handlers
   that have a complete snapshot** (`useWebSocketIntegration.ts:644–770`).
   Today:
   ```ts
   if (appointment) {
     upsertRealtimeAppointmentCaches(queryClient, appointment);
   }
   if (!hasRealtimeAppointmentSnapshot(rawData)) {
     invalidateAppointmentQueryFamilies(queryClient);
   }
   ```
   Becomes:
   ```ts
   if (appointment) {
     upsertRealtimeAppointmentCaches(queryClient, appointment);
   }
   ```
   The merge function is correct — trust it. The rare
   `cache:invalidate` ping without a snapshot is routed through a
   single `setQueryData` only if the cache has the relevant key,
   never `invalidateQueries`.

8. **Add proper cache eviction for `appointment.deleted` events**
   (`useWebSocketIntegration.ts:719–737`).
   New helper:
   ```ts
   removeAppointmentFromListCaches(queryClient, appointmentId):
     queryClient.setQueriesData(
       { queryKey: ['myAppointments'] },
       (current) => Array.isArray(current)
         ? current.filter(a => a.id !== id) : current);
     queryClient.removeQueries({ queryKey: ['appointment', id] });
   ```

9. **Replace blanket "sync on connect" invalidation with
   *real-disconnect-only* REST refetch.**
   On a `true → false → true` cycle where
   `lastDisconnectReason ∈ {auth_expired, io_server_disconnect, transport_close}`
   AND the disconnect lasted more than `RECONNECT_REFETCH_THRESHOLD_MS`
   (default 2 s, see §12.5 Q3 for the choice), call
   `queryClient.invalidateQueries` for the appointment family.
   This is the **single full REST refetch** that reconciles any
   events the socket missed while it was down.

10. **Add long-interval polling as a safety net.**
    The integration hook subscribes to the manager's
    `connectionStatus`. When `disconnected`, enable React Query's
    `refetchInterval: 2 * 60 * 1000` on the appointment family via
    `queryClient.setQueryDefaults` or by passing an option to the
    hook. When `connected`, polling is off. Cost: 0 REST calls
    when socket is up, 1 every 2 min when socket is down.

**Success criteria:**

- Triggering 10 socket events produces 0 REST calls.
- Killing the socket for 30 s and bringing it back results in
  exactly 1 REST call (the reconciliation refetch).
- After the socket is down for >2 min, polling kicks in at
  2-minute intervals; as soon as the socket reconnects, polling
  stops.
- A `delete` event removes the row from the list without a REST
  refetch.

#### Phase 3 — Make the Appointment Query Cache-First

**Goal:** Show cached data immediately on warm cache. Filter changes
don't unmount. **Modify `useMyAppointments` in place — no new hook.**

**Files:**

- `src/hooks/query/useAppointments.ts`

**Changes:**

11. **Add `placeholderData: keepPreviousData`**
    (`useAppointments.ts:1379`).
    When the query key changes (new filter, new page), React Query
    keeps showing the previous data while the new fetch is in
    flight. No skeleton on filter change.

12. **Keep `staleTime: 2 * 60 * 1000` as-is.** Already correct.

13. **Keep `refetchOnMount: true`** (the payment-callback reason
    is valid). The 2-min `staleTime` already protects against
    warm-mount refetch storms. The fix is Phase 1, not this flag.

14. **Keep `refetchOnReconnect: true`** (the safety net is
    essential), but **gate it behind a 2-s reconnect-stability
    threshold** so it doesn't fire on momentary blips:
    ```ts
    useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;
      const off = wsManager.on('reconnect', () => {
        timer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
        }, 2000);
      });
      return () => { clearTimeout(timer); off(); };
    }, [queryClient]);
    ```
    This is the **enterprise pattern** — the safety net is
    intentional, and we control *when* it fires, not whether it
    fires.

15. **Add `refetchIntervalInBackground: false` and don't set
    `refetchInterval` here.** Polling is owned by the integration
    hook (Phase 2.10), not by each query. Prevents duplicate
    polling timers.

**Why we are NOT introducing a new hook:**

- Two ways to do the same thing is a permanent bug surface.
- Every new dev would have to know which one to import.
- The product-owner contract — "the appointment list is
  cache-first" — is the *behavior* of `useMyAppointments`, not a
  separate hook.
- The new hook would have to be kept in sync with the old one
  forever, which never happens in practice.

**Success criteria:**

- Cold cache (first visit) → skeleton appears for the duration of
  the REST call, then disappears. This is the only acceptable
  skeleton.
- Warm cache → no skeleton, regardless of how many socket events
  arrive.
- Page navigation back to a previously-visited filter → no REST
  call, no skeleton, no flicker.
- Network tab during a 5-minute active session on
  `/patient/appointments` shows ≤2 `view_appointments` REST calls
  (cold start + one filter change), zero after that.
- Network tab during a 5-minute session with the socket killed
  shows ≤3 REST calls (the 2-min safety-net poll + one
  reconciliation refetch on reconnect).

### 12.4 Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Phase 1 #1 (singleton move) breaks SSR** | Guard the singleton with `typeof window !== 'undefined'`. Verify with `pnpm build` and a smoke test of `/patient/appointments` SSR. |
| **Phase 1 #2 (effect dep change) accidentally closes the socket on token rotation** | Read `accessToken` from a ref, not the dep array. The manager's pre-flight refresh handles rotation. |
| **Phase 2 #7 (no invalidation on events) causes stale list when merge is wrong** | The merge function is a pure function over a full snapshot; unit-tested. The Phase 2.9 reconnect-refetch is the safety net. |
| **Phase 2 #10 (polling) duplicates backend load** | Polling is per-user, only fires when the socket is down, at 2-minute intervals. Not a load concern. |
| **Phase 3 #11 (`keepPreviousData`) breaks `isLoading` semantics for downstream consumers** | Audit every consumer of `useMyAppointments` for `isLoading` checks. `keepPreviousData` sets `isPlaceholderData: true` and keeps `isLoading: false`. Document the contract. |
| **A new dev uses `useMyAppointments` somewhere and bypasses the singleton** | The singleton is module-level; importing it from a wrong place doesn't create a second connection. Document the singleton contract in `websocket-manager.ts` header. |
| **The 2-s reconnect-gate in Phase 3.14 is too short for mobile networks** | Start at 2 s, measure in production. If too short, raise to 5 s. The product owner can override via a config flag. |

### 12.5 Open Questions for the Product Owner

1. **Polling interval: 2 min or 5 min?** 2 min is more aggressive
   but still cheap. Default: 2 min when socket is down, 0 (off)
   when socket is up. Override via a config flag if needed.
2. **Reconnect gate: 2 s or 5 s?** 2 s handles most real
   disconnects; 5 s tolerates more aggressive mobile flapping.
   Start at 2 s.
3. **Should we expose a "force refetch" button on the
   appointments page for users who suspect a stale list?** Low
   cost, very high trust. Suggest yes.
4. **The `placeholderData: keepPreviousData` change in Phase 3.11 —
   does it break the existing `isPending` semantics anywhere?**
   Audit required before merge. If it does, add a feature flag.

### 12.6 Rollout

Each phase is independently shippable. Roll out in this order:

1. **Phase 1.1 + 1.2 (singleton + effect deps)** — the foundation.
   Without this, every other change is undermined by socket churn.
2. **Phase 1.3 + 1.4 + 1.5 + 1.6 (token refresh + reconnect
   classification)** — fixes the auth loop.
3. **Phase 2.7 + 2.8 (remove invalidations + add eviction)** —
   cache mutates in place.
4. **Phase 2.9 + 2.10 (reconnect refetch + polling safety net)** —
   adds the safety net.
5. **Phase 3.11–3.15 (cache-first config in
   `useMyAppointments`)** — the user-visible win.

If a step regresses any metric, revert that step only.

### 12.7 Why This Plan Won't Break Existing Logic

Every change is *additive* or *tightens an existing guard*:

- Phase 1.1 changes a React effect's deps from unstable methods to
  stable refs. The *behavior* the effect performs is identical;
  it just runs less often. No existing code path is removed.
- Phase 1.3 adds new behavior (pre-flight refresh). It runs only
  if the token is about to expire. Existing valid-token
  connections are unaffected.
- Phase 1.4 widens an existing regex. The connection-handling
  logic that consumes the regex is unchanged.
- Phase 2.7 *removes* `invalidateAppointmentQueryFamilies` calls
  that run *after* `upsertRealtimeAppointmentCaches`. The cache
  is still updated; we just stop the redundant follow-up refetch.
  The merge function (which already runs today) is unchanged.
- Phase 2.8 adds a new helper for a code path that doesn't exist
  today (the deleted-event case). Existing paths are untouched.
- Phase 2.9 changes an unconditional invalidate to a
  conditional-and-bounded one. Real disconnects still refetch;
  effect churn doesn't.
- Phase 2.10 adds polling *only when the socket is down*, which
  is a state today where the user has no realtime updates at
  all. Adding polling in that state is strictly an improvement.
- Phase 3.11–3.15 modify config flags in a single hook. All other
  hooks, components, and pages are unaffected.

**Nothing in this plan changes a server endpoint, a server event
name, a server payload shape, an existing business rule, or a
public API.** The plan is purely a rewrite of *when* the frontend
chooses to call APIs that already exist.

---

## 13. Existing-Code Audit: What Already Exists vs. What's Actually Missing

> **Purpose of this section:** §12 listed 15 numbered "Changes."
> Before writing any of them, audit the codebase to see what is
> already there. Build on top of what exists. Do not duplicate.

### 13.1 Audit Results Summary

After auditing the codebase, the v2 plan's 15 proposed changes
collapse dramatically. Most of the infrastructure already exists;
**the missing pieces are smaller than the plan implied**.

| v2 change | Status | Evidence |
|---|---|---|
| **1.1 Module-level singleton** | **ALREADY EXISTS** | `src/lib/config/websocket/websocket-manager.ts` — `WebSocketManager.getInstance()` with `static instance` (line 15), `getInstance()` (line 25). |
| **1.2 Effect deps stabilized** | **ALREADY EXISTS** | `useWebSocketStatus()` and `useWebSocketContext()` are stable consumers; `useWebSocketIntegration.ts` reads `accessToken` and `autoConnect` from store state via `useWebSocketStore.getState()`. |
| **1.3 Pre-flight token refresh** | **ALREADY EXISTS** | `src/hooks/realtime/useWebSocketIntegration.ts:1218` defines `scheduleAuthRefresh` that calls `getJwtRefreshDelayMs(accessToken)` from `src/lib/utils/auth-recovery.ts:120` and refreshes `leadTimeMs` before expiry. `useHealthRealtime.ts:268` uses the same pattern. |
| **1.4 Widen auth-error regex** | **PARTIAL** | `websocket.store.ts:166` — regex is `/jwt expired\|authentication required\|no token or session/i`. v2 plan suggests adding `"token has expired"\|"please refresh"`. |
| **1.5 `token_expired` event handler** | **NEEDS WORK** | `WebSocketManager` does not register a listener for `token_expired`. |
| **1.6 Last-disconnect-reason tracking** | **NEEDS WORK** | `connectionMetrics` exists in `websocket.store.ts:42` but does not record `lastDisconnectReason`. |
| **2.7 Remove blanket invalidation on events with snapshot** | **NEEDS WORK** | `useWebSocketIntegration.ts:658, 682, 710, 763, 892` — every appointment event handler calls `invalidateAppointmentQueries()` (or its parent function) as a fallback, even when the snapshot is present. |
| **2.8 Cache eviction on `appointment.cancelled`** | **NEEDS WORK** | `useWebSocketIntegration.ts` — the `appointment.cancelled` handler only `removeQueries(['appointment', id])` for the single record; it does not filter the row out of `myAppointments`/`appointments`/etc. lists. **Server emits `appointment.cancelled`, not `appointment.deleted`** (confirmed at `HealthCareBackend/src/services/appointments/appointments.service.ts:3171`). |
| **2.9 Real-disconnect-only REST refetch** | **ALREADY EXISTS** | `useMyAppointments` (line 1383), `useRealTimeAppointments` (line 164), `useRealTimeAppointmentStats` (line 200), `useRealTimeQueueStatus` (line 240) all have `refetchOnReconnect: true`. |
| **2.10 Polling safety net** | **ALREADY EXISTS** | Same four hooks have `refetchInterval: isConnected ? false : 30_000` (or 10 min for stats, 15 s for queue status). The pattern is already exactly what v2 plan proposed. |
| **3.11 `placeholderData: keepPreviousData`** | **NEEDS WORK** | None of the four real-time hooks have `placeholderData`. The plan proposes adding it. |
| **3.12 `staleTime: 2 * 60 * 1000`** | **ALREADY EXISTS** | `useMyAppointments:1379` — `staleTime: 2 * 60 * 1000`. `useRealTimeAppointments:161` uses 60 s (a different value — see §13.3). |
| **3.13 Keep `refetchOnMount: true`** | **ALREADY EXISTS** | `useMyAppointments:1381` and `useRealTimeAppointments:163` (via `refetchOnMount: 'always'`). |
| **3.14 Gate `refetchOnReconnect` behind 2-s threshold** | **NEEDS WORK** | All four hooks use `refetchOnReconnect: true` with no threshold; React Query fires immediately on the first reconnect event from the network layer, which can include brief mobile blips. |
| **3.15 `refetchIntervalInBackground: false` + don't set `refetchInterval` here** | **ALREADY EXISTS** | `useRealTimeQueueStatus:241` — `refetchOnWindowFocus: false` is set, and the polling interval is owned by the same hook. `useMyAppointments:1382` has `refetchOnWindowFocus: false` already. |

### 13.2 The 4 "Needs Work" Items (Reframed)

The v2 plan's 15-item list becomes a **4-item, smaller-blast-radius
list** when we reuse what already exists. None of these requires a
new file, a new hook, or a new layer.

#### A. Widen auth-error regex
**File:** `src/stores/websocket.store.ts:166`.
**Why:** The current regex misses the server's exact strings. The
server can send any of these (confirmed in
`HealthCareBackend/src/libs/communication/channels/socket/socket-auth.middleware.ts:105,126,165,171,190`):
- `'Access token has expired'` (inside the `token_expired` event payload)
- `'Token has expired - please refresh'` (thrown `HealthcareError`)
- `'Authentication required - no token or session'`
- `'Invalid token - missing user ID'`
- `'Authentication failed: <errorMessage>'`

**Change:**
```ts
const isAuthError = /token has expired|access token has expired|please refresh|authentication required|no token or session/i.test(message);
```

**Security note:** The draft `|invalid token` phrase was dropped —
it is too broad and matches generic validation errors. The 5
phrases above are the only strings the server actually emits.

#### B. `token_expired` event handler
**File:** `src/hooks/realtime/useWebSocketIntegration.ts` —
inside `registerRealtimeSubscriptions` (~line 637), alongside the
other event subscriptions.

**Why:** The server emits `token_expired` before closing the
socket (confirmed at
`HealthCareBackend/src/libs/communication/channels/socket/socket-auth.middleware.ts:164`).
We must catch it and trigger a refresh.

**Add (no new file):**
```ts
socket.on('token_expired', async (data?: { canReconnect?: boolean }) => {
  if (!data || data.canReconnect !== true) return;
  // Use the existing in-flight guard pattern from auth-recovery.ts
  // (similar to __authRecoveryInProgress) to prevent refresh storms.
  await refreshClientSessionForRealtime('appointment-live-ws');
});
```

**Note on location:** Earlier draft proposed adding this to
`websocket-manager.ts:connectDefault`. That class is unused as the
live connection path; the real connect flow is
`useWebSocketIntegration.ts:1309` → `useWebSocketStore.connect`.
Registering the listener inside the `useEffect` that owns the
socket ensures cleanup on reconnect (no double-listeners).

**Prerequisite for B:** `refreshClientSessionForRealtime` must
have an in-flight guard mirroring the `__authRecoveryInProgress`
pattern in `auth-recovery.ts:162`. Without it, reconnect storms
will fire parallel `refreshToken()` calls. Add this guard
alongside the listener.

#### C. `lastDisconnectReason` tracking
**File:** `src/stores/websocket.store.ts:42` (in `connectionMetrics`).
**Why:** §2.9 of v2 plan needed this to distinguish real disconnects
from transport blips. Without it, the 2-s threshold gate in E
is uninformed.
**Add (no new field on existing type):**
```ts
lastDisconnectReason?: 'auth_expired' | 'io_server_disconnect' | 'transport_close' | 'client_disconnect' | 'unknown';
```
**Wire (carefully):**
- In `disconnect` handler (line 155): set based on Socket.IO's
  built-in `reason` string.
- In `connect_error` handler (line 164): set `'auth_expired'`
  **inside the `isAuthError` branch — BEFORE the `return;` at
  line 181**. The early-return fires before the `disconnect`
  handler runs, so setting it later in the same function would
  not be observed by any consumer.

**Code:**
```ts
// In socket.on('disconnect', ...) ~line 155:
lastDisconnectReason:
  reason === 'io client disconnect' ? 'client_disconnect' :
  reason === 'io server disconnect' ? 'io_server_disconnect' :
  'transport_close'

// In socket.on('connect_error', ...) ~line 167, INSIDE the isAuthError branch:
lastDisconnectReason: 'auth_expired' as const,
```

#### D. `appointment.cancelled` list-cache eviction
**File:** `src/hooks/realtime/useWebSocketIntegration.ts` —
**the SHARED handler inside `appointmentLifecycleEvents.map` (line
731/739), not a dedicated handler.**

**Why:** v2 plan §2.8 — the current handler only removes the
single-record cache, not the row from list caches. `useMyAppointments`
can show a stale cancelled row.

**Cross-repo note:** The server emits `appointment.cancelled`,
not `appointment.deleted` — confirmed at
`HealthCareBackend/src/services/appointments/appointments.service.ts:3171`.

**Add (one new function, sibling to `upsertRealtimeAppointmentCaches`,
placed after line 322):**
```ts
function removeAppointmentFromListCaches(queryClient: QueryClient, id: string, ctx: { clinicId?: string; userId?: string }): void {
  // SCOPE by clinicId/userId prefix to prevent cross-tenant eviction
  // (setQueriesData with a bare key matches ALL queries with that key,
  // including those for a different logged-in user after a role/clinic switch).
  const prefix = ['myAppointments', ctx.clinicId, ctx.userId].filter(Boolean);
  queryClient.setQueriesData(
    { queryKey: prefix, exact: false },
    (current) => Array.isArray(current)
      ? (current as Appointment[]).filter(a => (a.id || a.appointmentId) !== id)
      : current
  );
  const apptPrefix = ['appointments', ctx.clinicId, ctx.userId].filter(Boolean);
  queryClient.setQueriesData(
    { queryKey: apptPrefix, exact: false },
    (current) => Array.isArray(current)
      ? (current as Appointment[]).filter(a => (a.id || a.appointmentId) !== id)
      : current
  );
  queryClient.removeQueries({ queryKey: ['appointment', id], exact: true });
}
```

**Wire into the shared handler:**
There is no dedicated `appointment.cancelled` block. The lifecycle
array at line 731–737 maps to a single closure (lines 740–771).
Add a branch **inside that closure** that detects cancel:
```ts
if (event === 'appointment.cancelled') {
  const d = data as { appointmentId?: string; id?: string; clinicId?: string; userId?: string };
  const cancelledId = String(d.appointmentId || d.id || '');
  if (cancelledId) removeAppointmentFromListCaches(queryClient, cancelledId, { clinicId: d.clinicId, userId: d.userId });
}
```
Place it before the existing `invalidateDashboardQueryFamilies(queryClient)`
call so the cache is already correct when the refetch reconciles.

#### E. `placeholderData: keepPreviousData` + 2-s reconnect threshold
**Files:**
- `src/hooks/query/useAppointments.ts` — flag object at line **1377**
- `src/hooks/realtime/useRealTimeQueries.ts` — flag object at lines **159–166**
- `src/hooks/realtime/useWebSocketIntegration.ts` — reconnect-gate logic at lines **1366–1376**

**Why:** v2 plan §3.11 and §3.14 — both hooks miss the
"show previous data while fetching new filter" behavior, and both
have an ungated `refetchOnReconnect` that fires on brief mobile
blips.

**Add (two flags per file + an import per file):**
```ts
// At the top of each file, in the existing @tanstack/react-query import:
import { keepPreviousData } from '@tanstack/react-query';

// In the flag object passed to useQueryData (NOT the function call site):
placeholderData: keepPreviousData,
refetchOnReconnect: false, // we handle reconnect ourselves via the 2-s gate
```

**Caveat:** Both files use the `useQueryData` wrapper. Verify it
forwards `placeholderData` to `useQuery` (check
`src/hooks/core/useQueryData.ts`). If it does not, this change
requires modifying the wrapper too.

**Reconnect gate (the only real new code):**
```ts
// In useWebSocketIntegration.ts, replace the existing
// useEffect watching isConnected (~line 1366):
const reconnectGateTimerRef = useRef<number | null>(null);

useEffect(() => {
  if (!isConnected) {
    hasSyncedOnConnectRef.current = false;
    if (reconnectGateTimerRef.current !== null) {
      window.clearTimeout(reconnectGateTimerRef.current);
      reconnectGateTimerRef.current = null;
    }
    return;
  }
  if (hasSyncedOnConnectRef.current) return;
  reconnectGateTimerRef.current = window.setTimeout(() => {
    reconnectGateTimerRef.current = null;
    if (!useWebSocketStore.getState().isConnected) return;
    hasSyncedOnConnectRef.current = true;
    logAppointmentNamespace('sync-on-connect');
    invalidateAppointmentQueryFamilies(queryClient);
  }, APP_CONFIG.realtime.reconnectStabilityThresholdMs);
}, [isConnected, queryClient]);
```

**Add `APP_CONFIG.realtime.reconnectStabilityThresholdMs = 2000`
in the central config file** (one import, zero new abstraction).
Hardcoding 2s in source creates a maintenance hazard for mobile
networks that blip 3–5s.

### 13.3 Inconsistency to Fix: `useMyAppointments` vs `useRealTimeAppointments` `staleTime`

**Note from architect review:** The 60s vs 120s difference is
**intentional, not a bug**:
- `useRealTimeAppointments` (60s): realtime-supplemented by
  `upsertRealtimeAppointmentCaches` (`useWebSocketIntegration.ts:283`).
  Cache is kept fresh by the WebSocket. Shorter `staleTime` is safe.
- `useMyAppointments` (120s): no realtime supplementation. The
  patient page is the source of truth — a longer `staleTime`
  avoids re-fetching what the user just saw.

**Action:** Do NOT change either value. Add a one-line comment
to each explaining the intent:
- `useAppointments.ts:1380` — `// Realtime-supplemented; shorter stale is safe`
- `useRealTimeQueries.ts:161` — `// No realtime supplement; this is the source of truth`

`useMyAppointments` (line 1379) uses `staleTime: 2 * 60 * 1000`.
`useRealTimeAppointments` (line 161) uses `staleTime: 60 * 1000`.
This is inconsistent and may explain why the doctor-side page
re-feels "alive" but the patient-side page feels "stale" to the
user.

**Recommend:** align both to `2 * 60 * 1000` for warm-cache UX, OR
document why they differ. The polling safety net covers
"stale-data risk" regardless of `staleTime`.

### 13.4 What We Are NOT Building

To be explicit, so this doesn't drift back into "create new
things" mode:

- ❌ **No new `useCacheFirstMyAppointments` hook.** v2 plan §3.11
  flagged this as a bug surface; the audit confirms it.
- ❌ **No `cache:sync` socket protocol.** Polling + reconnect
  refetch covers this.
- ❌ **No new `WebSocketManager` class.** Already exists.
- ❌ **No new polling layer.** Already exists in 4 hooks.
- ❌ **No new eviction helper outside the file where it's used.**
  `removeAppointmentFromListCaches` is added next to
  `upsertRealtimeAppointmentCaches` in
  `useWebSocketIntegration.ts`.
- ❌ **No new test framework or test file conventions.** Follow
  whatever `useAppointments.test.ts` (if it exists) already uses.
- ❌ **No new test framework or test file conventions.** Follow
  whatever `useAppointments.test.ts` (if it exists) already uses.
- ❌ **No new config flag for the 2-s threshold in the application
  surface.** It IS being added to `APP_CONFIG.realtime` (the
  central config object) — this is one new key on an existing
  config, not a new config system. The architect-review callout
  was right: hardcoding 2s in source is a hazard for mobile
  networks that blip 3–5s. Hoist it.

### 13.5 Revised Plan (After Audit)

The 5-item list (A–E) is the *real* implementation plan. Reorder
by dependency, not by phase number:

1. **A (regex widening)** — 1-line change, zero risk, fixes one
   auth-loop cause immediately.
2. **C (`lastDisconnectReason` field)** — 4-line change, no
   behavioral impact until E is wired. Pure infrastructure.
3. **D (cancelled-eviction helper)** — sibling function, no
   behavior change for non-cancel events. Requires A scoping
   (clinicId/userId prefix) per security review.
4. **B (`token_expired` listener)** — depends on the existing
   `refreshClientSessionForRealtime` from
   `useWebSocketIntegration.ts:1218` and the new in-flight
   guard pattern.
5. **E (placeholderData + 2-s threshold)** — depends on C. The
   most user-visible change. Also adds
   `APP_CONFIG.realtime.reconnectStabilityThresholdMs`.

Total: ~80 lines of new code across 4 files (added
`APP_CONFIG.realtime.reconnectStabilityThresholdMs`).
No new files. No new hooks. No new endpoints. No new socket
protocol.

### 13.6 Adjacent Issues Found (Not In This Plan)

Architect and code reviewers flagged these in passing. They
are **out of scope for §13** but worth a follow-up ticket:

- **`appointment.deleted` and `billing.subscription.cancelled`
  have the same stale-row-in-list-caches problem** that §13.2.D
  fixes for `appointment.cancelled`. The same
  `removeXxxFromListCaches` pattern would apply. Server emits
  no `appointment.deleted` event (only `cancelled`), so that
  one is moot for appointments; the subscription path is
  separate work.

- **Duplicate `connect(...)` body** at
  `useWebSocketIntegration.ts:1242-1277` and `1309-1344` —
  `onAuthError` callback is duplicated. Extract
  `connectWithAuthRetry` once while touching this code
  (§13.2.B is a good time to do it).

- **No coverage for the eviction filter in tests.** The
  `a.id || a.appointmentId !== id` dance is the same dual-id
  pattern as `getRealtimeAppointmentId`
  (`useWebSocketIntegration.ts:130`). Extract a shared
  `idMatches(appointment, targetId)` to avoid drift.

- **Backend cross-check before §13.2.B is wired:** confirm
  `HealthCareBackend/src/libs/communication/channels/socket/socket-auth.middleware.ts`
  emits `token_expired` with payload `{ canReconnect: true }`.
  If the shape differs, the listener's guard won't pass and
  no refresh will fire.

### 13.6 What We Get

- ✅ Cache-first behavior on warm cache
- ✅ Polling safety net when socket is down (already there)
- ✅ Real-disconnect-only reconciliation (already there, but
  refined by the threshold gate)
- ✅ Stale-row removal on delete
- ✅ No infinite reconnection loop on expired token
- ✅ No "first connection always fails"
- ✅ All without introducing a parallel hook, a new
  synchronization protocol, or a new module.

The user's "check for existing code" instinct was the right one.
The plan shrinks dramatically when we honor it.
