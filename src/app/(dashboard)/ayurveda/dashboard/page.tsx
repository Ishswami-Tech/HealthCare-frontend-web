import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";

const AyurvedaDashboardContent = dynamic(
  () => import("./_components/AyurvedaDashboardContent"),
  { ssr: false, loading: () => <DashboardPageSkeleton /> }
);

export default function AyurvedaDashboardPage() {
  return <AyurvedaDashboardContent />;
}
