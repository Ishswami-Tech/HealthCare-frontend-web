import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";

const IpdDashboardContent = dynamic(
  () => import("./_components/IpdDashboardContent"),
  { ssr: false, loading: () => <DashboardPageSkeleton /> }
);

export default function IpdDashboardPage() {
  return <IpdDashboardContent />;
}
