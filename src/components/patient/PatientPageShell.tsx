import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  DashboardPageHeader as PatientPageHeader,
  DashboardPageShell,
} from "@/components/dashboard/DashboardPageShell";

export { PatientPageHeader, DashboardPageShell };

/** Patient Care Portal page stack — matches mockup screen gap. */
export function PatientPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("cp-stack w-full", className)}>{children}</div>;
}
