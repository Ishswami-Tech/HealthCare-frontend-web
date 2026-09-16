"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bed as BedIcon, Users, Hospital, AlertCircle } from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { IpdSummaryCards } from "./IpdSummaryCards";
import { useIpdDashboardData } from "@/hooks/query/useIpdDashboard";

export default function IpdDashboardContent() {
  const data = useIpdDashboardData();

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Inpatient Department"
        title="IPD Workspace"
        description="Manage admissions, bed occupancy, ward operations, and patient transfers."
        meta={`${data.occupancy ? `${((data.occupancy.occupied / data.occupancy.total) * 100).toFixed(0)}% occupied` : "0% occupied"} · ${data.beds.length} beds`}
        actions={[
          { label: "New Admission", href: "/ipd/dashboard#admit", icon: <Users className="size-4" /> },
          { label: "Bed Status", href: "/ipd/dashboard#beds", icon: <BedIcon className="size-4" /> },
        ]}
      />

      <IpdSummaryCards
        admissions={data.admissions}
        beds={data.beds}
        occupancy={data.occupancy ?? null}
        isLoading={data.isLoading}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              Active Admissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.admissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active admissions.</p>
            ) : (
              <ul className="space-y-3">
                {data.admissions.slice(0, 5).map((a) => (
                  <li key={a.id} className="rounded border p-3">
                    <p className="text-sm font-semibold">Patient: {a.patientId}</p>
                    <p className="text-xs text-muted-foreground">
                      Bed: {a.bedId} · Status: {a.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BedIcon className="size-4" />
              Bed Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.beds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No beds configured.</p>
            ) : (
              <ul className="space-y-2">
                {data.beds.slice(0, 5).map((bed) => (
                  <li key={bed.id} className="flex items-center justify-between text-sm">
                    <span>{bed.bedNumber} ({bed.bedType})</span>
                    <span className="text-xs text-muted-foreground">{bed.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hospital className="size-4" />
              Wards
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.wards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No wards configured.</p>
            ) : (
              <ul className="space-y-2">
                {data.wards.slice(0, 5).map((ward) => (
                  <li key={ward.id} className="flex items-center justify-between text-sm">
                    <span>{ward.name} ({ward.wardType})</span>
                    <span className="text-xs text-muted-foreground">
                      {ward.currentOccupancy}/{ward.capacity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-4" />
              Occupancy Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.occupancy ? (
              <div className="space-y-2 text-sm">
                <p>Total: {data.occupancy.total} beds</p>
                <p>Occupied: {data.occupancy.occupied} beds</p>
                <p>Available: {data.occupancy.available} beds</p>
                <p>Rate: {((data.occupancy.occupied / data.occupancy.total) * 100).toFixed(0)}%</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No occupancy data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPageShell>
  );
}
