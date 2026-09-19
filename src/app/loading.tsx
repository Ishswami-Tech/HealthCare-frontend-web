/**
 * Root loading fallback intentionally returns null.
 *
 * A full-screen spinner here wrapped every route under `app/` in Suspense and
 * made soft navigations look like full page refreshes (sidebar disappeared).
 * Segment-level loaders (e.g. `(dashboard)/loading.tsx`) handle content only.
 */
export default function Loading() {
  return null;
}
