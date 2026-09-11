import { LoadingSpinner } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <LoadingSpinner size="lg" center />
    </div>
  );
}
