import React from "react";

function SectionSkeleton() {
  return (
    <div className="animate-pulse py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-4 h-6 w-40 rounded-full bg-muted" />
        <div className="mx-auto mb-10 h-9 w-2/3 max-w-xl rounded-xl bg-muted" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 size-12 rounded-2xl bg-muted" />
              <div className="mb-3 h-5 w-2/3 rounded-lg bg-muted" />
              <div className="mb-2 h-3 w-full rounded-full bg-muted" />
              <div className="h-3 w-1/2 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { SectionSkeleton };
