"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
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
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function NurseDashboard() {
  const { session } = useAuth();
  const user = session?.user;
  const nurseId = user?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: patientsData, isPending: isPatientsPending } = useNursePatients({
    nurseId,
    search: searchTerm,
    status: statusFilter === "all" ? undefined : statusFilter,
  } as any);

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['nursePatients', user?.clinicId]]);

  const patients = patientsData?.patients || [];

  const stats = useMemo(() => {
    const totalPatients = patients.length;
    return {
      activePatients: totalPatients,
      vitalsRecordedToday: patients.filter((p: any) => 
        p.vitals?.some((v: any) => v.recordedAt?.startsWith(new Date().toISOString().split('T')[0]))
      ).length,
      tasksCompleted: 0, // Mock for now
      pendingTasks: totalPatients, // Mock for now
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
          <div className="text-xs space-y-1">
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
            {new Date(latestVitals.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Nurse Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || "Nurse"}! Here's your patient care overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activePatients}</div>
            <p className="text-xs text-muted-foreground">Assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vitals Recorded</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.vitalsRecordedToday}</div>
            <p className="text-xs text-muted-foreground">Patients updated today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Care Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.tasksCompleted}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Care</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Next scheduled rounds</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" />
            Patient Care List
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                className="pl-8 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-9">
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
              <Stethoscope className="w-4 h-4" />
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
              <Heart className="w-4 h-4" />
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
              <Activity className="w-4 h-4" />
              Care Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-700/80">Ensure all care activities are logged in the EHR system immediately.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
