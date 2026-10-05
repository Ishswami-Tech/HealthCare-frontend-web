interface SocketAuthRecoveryOptions {
  refresh: () => Promise<string | null>;
  onSuccess: (token: string) => void;
  onExhausted: () => void;
  schedule: (callback: () => void, delayMs: number) => number;
  clear: (timer: number) => void;
}

/** One recovery cycle per connection owner; cancelled owners cannot reconnect after logout. */
export function createSocketAuthRecovery(options: SocketAuthRecoveryOptions) {
  let active = true;
  let inFlight = false;
  let timer: number | null = null;
  let failures = 0;

  const recover = async (): Promise<void> => {
    if (!active || inFlight || timer !== null) return;
    inFlight = true;
    let token: string | null = null;
    try {
      token = await options.refresh();
    } catch {
      // Network/server failures take the same bounded retry path as an unavailable token.
    } finally {
      inFlight = false;
    }
    if (!active) return;
    if (token) {
      failures = 0;
      options.onSuccess(token);
      return;
    }
    if (failures >= 4) {
      options.onExhausted();
      return;
    }
    const delayMs = 2_000 * 2 ** failures;
    failures += 1;
    timer = options.schedule(() => {
      timer = null;
      void recover();
    }, delayMs);
  };

  return {
    recover,
    cancel: () => {
      active = false;
      if (timer !== null) options.clear(timer);
      timer = null;
    },
  };
}
