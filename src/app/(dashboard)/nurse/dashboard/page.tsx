"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
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
import {
  formatISODateInIST,
  formatTimeInIST,
} from "@/lib/utils/date-time";

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

  const stats = useMemo(() => {
    const todayDate = formatISODateInIST(new Date());
    const vitalsRecordedToday = patients.filter((p: any) =>
      p.vitals?.some((v: any) => formatISODateInIST(v.recordedAt) === todayDate)
    ).length;
    return {
      activePatients: patients.length,
      vitalsRecordedToday,
      vitalsNeeded: patients.length - vitalsRecordedToday,
    };
  }, [patients]);

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
    {
      id: "vitals",
      header: "Latest Vitals",
      cell: ({ row }) => {
        const latestVitals = (row.original.vitals as any[])?.[row.original.vitals.length - 1];
        if (!latestVitals) return <span className="text-xs text-muted-foreground">None recorded</span>;
        return (
          <div className="text-xs gap-y-1">
            <div className="flex gap-2">
              <span className="text-muted-foreground">BP:</span>
              <span className="font-medium">{latestVitals.bloodPressure}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Pulse:</span>
              <span className="font-medium">{latestVitals.heartRate} bpm</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "lastChecked",
      header: "Last Check",
      cell: ({ row }) => {
        const latestVitals = (row.original.vitals as any[])?.[row.original.vitals.length - 1];
        if (!latestVitals?.recordedAt) return <span className="text-xs text-muted-foreground">Never</span>;
        return (
          <span className="text-xs">
            {formatTimeInIST(latestVitals.recordedAt)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs">Record</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs">History</Button>
        </div>
      ),
    },
  ];

  if (isPatientsPending && patients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const headerMeta = `${stats.activePatients} assigned patients`;

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Nurse"
        title="Nurse Dashboard"
        description={`Welcome back, ${user?.name || "Nurse"}. Review patient coverage, vitals activity, and care priorities from one dashboard.`}
        meta={headerMeta}
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <DashboardMetricCard
          label="Active Patients"
          value={stats.activePatients}
          subtext="Assigned to you"
          accentClassName="border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
          valueClassName="mt-1 text-2xl font-bold text-blue-600"
          labelClassName="text-blue-700 dark:text-blue-300"
          compact
        />
        <DashboardMetricCard
          label="Vitals Recorded"
          value={stats.vitalsRecordedToday}
          subtext="Patients updated today"
          accentClassName="border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10"
          valueClassName="mt-1 text-2xl font-bold text-green-600"
          labelClassName="text-green-700 dark:text-green-300"
          compact
        />
        <DashboardMetricCard
          label="Vitals Updated"
          value={stats.vitalsRecordedToday}
          subtext="Patients updated today"
          accentClassName="border-purple-200 bg-purple-50 dark:border-purple-500/20 dark:bg-purple-500/10"
          valueClassName="mt-1 text-2xl font-bold text-purple-600"
          labelClassName="text-purple-700 dark:text-purple-300"
          compact
        />
        <DashboardMetricCard
          label="Vitals Needed"
          value={stats.vitalsNeeded}
          subtext="Patients pending check"
          accentClassName="border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10"
          valueClassName="mt-1 text-2xl font-bold text-orange-600"
          labelClassName="text-orange-700 dark:text-orange-300"
          compact
        />
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
          <DataTable
            columns={columns}
            data={patients}
            pageSize={10}
            emptyMessage="No assigned patients found"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-blue-800">
              <Stethoscope className="size-4" />
              Vital Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700/80">Standard rounds: Check vitals for all assigned patients every 4 hours.</p>
          </CardContent>
        </Card>
        
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


