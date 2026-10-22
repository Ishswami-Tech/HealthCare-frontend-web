"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCardSkeleton, TableSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import {
  Users,
  Activity,
  Clock,
  CheckCircle,
  Heart,
  Stethoscope,
  Search,
  Filter,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNursePatients } from "@/hooks/query/useNurse";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePatientStore } from "@/stores";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";

export default function NurseDashboard() {
  const { session } = useAuth();
  const user = session?.user;
  const nurseId = user?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const patients = usePatientStore((state) => state.collections.nurse);

  const { isPending: isPatientsPending } = useNursePatients({
    nurseId,
    search: searchTerm,
    status: statusFilter === "all" ? undefined : statusFilter,
  } as any);

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  // Product rule: no vitals metrics or capture anywhere.
  const stats = useMemo(() => ({ activePatients: patients.length }), [patients]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Patient",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold">{row.original.name || row.original.patientName || "Unknown"}</span>
          <span className="text-xs text-muted-foreground">{row.original.room || "Room TBA"}</span>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = (row.getValue("priority") as string || "normal").toLowerCase();
        const colors: Record<string, string> = {
          high: "bg-red-100 text-red-800",
          critical: "bg-red-600 text-white font-bold",
          normal: "bg-green-100 text-green-800",
        };
        return (
          <Badge className={colors[priority] || "bg-slate-100"}>
            {priority.toUpperCase()}
          </Badge>
        );
      },
    },
  ];

  const showSkeleton = isPatientsPending && patients.length === 0;

  const headerMeta = `${stats.activePatients} assigned patients`;

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Nurse"
        title="Nurse Dashboard"
        description={`Welcome back, ${user?.name || "Nurse"}. Review patient coverage and care priorities from one dashboard.`}
        meta={headerMeta}
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {showSkeleton ? (
          <>
            <StatCardSkeleton icon={<Users className="size-4 text-blue-600" />} label="Active Patients" />
          </>
        ) : (
          <>
            <DashboardMetricCard
              label="Active Patients"
              value={stats.activePatients}
              subtext="Assigned to you"
              accentClassName="border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
              valueClassName="mt-1 text-2xl font-bold text-blue-600"
              labelClassName="text-blue-700 dark:text-blue-300"
              compact
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="size-5 text-red-600" />
            Patient Care List
          </CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                className="h-9 pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {showSkeleton ? (
            <TableSkeleton columns={["Patient", "Priority"]} rows={3} />
          ) : (
            <DataTable
              columns={columns}
              data={patients}
              pageSize={10}
              emptyMessage="No assigned patients found"
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-50/50 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-green-800">
              <Heart className="size-4" />
              Medication Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700/80">Check prescription list for scheduled medication delivery times.</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-purple-800">
              <Activity className="size-4" />
              Care Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-700/80">Ensure all care activities are logged in the EHR system immediately.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardPageShell>
  );
}


