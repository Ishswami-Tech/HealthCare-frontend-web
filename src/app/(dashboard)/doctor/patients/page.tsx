"use client";

import { useDeferredValue, useMemo, useReducer } from "react";
import { ClipboardPlus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { RegisterPatientDialog } from "@/components/patients/RegisterPatientDialog";
import { OpdRegistrationDialog } from "@/components/patients/OpdRegistrationDialog";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useDoctorPatients, useCurrentDoctorEntityId } from "@/hooks/query/useDoctors";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { DoctorPatientsView } from "./_components/DoctorPatientsView";
import {
  computeDoctorPatientsStats,
  extractAppointments,
  extractPaginationMeta,
  extractPatients,
  matchesLastVisitRange,
  patientSummaryLine,
  toDoctorPatientRow,
} from "./_components/doctorPatients.logic";

type DoctorPatientsState = {
  searchTerm: string;
  /** Last-visit range, ISO days; empty = no bound. */
  dateFrom: string;
  dateTo: string;
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
  | { type: "set_date_range"; from: string; to: string }
  | { type: "set_page"; value: number }
  | { type: "set_prescribe_target"; value: DoctorPatientsState["prescribeTarget"] };

const initialDoctorPatientsState: DoctorPatientsState = {
  searchTerm: "",
  dateFrom: "",
  dateTo: "",
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
    case "set_date_range":
      return { ...state, dateFrom: action.from, dateTo: action.to, page: 1 };
    case "set_page":
      return { ...state, page: action.value };
    case "set_prescribe_target":
      return { ...state, prescribeTarget: action.value };
    default:
      return state;
  }
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
  const { dateFrom, dateTo, page, prescribeTarget } = state;
  const hasLastVisitRange = Boolean(dateFrom || dateTo);
  // The last-visit range is applied on the client, so pull a wider page when that filter is on.
  const fetchLimit = hasLastVisitRange ? 200 : PAGE_SIZE;
  const fetchOffset = hasLastVisitRange ? 0 : (page - 1) * PAGE_SIZE;

  // GET /clinics/:id/doctors/:doctorUserId/patients reads `search` (name, phone, e-mail), `limit`
  // and `offset` only. It has no gender or age filter, so the screen offers none.
  const patientsQuery = useDoctorPatients(
    clinicId || "",
    {
      search: debouncedSearchTerm,
      limit: fetchLimit,
      offset: fetchOffset,
    },
    { enabled: !!clinicId }
  );
  const patientsPage = useMemo(() => extractPaginationMeta(patientsQuery.data, PAGE_SIZE), [patientsQuery.data]);
  const rows = useMemo(() => {
    const mapped = extractPatients(patientsQuery.data).map((patient) => toDoctorPatientRow(patient));
    if (!hasLastVisitRange) return mapped;
    return mapped.filter((row) => matchesLastVisitRange(row, dateFrom, dateTo));
  }, [patientsQuery.data, hasLastVisitRange, dateFrom, dateTo]);
  const pagedRows = useMemo(() => {
    if (!hasLastVisitRange) return rows;
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, hasLastVisitRange, page]);
  const displayTotal = hasLastVisitRange ? rows.length : patientsPage.total || rows.length;
  const displayTotalPages = hasLastVisitRange
    ? Math.max(1, Math.ceil(rows.length / PAGE_SIZE) || 1)
    : patientsPage.totalPages;
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
    () => computeDoctorPatientsStats(extractAppointments(appointmentsData)),
    [appointmentsData]
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
        rows={pagedRows}
        totalPatients={totalPatientsCount}
        stats={stats}
        page={page}
        totalPages={displayTotalPages}
        pageSize={PAGE_SIZE}
        onPageChange={(nextPage) => dispatch({ type: "set_page", value: nextPage })}
        searchTerm={state.searchTerm}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onSearchChange={(value) => dispatch({ type: "set_search_term", value })}
        onDateRangeChange={(from, to) => dispatch({ type: "set_date_range", from, to })}
        onPrescribe={(row) =>
          dispatch({
            type: "set_prescribe_target",
            value: { id: row.id, name: row.name, summary: patientSummaryLine(row) },
          })
        }
        actions={headerActions}
      />

      {prescriptionDialog}
    </>
  );
}
