/**
 * Server-side log filter for deployment skew.
 *
 * After a deploy, browser tabs still running the previous build keep calling server actions by
 * IDs the new server doesn't have. Next.js logs each call with `console.warn(error)`, which
 * prints a multi-line "Error: Failed to find Server Action ..." stack trace. Log viewers that
 * classify lines by text (Temps does) show it as an ERROR, and one tab polling every 30 s floods
 * the runtime logs with entries that need no action: the client reloads itself (see
 * `src/lib/utils/deployment-skew.ts`).
 *
 * This replaces those entries with one short warning per action ID at most every 10 minutes.
 * Every other `console.warn` / `console.error` call is passed through unchanged.
 */

const STALE_ACTION_PATTERN = /Failed to find Server Action "([^"]+)"/;
const REPORT_INTERVAL_MS = 10 * 60 * 1000;
const MAX_TRACKED_ACTION_IDS = 200;

let installed = false;

function messageOf(arg: unknown): string {
  if (arg instanceof Error) {
    return arg.message;
  }
  return typeof arg === "string" ? arg : "";
}

export function installStaleServerActionLogFilter(): void {
  if (installed) {
    return;
  }
  installed = true;

  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);
  const lastReportedAt = new Map<string, number>();
  const suppressedSinceReport = new Map<string, number>();

  /** Returns true when the call was a stale-action entry and has been handled here. */
  const handleStaleAction = (args: unknown[]): boolean => {
    const match = args.map(messageOf).join(" ").match(STALE_ACTION_PATTERN);
    if (!match) {
      return false;
    }

    const actionId = match[1] ?? "unknown";
    const now = Date.now();
    const last = lastReportedAt.get(actionId) ?? 0;
    if (now - last < REPORT_INTERVAL_MS) {
      suppressedSinceReport.set(actionId, (suppressedSinceReport.get(actionId) ?? 0) + 1);
      return true;
    }

    if (!lastReportedAt.has(actionId) && lastReportedAt.size >= MAX_TRACKED_ACTION_IDS) {
      lastReportedAt.clear();
      suppressedSinceReport.clear();
    }

    const repeats = suppressedSinceReport.get(actionId) ?? 0;
    lastReportedAt.set(actionId, now);
    suppressedSinceReport.set(actionId, 0);
    originalWarn(
      `[deployment-skew] A browser tab from an older deploy called unknown server action ${actionId}` +
        (repeats > 0 ? ` (${repeats} more calls in the last 10 min)` : "") +
        ". The tab reloads itself; no action needed."
    );
    return true;
  };

  console.warn = (...args: unknown[]) => {
    if (!handleStaleAction(args)) {
      originalWarn(...args);
    }
  };
  console.error = (...args: unknown[]) => {
    if (!handleStaleAction(args)) {
      originalError(...args);
    }
  };
}
