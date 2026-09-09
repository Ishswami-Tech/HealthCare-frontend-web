import dynamic from "next/dynamic";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";

const DietDashboardContent = dynamic(
  () => import("./_components/DietDashboardContent"),
  { ssr: false, loading: () => <DashboardPageSkeleton /> }
);

export default function DietDashboardPage() {
  return <DietDashboardContent />;
}
