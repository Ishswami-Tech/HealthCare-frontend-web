"use client";

import { useMemo, useReducer, useState } from "react";
import { ClipboardPlus, Loader2, Pill } from "lucide-react";
import { useComprehensiveHealthRecord } from "@/hooks/query/useMedicalRecords";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { OpdRegistrationDialog } from "@/components/patients/OpdRegistrationDialog";
import { VisitSelector } from "@/components/patient/case-sheet/VisitSelector";
import { VisitCaseSheet } from "@/components/patient/case-sheet/VisitCaseSheet";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useCurrentDoctorEntityId } from "@/hooks/query/useDoctors";
import { usePatientDirectory, usePatientDirectoryFacets } from "@/hooks/query/usePatientDirectory";
import { useDebouncedValue } from "@/hooks/core/useDebouncedValue";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { PatientClinicalRecordView } from "@/components/patient/PatientClinicalRecordView";
import { PatientBillHistory } from "@/components/billing/PatientBillHistory";
import { usePatientStore } from "@/stores";
import { DoctorPatientsView } from "./_components/DoctorPatientsView";
import {
  computeDoctorPatientsStats,
  directoryRowToDoctorPatientRow,
  extractAppointments,
  getPatientName,
  patientSummaryLine,
} from "./_components/doctorPatients.logic";
import {
  initialDirectoryFilters,
  toDirectoryParams,
  type DirectoryFilterState,
} from "./_components/directoryFilters";
import { PATIENT_DIRECTORY_PAGE_SIZES, type PatientDirectoryPageSize } from "@/types/patient-directory.types";

type RecordLike = Record<string, any>;

type DoctorPatientsState = {
  filters: DirectoryFilterState;
  prescribeTarget: {
    id: string;
    name: string;
    /** "32 years · Female" — shown under the name in the prescription dialog. */
    summary?: string;
  } | null;
};

type DoctorPatientsAction =
  /** Change filters, search or sort: back to page 1. Paging alone is `set_page`. */
  | { type: "patch_filters"; patch: Partial<DirectoryFilterState> }
  | { type: "clear_filters" }
  | { type: "set_page"; value: number }
  | { type: "set_page_size"; value: PatientDirectoryPageSize }
  | { type: "set_prescribe_target"; value: DoctorPatientsState["prescribeTarget"] };

const initialDoctorPatientsState: DoctorPatientsState = {
  filters: initialDirectoryFilters,
  prescribeTarget: null,
};

function doctorPatientsReducer(
  state: DoctorPatientsState,
  action: DoctorPatientsAction
): DoctorPatientsState {
  switch (action.type) {
    case "patch_filters":
      return { ...state, filters: { ...state.filters, ...action.patch, page: 1 } };
    case "clear_filters":
      // Keep how the list is sorted and how many rows to a page: those are display choices.
      return {
        ...state,
        filters: {
          ...initialDirectoryFilters,
          sort: state.filters.sort,
          order: state.filters.order,
          pageSize: state.filters.pageSize,
        },
      };
    case "set_page":
      return { ...state, filters: { ...state.filters, page: action.value } };
    case "set_page_size":
      return { ...state, filters: { ...state.filters, pageSize: action.value, page: 1 } };
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

const SEARCH_DEBOUNCE_MS = 300;

const asPageSize = (value: number): PatientDirectoryPageSize =>
  (PATIENT_DIRECTORY_PAGE_SIZES as readonly number[]).includes(value)
    ? (value as PatientDirectoryPageSize)
    : PATIENT_DIRECTORY_PAGE_SIZES[1];

export default function DoctorPatients() {
  const { session } = useAuth();
  const doctorId = session?.user?.id || "";
  const { clinicId } = useClinicContext();
  // Prescription.doctorId is a foreign key to the Doctor entity, not the
  // User id most other doctor-scoped queries on this page use.
  const { doctorId: doctorEntityId } = useCurrentDoctorEntityId(clinicId || "");
  const [state, dispatch] = useReducer(doctorPatientsReducer, initialDoctorPatientsState);
  const { filters, prescribeTarget } = state;
  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);

  // Search, filters, sorting and paging all run on the server: the clinic has tens of thousands of patients.
  const directoryParams = useMemo(
    () => toDirectoryParams(filters, debouncedSearch),
    [filters, debouncedSearch]
  );
  const patientsQuery = usePatientDirectory(clinicId || "", directoryParams, { enabled: !!clinicId });
  const facetsQuery = usePatientDirectoryFacets(clinicId || "");
  const directoryPage = patientsQuery.data;
  const rows = useMemo(
    () => (directoryPage?.rows ?? []).map(directoryRowToDoctorPatientRow),
    [directoryPage]
  );
  const displayTotal = directoryPage?.total ?? 0;
  const displayTotalPages = directoryPage?.totalPages ?? 1;
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

  const totalPatientsCount = displayTotal;
  const stats = useMemo(
    () =>
      computeDoctorPatientsStats(extractAppointments(appointmentsData)),
    [appointmentsData]
  );

  // One flow for both: search an existing patient (no duplicates) or register a new one,
  // then open the OPD visit. A doctor-registered patient is linked to this doctor on the
  // backend, so a refetch brings them into the list.
  const headerActions = (
    <OpdRegistrationDialog
      clinicId={clinicId || ""}
      onRegistered={() => void patientsQuery.refetch()}
      trigger={
        <Button size="md">
          <ClipboardPlus />
          New patient / OPD visit
        </Button>
      }
    />
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
        page={directoryPage?.page ?? filters.page}
        totalPages={displayTotalPages}
        pageSize={filters.pageSize}
        onPageChange={(nextPage) => dispatch({ type: "set_page", value: nextPage })}
        onPageSizeChange={(size) => dispatch({ type: "set_page_size", value: asPageSize(size) })}
        filters={filters}
        facets={facetsQuery.data}
        onFiltersChange={(patch) => dispatch({ type: "patch_filters", patch })}
        onClearFilters={() => dispatch({ type: "clear_filters" })}
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
