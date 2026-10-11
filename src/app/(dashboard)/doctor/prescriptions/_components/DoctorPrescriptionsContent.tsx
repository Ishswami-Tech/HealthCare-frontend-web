"use client";

import { useMemo, useReducer } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHydrated } from "@/hooks/utils/useHydrated";
import { showInfoToast } from "@/hooks/utils/use-toast";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useCurrentDoctorEntityId } from "@/hooks/query/useDoctors";
import { usePrescriptions as useClinicPrescriptions } from "@/hooks/query/usePharmacy";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import { DoctorPrescriptionsView } from "./DoctorPrescriptionsView";
import {
  buildDoctorPrescriptionStats,
  filterDoctorPrescriptions,
  isPrescriptionByDoctor,
  normalizeDoctorPrescriptions,
  type DoctorPrescriptionFilter,
} from "./doctor-prescriptions.logic";

type DoctorPrescriptionsState = {
  searchQuery: string;
  filterStatus: DoctorPrescriptionFilter;
};

type DoctorPrescriptionsAction =
  | { type: "setSearchQuery"; value: string }
  | { type: "setFilterStatus"; value: DoctorPrescriptionFilter };

const initialDoctorPrescriptionsState: DoctorPrescriptionsState = {
  searchQuery: "",
  filterStatus: "all",
};

function doctorPrescriptionsReducer(
  state: DoctorPrescriptionsState,
  action: DoctorPrescriptionsAction,
): DoctorPrescriptionsState {
  switch (action.type) {
    case "setSearchQuery":
      return { ...state, searchQuery: action.value };
    case "setFilterStatus":
      return { ...state, filterStatus: action.value };
    default:
      return state;
  }
}

/**
 * Data container for the doctor's prescriptions screen: hooks here, layout in the view.
 *
 * The backend lets a doctor LIST prescriptions (GET /pharmacy/prescriptions) and CREATE one
 * (POST /pharmacy/prescriptions, through `QuickPrescriptionModal` on a patient). It has no
 * edit, cancel, delete or PDF for a doctor, so a saved prescription is read-only here; the
 * medicine desk marks it dispensed or cancelled.
 */
export function DoctorPrescriptionsContent() {
  const { push } = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const doctorUserId = user?.id || "";
  const { clinicId } = useClinicContext();
  // A prescription carries the Doctor record id, not the signed-in user's id.
  const { doctorId: doctorEntityId } = useCurrentDoctorEntityId(clinicId || "");

  const [{ searchQuery, filterStatus }, dispatch] = useReducer(
    doctorPrescriptionsReducer,
    initialDoctorPrescriptionsState,
  );

  const isHydrated = useHydrated();
  const todayDate = isHydrated ? formatDateKeyInIST(new Date()) : "";

  // `GET /pharmacy/prescriptions` answers with every prescription of the clinic as a plain
  // list (the same request the pharmacy screens use); this doctor's own are picked below.
  const {
    data: prescriptionsData,
    isPending,
    error,
    refetch,
  } = useClinicPrescriptions(clinicId || "");

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  const prescriptions = useMemo(() => {
    const ownIds = [doctorUserId, doctorEntityId].filter(Boolean);
    const all = Array.isArray(prescriptionsData) ? prescriptionsData : [];
    return normalizeDoctorPrescriptions(all.filter((prescription) => isPrescriptionByDoctor(prescription, ownIds)));
  }, [doctorEntityId, doctorUserId, prescriptionsData]);
  const filteredPrescriptions = useMemo(
    () => filterDoctorPrescriptions(prescriptions, searchQuery, filterStatus),
    [prescriptions, searchQuery, filterStatus],
  );
  const stats = useMemo(() => buildDoctorPrescriptionStats(prescriptions, todayDate), [prescriptions, todayDate]);

  // A prescription belongs to a patient and is written from the pharmacy stock list, so a new
  // one starts from the patient list: "Prescribe" on a patient opens the prescribing dialog.
  const openCreate = () => {
    showInfoToast("Choose the patient, then press Prescribe.");
    push("/doctor/patients");
  };

  // Without a clinic the list request never starts, so it must not look like loading.
  const showSkeleton = Boolean(clinicId) && isPending && prescriptions.length === 0;
  const loadFailed = Boolean(error) && prescriptions.length === 0;

  return (
    <DoctorPrescriptionsView
      isLoading={showSkeleton}
      loadFailed={loadFailed}
      onRetry={() => void refetch()}
      prescriptions={filteredPrescriptions}
      hasAnyPrescription={prescriptions.length > 0}
      stats={stats}
      searchQuery={searchQuery}
      filterStatus={filterStatus}
      onSearchChange={(value) => dispatch({ type: "setSearchQuery", value })}
      onFilterChange={(value) => dispatch({ type: "setFilterStatus", value })}
      onCreate={openCreate}
    />
  );
}
