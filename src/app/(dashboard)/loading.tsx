
import { LoadingSpinner } from "@/components/ui/loading";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <LoadingSpinner size="lg" text="Loading content..." />
    </div>
  );
}
