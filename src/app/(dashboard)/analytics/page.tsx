"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useClinicContext } from "@/hooks/query/useClinics";
import {
  usePatientAnalytics,
  useAppointmentAnalytics,
  useRevenueAnalytics,
  useQueueAnalytics,
} from "@/hooks/query/useAnalytics";
import {
  AlertTriangle,
  Calendar,
  Clock,
  DollarSign,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";

type Period = "day" | "week" | "month" | "year";

const PERIOD_BY_RANGE: Record<string, Period> = {
  "7d": "week",
  "30d": "month",
  "90d": "month",
  "1y": "year",
};

const RUPEE = "₹";

/** GET /analytics/patients: `{ totalPatients, newPatients, returningPatients }`. */
interface PatientStats {
  totalPatients?: number;
  newPatients?: number;
}

/** GET /analytics/appointments: totals plus a status breakdown (no separate completed field). */
interface AppointmentStats {
  totalAppointments?: number;
  appointmentsByStatus?: Record<string, unknown>;
}

interface RevenueStats {
  totalRevenue?: number;
}

interface QueueStats {
  averageWaitTime?: number;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function formatCount(value: number | undefined): string {
  return value === undefined ? "No data" : value.toLocaleString("en-IN");
}

function formatRupees(value: number | undefined): string {
  return value === undefined ? "No data" : `${RUPEE}${value.toLocaleString("en-IN")}`;
}

interface StatCardProps {
  title: string;
  icon: LucideIcon;
  value: string;
  caption?: string;
  loading: boolean;
  unavailable: boolean;
}

function StatCard({ title, icon: Icon, value, caption, loading, unavailable }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-muted" aria-label="Loading" />
        ) : unavailable ? (
          <>
            <div className="text-lg font-semibold text-muted-foreground">Not available</div>
            <p className="text-xs text-muted-foreground">Your role cannot view this figure.</p>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {caption ? <p className="text-xs text-muted-foreground">{caption}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Clinic analytics. Every figure comes from the analytics API for the signed-in role; a query the
 * backend refuses (403 for this role) shows "Not available" instead of a number. No placeholder
 * or demo values are rendered here.
 */
export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d");
  const { clinicId } = useClinicContext();
  const period = PERIOD_BY_RANGE[timeRange] ?? "month";

  const patients = usePatientAnalytics({ clinicId: clinicId || "", period });
  const appointments = useAppointmentAnalytics(
    { clinicId: clinicId || "", period },
    { enabled: Boolean(clinicId) },
  );
  const revenue = useRevenueAnalytics({ clinicId: clinicId || "", period });
  const queue = useQueueAnalytics(clinicId || "", { period });

  const patientData = patients.data as PatientStats | undefined;
  const appointmentData = appointments.data as AppointmentStats | undefined;
  const revenueData = revenue.data as RevenueStats | undefined;
  const queueData = queue.data as QueueStats | undefined;

  const totalAppointments = asNumber(appointmentData?.totalAppointments);
  const completedAppointments = asNumber(appointmentData?.appointmentsByStatus?.COMPLETED);
  const totalPatients = asNumber(patientData?.totalPatients);
  const newPatients = asNumber(patientData?.newPatients);
  const waitMinutes = asNumber(queueData?.averageWaitTime);

  const anyFetching =
    patients.isFetching || appointments.isFetching || revenue.isFetching || queue.isFetching;

  const refreshAll = () => {
    void Promise.all([
      patients.refetch(),
      appointments.refetch(),
      revenue.refetch(),
      queue.refetch(),
    ]);
  };

  return (
    <div className="flex flex-col gap-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground">
            Clinic figures for the selected period. Figures your role cannot view are marked as not
            available.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36" aria-label="Time range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={refreshAll}
            disabled={anyFetching || !clinicId}
          >
            <RefreshCw className={`size-4 ${anyFetching ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {!clinicId ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 size-12 text-yellow-500" aria-hidden="true" />
            <h2 className="mb-2 text-lg font-semibold">No clinic selected</h2>
            <p className="text-muted-foreground">Select a clinic to view analytics.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total patients"
            icon={Users}
            value={formatCount(totalPatients)}
            caption={
              newPatients !== undefined ? `${formatCount(newPatients)} new this month` : undefined
            }
            loading={patients.isPending}
            unavailable={Boolean(patients.error)}
          />
          <StatCard
            title="Appointments"
            icon={Calendar}
            value={formatCount(totalAppointments)}
            caption={
              completedAppointments !== undefined
                ? `${formatCount(completedAppointments)} completed`
                : undefined
            }
            loading={appointments.isPending}
            unavailable={Boolean(appointments.error)}
          />
          <StatCard
            title="Revenue"
            icon={DollarSign}
            value={formatRupees(asNumber(revenueData?.totalRevenue))}
            loading={revenue.isPending}
            unavailable={Boolean(revenue.error)}
          />
          <StatCard
            title="Average wait"
            icon={Clock}
            value={waitMinutes === undefined ? "No data" : `${waitMinutes} min`}
            loading={queue.isPending}
            unavailable={Boolean(queue.error)}
          />
        </div>
      )}
    </div>
  );
}
