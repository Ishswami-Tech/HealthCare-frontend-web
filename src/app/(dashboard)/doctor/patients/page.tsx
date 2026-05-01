"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useComprehensiveHealthRecord } from "@/hooks/query/useMedicalRecords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DataTable } from "@/components/ui/data-table";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useDoctorPatients } from "@/hooks/query/useDoctors";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PatientClinicalRecordView } from "@/components/patient/PatientClinicalRecordView";
import { usePatientStore } from "@/stores";
import { getAppointmentDateTimeValue } from "@/lib/utils/appointmentUtils";
import { formatDateInIST } from "@/lib/utils/date-time";
import {
  Calendar,
  Users,
  Search,
  Eye,
  Loader2,
  Clock,
  TrendingUp,
} from "lucide-react";

type RecordLike = Record<string, any>;

function toArray(value: unknown): RecordLike[] {
  if (Array.isArray(value)) return value as RecordLike[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["data", "items", "records", "appointments", "history", "labs", "results"]) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate as RecordLike[];
    }
  }
  return [];
}

function extractPatients(value: unknown): RecordLike[] {
  if (Array.isArray(value)) return value as RecordLike[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["patients", "data", "items", "records"]) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate as RecordLike[];
    }
  }
  return [];
}

function getPatientName(patient: RecordLike): string {
  return (
    patient.name ||
    `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
    patient.user?.name ||
    `${patient.user?.firstName || ""} ${patient.user?.lastName || ""}`.trim() ||
    patient.email ||
    patient.user?.email ||
    "Unknown Patient"
  );
}

function EhrDrawerContent({ patient }: { patient: RecordLike }) {
  const patientUserId = patient?.userId || patient?.user?.id || "";
  const { data: ehrData, isPending: isEhrLoading } = useComprehensiveHealthRecord(patientUserId) as {
    data: RecordLike;
    isPending: boolean;
  };

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{getPatientName(patient)} - Electronic Health Record</DrawerTitle>
      </DrawerHeader>
      <div className="px-6 pb-6">
        {isEhrLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <PatientClinicalRecordView
            patient={patient}
            ehr={ehrData || {}}
            appointments={[]}
            history={toArray(ehrData?.medicalHistory)}
            vitals={toArray(ehrData?.vitals)}
            labs={toArray(ehrData?.labReports)}
            carePlan={toArray(ehrData?.carePlan || ehrData?.carePlans)}
          />
        )}
      </div>
    </>
  );
}

export default function DoctorPatients() {
  const { session } = useAuth();
  const doctorId = session?.user?.id || "";
  const { clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [scheduleTarget, setScheduleTarget] = useState<{
    id: string;
    token: number;
  } | null>(null);
  const patientsQuery = useDoctorPatients(
    clinicId || "",
    {
      search: searchTerm,
      ...(genderFilter !== "all" && { gender: genderFilter }),
    },
    { enabled: !!clinicId }
  );
  const patients = useMemo(() => extractPatients(patientsQuery.data), [patientsQuery.data]);
  const drawerPatient = usePatientStore((state) => state.selectedPatient);
  const setSelectedPatient = usePatientStore((state) => state.setSelectedPatient);
  const isPendingPatients = patientsQuery.isPending;
  const { data: appointmentsData } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(doctorId ? { doctorId } : {}),
    limit: 300,
  });

  useWebSocketQuerySync();

  const patientsWithProfile = useMemo(() => {
    return patients.map((patient: RecordLike) => {
      const resolvedName = getPatientName(patient);
      const dateOfBirth = patient.dateOfBirth || patient.user?.dateOfBirth;
      let age = patient.age;

      if (!age && dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        if (!Number.isNaN(birthDate.getTime())) {
          const today = new Date();
          const years = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          age = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? years - 1 : years;
        }
      }

      return {
        ...patient,
        name: resolvedName,
        firstName: patient.firstName || patient.user?.firstName || "",
        lastName: patient.lastName || patient.user?.lastName || "",
        email: patient.email || patient.user?.email || "",
        phone: patient.phone || patient.user?.phone || "",
        gender: patient.gender || patient.user?.gender || "",
        dateOfBirth,
        age,
        address: patient.address || patient.user?.address || "",
      };
    });
  }, [patients]);

  const appointments = useMemo(() => {
    if (!appointmentsData) return [];
    return Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData as RecordLike).appointments || [];
  }, [appointmentsData]);

  const filteredPatients = patientsWithProfile.filter((patient: RecordLike) => {
    const name = patient.name || `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "";
    const patientPhone = patient.phone || "";
    const patientEmail = patient.email || "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientPhone.includes(searchTerm) ||
      patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.chiefComplaints || []).some((complaint: string) => String(complaint).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGender = genderFilter === "all" || String(patient.gender || "").toLowerCase() === genderFilter;
    const matchesAge =
      ageFilter === "all" ||
      (ageFilter === "young" && patient.age < 30) ||
      (ageFilter === "middle" && patient.age >= 30 && patient.age < 60) ||
      (ageFilter === "senior" && patient.age >= 60);

    return matchesSearch && matchesGender && matchesAge;
  });

  const patientColumns = useMemo<ColumnDef<RecordLike>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Patient",
        cell: ({ row }) => {
          const patient = row.original;
          return (
            <div className="min-w-0">
              <div className="font-medium text-foreground">{getPatientName(patient)}</div>
              <div className="text-xs text-muted-foreground">
                {patient.age ? `${patient.age} years` : "Age not set"}
                {patient.gender ? ` • ${patient.gender}` : ""}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ row }) => {
          const patient = row.original;
          return (
            <div className="space-y-1 text-sm">
              <div className="text-foreground">{patient.phone || "No phone"}</div>
              <div className="text-muted-foreground">{patient.email || "No email"}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => (
          <div className="max-w-[280px] truncate text-sm text-muted-foreground">
            {row.original.address || "No address"}
          </div>
        ),
      },
      {
        accessorKey: "lastVisit",
        header: "Visits",
        cell: ({ row }) => {
          const patient = row.original;
          return (
            <div className="space-y-1 text-sm">
              <div className="text-foreground">{patient.totalVisits !== undefined ? `${patient.totalVisits} total` : "—"}</div>
              <div className="text-muted-foreground">
                {patient.lastVisit ? `Last: ${formatDateInIST(patient.lastVisit)}` : "No visit"}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedPatient(row.original)}>
              <Eye className="mr-1 h-4 w-4" />
              View EHR
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={() =>
                setScheduleTarget({
                  id: row.original.userId || row.original.user?.id || row.original.id,
                  token: Date.now(),
                })
              }
            >
              <Calendar className="h-3 w-3" />
              Schedule
            </Button>
          </div>
        ),
      },
    ],
    [setSelectedPatient]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const upcomingAppointments = appointments.filter((appointment: RecordLike) => {
      const parsed = getAppointmentDateTimeValue(appointment);
      return parsed && !Number.isNaN(parsed.getTime()) && parsed >= now && parsed <= weekEnd && ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(String(appointment.status || "").toUpperCase());
    }).length;

    const followUps = appointments.filter((appointment: RecordLike) => {
      const followUpDate = appointment.followUpDate ? new Date(appointment.followUpDate) : null;
      return followUpDate && !Number.isNaN(followUpDate.getTime()) && followUpDate >= now && followUpDate <= weekEnd;
    }).length;

    const repeatPatients = appointments.reduce((acc: Map<string, number>, appointment: RecordLike) => {
      const patientId = String(appointment.patientId || "");
      if (!patientId) return acc;
      acc.set(patientId, (acc.get(patientId) || 0) + 1);
      return acc;
    }, new Map<string, number>());

    const improvedPatients = Array.from(repeatPatients.values() as Iterable<number>).filter((count) => count > 1).length;
    const recoveryRate = patientsWithProfile.length > 0 ? Math.round((improvedPatients / patientsWithProfile.length) * 100) : 0;

    return { upcomingAppointments, followUps, recoveryRate };
  }, [appointments, patientsWithProfile.length]);

  if (isPendingPatients) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Doctor Patients"
        title="My Patients"
        description="Review patient records, EHR summaries, contact details, and follow-up context from a shared clinical workspace."
        meta={<span className="text-sm font-medium text-muted-foreground">Total: {patientsWithProfile.length} patients</span>}
        actionsSlot={<WebSocketStatusIndicator />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <Card className="border-l-4 border-l-emerald-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientsWithProfile.length}</div>
            <p className="text-xs text-muted-foreground">Under your care</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">Appointments scheduled</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.followUps}</div>
            <p className="text-xs text-muted-foreground">Due this week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.recoveryRate}%</div>
            <p className="text-xs text-muted-foreground">Patient improvement</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input placeholder="Search by name or condition..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by age" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="young">Under 30</SelectItem>
                <SelectItem value="middle">30-60</SelectItem>
                <SelectItem value="senior">Over 60</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={patientColumns}
        data={filteredPatients}
        emptyMessage="No patients found"
        pageSize={10}
      />

      <Drawer
        direction="right"
        open={!!drawerPatient}
        onOpenChange={(open) => !open && setSelectedPatient(null)}
      >
        <DrawerContent className="h-full w-[min(92vw,80rem)] max-w-none overflow-y-auto">
          {drawerPatient ? <EhrDrawerContent patient={drawerPatient} /> : null}
        </DrawerContent>
      </Drawer>

      {scheduleTarget ? (
        <BookAppointmentDialog
          key={scheduleTarget.token}
          defaultOpen
          {...(clinicId ? { clinicId } : {})}
          {...(doctorId ? { initialDoctorId: doctorId } : {})}
          initialPatientId={scheduleTarget.id}
          onBooked={() => setScheduleTarget(null)}
        />
      ) : null}
    </DashboardPageShell>
  );
}
