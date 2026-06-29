import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <div className="space-y-8">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="space-y-4">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="h-9 w-4/5 max-w-2xl rounded-xl sm:h-12" />
              <Skeleton className="h-4 w-full max-w-xl rounded-full" />
              <Skeleton className="h-4 w-2/3 max-w-lg rounded-full" />
              <div className="flex flex-wrap gap-3 pt-3">
                <Skeleton className="h-10 w-32 rounded-full" />
                <Skeleton className="h-10 w-36 rounded-full" />
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <Skeleton className="mb-5 size-10 rounded-2xl" />
                <Skeleton className="mb-3 h-5 w-2/3 rounded-lg" />
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="mt-2 h-3 w-4/5 rounded-full" />
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
