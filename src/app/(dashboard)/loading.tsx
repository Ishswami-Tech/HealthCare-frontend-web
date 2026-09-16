/**
 * Content-only loading UI for soft navigations inside the dashboard shell.
 * Keep this compact so the sidebar/header from `layout.tsx` stay visible and
 * only the right-side main area shows a loading state.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-4 py-2" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-4 w-80 max-w-full rounded-md bg-muted" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
      <div className="mt-4 h-64 rounded-xl bg-muted" />
    </div>
  );
}
