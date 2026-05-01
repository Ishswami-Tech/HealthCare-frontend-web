import type { QueryKey } from "@tanstack/react-query";

const inflightRequests = new Map<string, Promise<unknown>>();

function stableSerialize(value: unknown): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(value, (_key, currentValue) => {
    if (!currentValue || typeof currentValue !== "object") {
      return currentValue;
    }

    if (seen.has(currentValue as object)) {
      return "[Circular]";
    }
    seen.add(currentValue as object);

    if (Array.isArray(currentValue)) {
      return currentValue;
    }

    return Object.keys(currentValue as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = (currentValue as Record<string, unknown>)[key];
        return acc;
      }, {});
  });
}

export function buildRequestKey(namespace: string, keyParts: unknown): string {
  try {
    return `${namespace}:${stableSerialize(keyParts)}`;
  } catch {
    return `${namespace}:${String(keyParts)}`;
  }
}

export async function dedupeRequest<T>(
  namespace: string,
  keyParts: unknown,
  request: () => Promise<T> | T
): Promise<T> {
  const requestKey = buildRequestKey(namespace, keyParts);
  const existing = inflightRequests.get(requestKey);
  if (existing) {
    return existing as Promise<T>;
  }

  const pending = Promise.resolve()
    .then(() => request())
    .finally(() => {
      if (inflightRequests.get(requestKey) === pending) {
        inflightRequests.delete(requestKey);
      }
    });

  inflightRequests.set(requestKey, pending);
  return pending;
}

export function dedupeQueryRequest<T>(
  queryKey: QueryKey,
  request: () => Promise<T> | T
): Promise<T> {
  return dedupeRequest("query", queryKey, request);
}

export function hasInflightRequest(namespace: string, keyParts: unknown): boolean {
  return inflightRequests.has(buildRequestKey(namespace, keyParts));
}
