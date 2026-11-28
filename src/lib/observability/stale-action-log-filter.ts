/**
 * Server-side log filter for entries that need no action.
 *
 * 1. Deployment skew: after a deploy, browser tabs still running the previous build keep calling
 *    server actions by IDs the new server doesn't have. Next.js logs each call with
 *    `console.warn(error)`, a multi-line "Error: Failed to find Server Action ..." stack trace.
 *    The client reloads itself (see `src/lib/utils/deployment-skew.ts`).
 * 2. Client disconnects: when a browser closes the connection before a response finishes
 *    (navigated away, closed the tab, lost network), Next.js logs "⨯ Error: aborted" with
 *    code ECONNRESET as a 5-line error block. Nothing failed on the server.
 *
 * Log viewers that classify lines by text (Temps does) show both as ERROR. This replaces them
 * with one short line per kind (and per action ID) at most every 10 minutes, with a count of
 * the calls in between. Every other `console.warn` / `console.error` call is passed through
 * unchanged.
 */

const STALE_ACTION_PATTERN = /Failed to find Server Action "([^"]+)"/;
const REPORT_INTERVAL_MS = 10 * 60 * 1000;
const MAX_TRACKED_KEYS = 200;

let installed = false;

function messageOf(arg: unknown): string {
  if (arg instanceof Error) {
    return arg.message;
  }
  return typeof arg === "string" ? arg : "";
}

/** A request the browser abandoned: Node's IncomingMessage "aborted" error with ECONNRESET. */
function isClientDisconnect(args: unknown[]): boolean {
  return args.some(
    (arg) =>
      arg instanceof Error &&
      arg.message === "aborted" &&
      (arg as NodeJS.ErrnoException).code === "ECONNRESET"
  );
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

  /** Prints `line(repeats)` unless `key` was reported in the last 10 minutes. */
  const report = (key: string, line: (repeats: number) => string): void => {
    const now = Date.now();
    const last = lastReportedAt.get(key) ?? 0;
    if (now - last < REPORT_INTERVAL_MS) {
      suppressedSinceReport.set(key, (suppressedSinceReport.get(key) ?? 0) + 1);
      return;
    }

    if (!lastReportedAt.has(key) && lastReportedAt.size >= MAX_TRACKED_KEYS) {
      lastReportedAt.clear();
      suppressedSinceReport.clear();
    }

    const repeats = suppressedSinceReport.get(key) ?? 0;
    lastReportedAt.set(key, now);
    suppressedSinceReport.set(key, 0);
    originalWarn(line(repeats));
  };

  const inLastWindow = (repeats: number): string =>
    repeats > 0 ? ` (${repeats} more in the last 10 min)` : "";

  /** Returns true when the call was a known no-action entry and has been handled here. */
  const handleKnownEntry = (args: unknown[]): boolean => {
    const match = args.map(messageOf).join(" ").match(STALE_ACTION_PATTERN);
    if (match) {
      const actionId = match[1] ?? "unknown";
      report(
        `stale-action:${actionId}`,
        (repeats) =>
          `[deployment-skew] A browser tab from an older deploy called unknown server action ${actionId}` +
          inLastWindow(repeats) +
          ". The tab reloads itself; no action needed."
      );
      return true;
    }

    if (isClientDisconnect(args)) {
      report(
        "client-disconnect",
        (repeats) =>
          "[client-disconnect] A browser closed the connection before the response finished" +
          inLastWindow(repeats) +
          ". No action needed."
      );
      return true;
    }

    return false;
  };

  console.warn = (...args: unknown[]) => {
    if (!handleKnownEntry(args)) {
      originalWarn(...args);
    }
  };
  console.error = (...args: unknown[]) => {
    if (!handleKnownEntry(args)) {
      originalError(...args);
    }
  };
}
