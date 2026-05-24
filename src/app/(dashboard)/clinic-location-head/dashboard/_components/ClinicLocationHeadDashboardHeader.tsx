"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, ClipboardList } from "lucide-react";

interface ClinicLocationHeadDashboardHeaderProps {
  clinicName: string | undefined;
  today: string;
  onCheckIn: () => void;
  onLiveQueue: () => void;
}

export function ClinicLocationHeadDashboardHeader({
  clinicName,
  today,
  onCheckIn,
  onLiveQueue,
}: ClinicLocationHeadDashboardHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Location Overview</h1>
        <p className="text-muted-foreground">
          {clinicName ? `${clinicName} · ` : ""}
          Clinic Location Head · {today}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2" onClick={onCheckIn} type="button">
          <ClipboardList className="size-4" />
          Check-In
        </Button>
        <Button className="gap-2" onClick={onLiveQueue} type="button">
          <Activity className="size-4" />
          Live Queue
        </Button>
      </div>
    </div>
  );
}
