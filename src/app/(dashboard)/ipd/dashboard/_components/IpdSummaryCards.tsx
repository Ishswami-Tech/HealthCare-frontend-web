"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bed, Users, Hospital, AlertTriangle } from "lucide-react";

type SummaryProps = {
  admissions: Array<{ id: string; status: string }>;
  beds: Array<{ id: string; status: string }>;
  occupancy: { total: number; occupied: number; available: number } | null;
  isLoading: boolean;
};

export function IpdSummaryCards({ admissions, beds, occupancy, isLoading }: SummaryProps) {
  const occupiedBeds = beds.filter((b) => b.status === "OCCUPIED" || b.status === "occupied").length;
  const availableBeds = beds.filter((b) => b.status === "AVAILABLE" || b.status === "available").length;
  const activeAdmissions = admissions.filter((a) => a.status === "ACTIVE" || a.status === "active").length;

  const items = [
    { label: "Active Admissions", value: activeAdmissions, Icon: Users },
    { label: "Total Beds", value: beds.length, Icon: Bed },
    { label: "Occupied", value: occupancy?.occupied ?? occupiedBeds, Icon: Hospital },
    { label: "Available", value: occupancy?.available ?? availableBeds, Icon: AlertTriangle },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map(({ label, value, Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{isLoading ? "…" : value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
