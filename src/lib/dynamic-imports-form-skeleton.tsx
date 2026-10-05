function FormSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 h-6 w-1/4 rounded-lg bg-muted" />
      <div className="flex flex-col gap-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="mb-2 h-4 w-1/6 rounded-full bg-muted" />
            <div className="h-10 rounded-xl bg-muted" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-10 rounded-full bg-muted" />
    </div>
  );
}

export { FormSkeleton };
