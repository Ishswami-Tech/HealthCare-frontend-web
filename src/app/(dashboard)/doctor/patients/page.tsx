"use client";

import { useDeferredValue, useMemo, useReducer, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useComprehensiveHealthRecord } from "@/hooks/query/useMedicalRecords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DataTable } from "@/components/ui/data-table";
import { ServerPagination } from "@/components/ui/pagination";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { RegisterPatientDialog } from "@/components/patients/RegisterPatientDialog";
import { OpdRegistrationDialog } from "@/components/patients/OpdRegistrationDialog";
import { VisitSelector } from "@/components/patient/case-sheet/VisitSelector";
import { VisitCaseSheet } from "@/components/patient/case-sheet/VisitCaseSheet";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useDoctorPatients, useCurrentDoctorEntityId } from "@/hooks/query/useDoctors";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PatientClinicalRecordView } from "@/components/patient/PatientClinicalRecordView";
import { usePatientStore } from "@/stores";
import { getAppointmentDateTimeValue } from "@/lib/utils/appointmentUtils";
import { formatDateInIST } from "@/lib/utils/date-time";
import { useCurrentTimestamp } from "@/hooks/utils/useClientDate";
import { StatCardSkeleton, TableSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import {
  Calendar,
  Users,
  Search,
  Eye,
  Loader2,
  Clock,
  TrendingUp,
  Pill,
} from "lucide-react";

type RecordLike = Record<string, any>;

type DoctorPatientsState = {
  searchTerm: string;
  genderFilter: string;
  ageFilter: string;
  page: number;
  prescribeTarget: {
    id: string;
    name: string;
  } | null;
};

type DoctorPatientsAction =
  | { type: "set_search_term"; value: string }
  | { type: "set_gender_filter"; value: string }
  | { type: "set_age_filter"; value: string }
  | { type: "set_page"; value: number }
  | { type: "set_prescribe_target"; value: DoctorPatientsState["prescribeTarget"] };

const initialDoctorPatientsState: DoctorPatientsState = {
  searchTerm: "",
  genderFilter: "all",
  ageFilter: "all",
  page: 1,
  prescribeTarget: null,
};

function doctorPatientsReducer(
  state: DoctorPatientsState,
  action: DoctorPatientsAction
): DoctorPatientsState {
  switch (action.type) {
    case "set_search_term":
      return { ...state, searchTerm: action.value, page: 1 };
    case "set_gender_filter":
      return { ...state, genderFilter: action.value, page: 1 };
    case "set_age_filter":
      return { ...state, ageFilter: action.value, page: 1 };
    case "set_page":
      return { ...state, page: action.value };
    case "set_prescribe_target":
      return { ...state, prescribeTarget: action.value };
    default:
      return state;
  }
}

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

function extractPaginationMeta(value: unknown, fallbackPageSize: number) {
  if (Array.isArray(value)) {
    return {
      total: value.length,
      page: 1,
      totalPages: 1,
      pageSize: Math.max(fallbackPageSize, value.length || 1),
    };
  }

  if (!value || typeof value !== "object") {
    return { total: 0, page: 1, totalPages: 1, pageSize: fallbackPageSize };
  }

  const record = value as Record<string, any>;
  const total = Number(record.total ?? record.count ?? record.totalCount ?? 0) || extractPatients(value).length;
  const page = Number(record.page ?? record.currentPage ?? 1) || 1;
  const pageSize = Number(record.pageSize ?? record.limit ?? fallbackPageSize) || fallbackPageSize;
  const totalPages = Number(record.totalPages ?? record.pageCount ?? Math.max(1, Math.ceil(total / Math.max(pageSize, 1)))) || 1;

  return {
    total,
    page,
    totalPages,
    pageSize,
  };
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

function EhrDrawerContent({
  patient,
  clinicId,
  onPrescribe,
}: {
  patient: RecordLike;
  clinicId: string;
  onPrescribe: (patient: RecordLike) => void;
}) {
  const patientUserId = patient?.userId || patient?.user?.id || "";
  const patientId: string = patient?.id || "";
  const [visitId, setVisitId] = useState<string | null>(null);
  const { data: ehrData, isPending: isEhrLoading } = useComprehensiveHealthRecord(patientUserId) as {
    data: RecordLike;
    isPending: boolean;
  };
  const canShowCaseSheet = Boolean(clinicId && patientId && patientUserId);

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{getPatientName(patient)} - Electronic Health Record</DrawerTitle>
      </DrawerHeader>
      <div className="flex flex-col gap-y-4 px-6 pb-6">
        {canShowCaseSheet ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <VisitSelector
              clinicId={clinicId}
              patientId={patientId}
              selectedVisitId={visitId}
              onSelect={setVisitId}
            />
            <Button size="sm" onClick={() => onPrescribe(patient)}>
              <Pill className="mr-1 size-4" />
              Move to Prescription
            </Button>
          </div>
        ) : null}
        {isEhrLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-blue-600" />
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
            prescriptions={toArray(ehrData?.prescriptions)}
            caseSheet={
              canShowCaseSheet && visitId ? (
                <VisitCaseSheet
                  clinicId={clinicId}
                  patientId={patientId}
                  patientUserId={patientUserId}
                  visitId={visitId}
                />
              ) : canShowCaseSheet ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-6 text-sm text-muted-foreground">
                  No OPD visit yet — use “New OPD visit” above to open a case sheet.
                </div>
              ) : undefined
            }
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
  // Prescription.doctorId is a foreign key to the Doctor entity, not the
  // User id most other doctor-scoped queries on this page use.
  const { doctorId: doctorEntityId } = useCurrentDoctorEntityId(clinicId || "");
  const [state, dispatch] = useReducer(doctorPatientsReducer, initialDoctorPatientsState);
  const pageSize = 10;
  const debouncedSearchTerm = useDeferredValue(state.searchTerm);
  const { genderFilter, ageFilter, page, prescribeTarget } = state;

  const patientsQuery = useDoctorPatients(
    clinicId || "",
    {
      search: debouncedSearchTerm,
      ...(genderFilter !== "all" && { gender: genderFilter }),
      ...(ageFilter !== "all" && {
        ageRange:
          ageFilter === "young" ? "young" : ageFilter === "middle" ? "middle" : "senior",
      }),
      limit: pageSize,
      offset: (page - 1) * pageSize,
    },
    { enabled: !!clinicId }
  );
  const patientsPage = useMemo(() => extractPaginationMeta(patientsQuery.data, pageSize), [patientsQuery.data]);
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
      };
    });
  }, [patients]);

  const appointments = useMemo(() => {
    if (!appointmentsData) return [];
    return Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData as RecordLike).appointments || [];
  }, [appointmentsData]);

  const filteredPatients = patientsWithProfile;
  const totalPatientsCount = patientsPage.total || patientsWithProfile.length;
  const headerMeta = `Loaded: ${patientsPage.total} patients`;
  // A doctor-registered patient is linked to this doctor directly on the
  // backend (no appointment required), so registering just needs a refetch
  // to bring the new patient into the list.
  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <OpdRegistrationDialog
        clinicId={clinicId || ""}
        onRegistered={() => void patientsQuery.refetch()}
      />
      <RegisterPatientDialog
        clinicId={clinicId}
        onRegistered={() => void patientsQuery.refetch()}
      />
      <WebSocketStatusIndicator />
    </div>
  );
  const prescriptionDialog = prescribeTarget ? (
    <QuickPrescriptionModal
      isOpen
      onClose={() => dispatch({ type: "set_prescribe_target", value: null })}
      patientId={prescribeTarget.id}
      patientName={prescribeTarget.name}
      doctorId={doctorEntityId}
    />
  ) : null;

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
            <div className="flex flex-col gap-y-1 text-sm">
              <div className="text-foreground">{patient.phone || "No phone"}</div>
              <div className="text-muted-foreground">{patient.email || "No email"}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "lastVisit",
        header: "Visits",
        cell: ({ row }) => {
          const patient = row.original;
          return (
            <div className="flex flex-col gap-y-1 text-sm">
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
              <Eye className="mr-1 size-4" />
              View EHR
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={() =>
                dispatch({
                  type: "set_prescribe_target",
                  value: {
                    id: row.original.id,
                    name: getPatientName(row.original),
                  },
                })
              }
            >
              <Pill className="size-3" />
              Prescribe
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
    const recoveryRate = totalPatientsCount > 0 ? Math.round((improvedPatients / totalPatientsCount) * 100) : 0;

    return { upcomingAppointments, followUps, recoveryRate };
  }, [appointments, totalPatientsCount]);

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Doctor Patients"
        title="My Patients"
        description="Review patient records, EHR summaries, contact details, and follow-up context from a shared clinical workspace."
        meta={headerMeta}
        actionsSlot={headerActions}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        {isPendingPatients ? (
          <>
            <StatCardSkeleton icon={<Users className="size-4" />} label="Total Patients" />
            <StatCardSkeleton icon={<Calendar className="size-4" />} label="This Week" />
            <StatCardSkeleton icon={<Clock className="size-4" />} label="Follow-ups" />
            <StatCardSkeleton icon={<TrendingUp className="size-4" />} label="Recovery Rate" />
          </>
        ) : (
          <>
            <Card className="border-l-2 border-l-emerald-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPatientsCount}</div>
                <p className="text-xs text-muted-foreground">Under your care</p>
              </CardContent>
            </Card>

            <Card className="border-l-2 border-l-blue-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="size-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.upcomingAppointments}</div>
                <p className="text-xs text-muted-foreground">Appointments scheduled</p>
              </CardContent>
            </Card>

            <Card className="border-l-2 border-l-amber-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
                <Clock className="size-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.followUps}</div>
                <p className="text-xs text-muted-foreground">Due this week</p>
              </CardContent>
            </Card>

            <Card className="border-l-2 border-l-green-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
                <TrendingUp className="size-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.recoveryRate}%</div>
                <p className="text-xs text-muted-foreground">Patient improvement</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search by name or condition..."
                value={state.searchTerm}
                onChange={(e) => dispatch({ type: "set_search_term", value: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select
              value={genderFilter}
              onValueChange={(value) => {
                dispatch({ type: "set_gender_filter", value });
              }}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={ageFilter}
              onValueChange={(value) => {
                dispatch({ type: "set_age_filter", value });
              }}
            >
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

      {isPendingPatients ? (
        <TableSkeleton
          columns={["Patient", "Age", "Status", "Next Visit", "Actions"]}
          rows={5}
        />
      ) : (
        <DataTable
          columns={patientColumns}
          data={filteredPatients}
          emptyMessage="No patients found"
          pageSize={10}
          showPagination={false}
        />
      )}

      <ServerPagination
        page={isPendingPatients ? 1 : page}
        totalPages={isPendingPatients ? 1 : patientsPage.totalPages}
        totalItems={isPendingPatients ? 0 : patientsPage.total}
        pageSize={pageSize}
        onPageChange={(nextPage) => dispatch({ type: "set_page", value: nextPage })}
      />

      <Drawer
        direction="right"
        open={!!drawerPatient}
      onOpenChange={(open) => !open && setSelectedPatient(null)}
      >
        <DrawerContent className="h-full w-[min(92vw,80rem)] max-w-none overflow-y-auto">
          {drawerPatient ? (
            <EhrDrawerContent
              patient={drawerPatient}
              clinicId={clinicId || ""}
              onPrescribe={(target) =>
                dispatch({
                  type: "set_prescribe_target",
                  value: { id: target.id, name: getPatientName(target) },
                })
              }
            />
          ) : null}
        </DrawerContent>
      </Drawer>

      {prescriptionDialog}
    </DashboardPageShell>
  );
}

