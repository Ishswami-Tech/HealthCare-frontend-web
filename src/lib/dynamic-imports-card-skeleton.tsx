function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 size-12 rounded-2xl bg-muted" />
      <div className="mb-2 h-4 rounded-full bg-muted" />
      <div className="h-4 w-2/3 rounded-full bg-muted" />
    </div>
  );
}

export { CardSkeleton };
