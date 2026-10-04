"use client";

import { useDeferredValue, useMemo, useReducer, useState } from "react";
import { ClipboardPlus, Loader2, Pill, UserPlus } from "lucide-react";
import { useComprehensiveHealthRecord } from "@/hooks/query/useMedicalRecords";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { RegisterPatientDialog } from "@/components/patients/RegisterPatientDialog";
import { OpdRegistrationDialog } from "@/components/patients/OpdRegistrationDialog";
import { VisitSelector } from "@/components/patient/case-sheet/VisitSelector";
import { VisitCaseSheet } from "@/components/patient/case-sheet/VisitCaseSheet";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useDoctorPatients, useCurrentDoctorEntityId } from "@/hooks/query/useDoctors";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { PatientClinicalRecordView } from "@/components/patient/PatientClinicalRecordView";
import { PatientBillHistory } from "@/components/billing/PatientBillHistory";
import { usePatientStore } from "@/stores";
import {
  DoctorPatientsView,
  type DoctorPatientsAgeFilter,
  type DoctorPatientsGenderFilter,
} from "./_components/DoctorPatientsView";
import {
  computeDoctorPatientsStats,
  extractAppointments,
  extractPaginationMeta,
  extractPatients,
  getPatientName,
  patientSummaryLine,
  toDoctorPatientRow,
} from "./_components/doctorPatients.logic";

type RecordLike = Record<string, any>;

type DoctorPatientsState = {
  searchTerm: string;
  genderFilter: DoctorPatientsGenderFilter;
  ageFilter: DoctorPatientsAgeFilter;
  page: number;
  prescribeTarget: {
    id: string;
    name: string;
    /** "32 years · Female" — shown under the name in the prescription dialog. */
    summary?: string;
  } | null;
};

type DoctorPatientsAction =
  | { type: "set_search_term"; value: string }
  | { type: "set_gender_filter"; value: DoctorPatientsGenderFilter }
  | { type: "set_age_filter"; value: DoctorPatientsAgeFilter }
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
            billing={
              clinicId && patientId ? (
                <PatientBillHistory
                  clinicId={clinicId}
                  patientId={patientId}
                  patientUserId={patientUserId}
                />
              ) : undefined
            }
          />
        )}
      </div>
    </>
  );
}

const PAGE_SIZE = 10;

export default function DoctorPatients() {
  const { session } = useAuth();
  const doctorId = session?.user?.id || "";
  const { clinicId } = useClinicContext();
  // Prescription.doctorId is a foreign key to the Doctor entity, not the
  // User id most other doctor-scoped queries on this page use.
  const { doctorId: doctorEntityId } = useCurrentDoctorEntityId(clinicId || "");
  const [state, dispatch] = useReducer(doctorPatientsReducer, initialDoctorPatientsState);
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
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    },
    { enabled: !!clinicId }
  );
  const patientsPage = useMemo(() => extractPaginationMeta(patientsQuery.data, PAGE_SIZE), [patientsQuery.data]);
  const rows = useMemo(
    () => extractPatients(patientsQuery.data).map((patient) => toDoctorPatientRow(patient)),
    [patientsQuery.data]
  );
  const drawerPatient = usePatientStore((state) => state.selectedPatient);
  const setSelectedPatient = usePatientStore((state) => state.setSelectedPatient);
  // The first load failed and there is nothing to show ("Try again" refetches).
  const loadFailed =
    Boolean(patientsQuery.error) && !patientsQuery.data && !patientsQuery.isFetching;
  const isPendingPatients =
    !loadFailed && (patientsQuery.isPending || (!patientsQuery.data && patientsQuery.isFetching));
  const { data: appointmentsData } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(doctorId ? { doctorId } : {}),
    limit: 300,
  });

  useWebSocketQuerySync();

  const totalPatientsCount = patientsPage.total || rows.length;
  const stats = useMemo(
    () => computeDoctorPatientsStats(extractAppointments(appointmentsData), totalPatientsCount),
    [appointmentsData, totalPatientsCount]
  );

  // A doctor-registered patient is linked to this doctor directly on the
  // backend (no appointment required), so registering just needs a refetch
  // to bring the new patient into the list.
  const headerActions = (
    <>
      <OpdRegistrationDialog
        clinicId={clinicId || ""}
        onRegistered={() => void patientsQuery.refetch()}
        trigger={
          <Button variant="outline" size="md">
            <ClipboardPlus />
            OPD Registration
          </Button>
        }
      />
      <RegisterPatientDialog
        clinicId={clinicId}
        onRegistered={() => void patientsQuery.refetch()}
        trigger={
          <Button size="md">
            <UserPlus />
            Register Patient
          </Button>
        }
      />
    </>
  );
  const prescriptionDialog = prescribeTarget ? (
    <QuickPrescriptionModal
      isOpen
      onClose={() => dispatch({ type: "set_prescribe_target", value: null })}
      patientId={prescribeTarget.id}
      patientName={prescribeTarget.name}
      doctorId={doctorEntityId}
      {...(prescribeTarget.summary ? { patientSummary: prescribeTarget.summary } : {})}
    />
  ) : null;

  return (
    <>
      <DoctorPatientsView
        loading={isPendingPatients}
        loadFailed={loadFailed}
        onRetry={() => void patientsQuery.refetch()}
        rows={rows}
        totalPatients={totalPatientsCount}
        stats={stats}
        page={page}
        totalPages={patientsPage.totalPages}
        pageSize={PAGE_SIZE}
        onPageChange={(nextPage) => dispatch({ type: "set_page", value: nextPage })}
        searchTerm={state.searchTerm}
        genderFilter={genderFilter}
        ageFilter={ageFilter}
        onSearchChange={(value) => dispatch({ type: "set_search_term", value })}
        onGenderChange={(value) => dispatch({ type: "set_gender_filter", value })}
        onAgeChange={(value) => dispatch({ type: "set_age_filter", value })}
        onPrescribe={(row) =>
          dispatch({
            type: "set_prescribe_target",
            value: { id: row.id, name: row.name, summary: patientSummaryLine(row) },
          })
        }
        actions={headerActions}
      />

      {/* EHR drawer: opens for the patient held in the patient store. "View EHR" in the table goes to /doctor/patients/[id]. */}
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
    </>
  );
}
