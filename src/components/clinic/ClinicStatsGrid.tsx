"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Activity } from "lucide-react";

interface ClinicStatsGridProps {
  clinics: {
    status: "Active" | "Inactive";
    doctorsCount: number;
    patientsCount: number;
  }[];
}

export function ClinicStatsGrid({ clinics }: ClinicStatsGridProps) {
  const activeCount = clinics.filter(c => c.status === "Active").length;
  const inactiveCount = clinics.filter(c => c.status !== "Active").length;
  const totalDoctors = clinics.reduce((sum, c) => sum + (c.doctorsCount || 0), 0);
  const totalPatients = clinics.reduce((sum, c) => sum + (c.patientsCount || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
          <Building2 className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clinics.length}</div>
          <p className="text-xs text-muted-foreground">
            {activeCount} active, {inactiveCount} inactive
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
          <Users className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDoctors}</div>
          <p className="text-xs text-muted-foreground">Across all clinics</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          <Users className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPatients}</div>
          <p className="text-xs text-muted-foreground">Active patient base</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
          <Activity className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+15%</div>
          <p className="text-xs text-muted-foreground">Monthly growth</p>
        </CardContent>
      </Card>
    </div>
  );
}