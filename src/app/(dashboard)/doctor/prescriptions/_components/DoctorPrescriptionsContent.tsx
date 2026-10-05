"use client";

import { useMemo, useReducer } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHydrated } from "@/hooks/utils/useHydrated";
import { showInfoToast } from "@/hooks/utils/use-toast";
import {
  usePrescriptions,
  useCreatePrescription,
  useUpdatePrescription,
  useDeletePrescription,
} from "@/hooks/query/usePrescriptions";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import type { Prescription } from "@/types/medical-records.types";
import { DoctorPrescriptionsView } from "./DoctorPrescriptionsView";
import {
  EMPTY_PRESCRIPTION_FORM,
  buildDoctorPrescriptionStats,
  filterDoctorPrescriptions,
  normalizeDoctorPrescriptions,
  parseMedicineList,
  type DoctorPrescriptionEditForm,
  type DoctorPrescriptionFilter,
  type DoctorPrescriptionRow,
} from "./doctor-prescriptions.logic";

type DoctorPrescriptionsState = {
  searchQuery: string;
  filterStatus: DoctorPrescriptionFilter;
  editingPrescription: DoctorPrescriptionRow | null;
  showPrescriptionDialog: boolean;
  editForm: DoctorPrescriptionEditForm;
  deleteTarget: DoctorPrescriptionRow | null;
};

type DoctorPrescriptionsAction =
  | { type: "setSearchQuery"; value: string }
  | { type: "setFilterStatus"; value: DoctorPrescriptionFilter }
  | { type: "openDialog"; prescription: DoctorPrescriptionRow | null; form: DoctorPrescriptionEditForm }
  | { type: "setShowPrescriptionDialog"; value: boolean }
  | { type: "updateEditForm"; value: Partial<DoctorPrescriptionEditForm> }
  | { type: "setDeleteTarget"; value: DoctorPrescriptionRow | null };

const initialDoctorPrescriptionsState: DoctorPrescriptionsState = {
  searchQuery: "",
  filterStatus: "all",
  editingPrescription: null,
  showPrescriptionDialog: false,
  editForm: EMPTY_PRESCRIPTION_FORM,
  deleteTarget: null,
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
    case "openDialog":
      return {
        ...state,
        editingPrescription: action.prescription,
        editForm: action.form,
        showPrescriptionDialog: true,
      };
    case "setShowPrescriptionDialog":
      return { ...state, showPrescriptionDialog: action.value };
    case "updateEditForm":
      return { ...state, editForm: { ...state.editForm, ...action.value } };
    case "setDeleteTarget":
      return { ...state, deleteTarget: action.value };
    default:
      return state;
  }
}

/** Data container for the doctor's prescriptions screen: hooks and mutations here, layout in the view. */
export function DoctorPrescriptionsContent() {
  const { session } = useAuth();
  const user = session?.user;
  const doctorId = user?.id || "";

  const [
    { searchQuery, filterStatus, editingPrescription, showPrescriptionDialog, editForm, deleteTarget },
    dispatch,
  ] = useReducer(doctorPrescriptionsReducer, initialDoctorPrescriptionsState);

  const isHydrated = useHydrated();
  const todayDate = isHydrated ? formatDateKeyInIST(new Date()) : "";

  const { data: prescriptionsData, isPending, error, refetch } = usePrescriptions(doctorId);
  const createMutation = useCreatePrescription();
  const updateMutation = useUpdatePrescription();
  const deleteMutation = useDeletePrescription();

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  const prescriptions = useMemo(
    () => normalizeDoctorPrescriptions(prescriptionsData?.prescriptions),
    [prescriptionsData?.prescriptions],
  );
  const filteredPrescriptions = useMemo(
    () => filterDoctorPrescriptions(prescriptions, searchQuery, filterStatus),
    [prescriptions, searchQuery, filterStatus],
  );
  const stats = useMemo(() => buildDoctorPrescriptionStats(prescriptions, todayDate), [prescriptions, todayDate]);

  const openCreate = () => {
    dispatch({ type: "openDialog", prescription: null, form: EMPTY_PRESCRIPTION_FORM });
  };

  const openEdit = (prescription: DoctorPrescriptionRow) => {
    dispatch({
      type: "openDialog",
      prescription,
      form: {
        diagnosis: prescription.diagnosis,
        notes: prescription.notes,
        status: prescription.status || "active",
        medicines: prescription.medicines.join(", "),
      },
    });
  };

  const handleDownload = (prescription: DoctorPrescriptionRow) => {
    if (prescription.pdfUrl) {
      window.open(prescription.pdfUrl, "_blank", "noopener,noreferrer");
    } else {
      showInfoToast("PDF not available for this prescription");
    }
  };

  const handleSavePrescription = () => {
    const medicinesArr = parseMedicineList(editForm.medicines);

    if (editingPrescription?.id) {
      updateMutation.mutate({
        prescriptionId: editingPrescription.id,
        updates: {
          notes: editForm.notes,
          status: editForm.status,
        },
      });
    } else {
      const newPrescription: Prescription = {
        patientId: "",
        ...(user?.id ? { doctorId: user.id } : {}),
        notes: editForm.notes,
        status: editForm.status,
        medications: medicinesArr.map((name) => ({ name })),
      };
      createMutation.mutate(newPrescription);
    }
    dispatch({ type: "setShowPrescriptionDialog", value: false });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    dispatch({ type: "setDeleteTarget", value: null });
  };

  const showSkeleton = isPending && prescriptions.length === 0;
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
      createDisabled={createMutation.isPending}
      editDisabled={updateMutation.isPending}
      deleteDisabled={deleteMutation.isPending}
      onCreate={openCreate}
      onEdit={openEdit}
      onDownload={handleDownload}
      onDelete={(prescription) => dispatch({ type: "setDeleteTarget", value: prescription })}
      dialogOpen={showPrescriptionDialog}
      dialogMode={editingPrescription ? "edit" : "create"}
      form={editForm}
      isSaving={createMutation.isPending || updateMutation.isPending}
      onFormChange={(value) => dispatch({ type: "updateEditForm", value })}
      onSave={handleSavePrescription}
      onDialogOpenChange={(value) => dispatch({ type: "setShowPrescriptionDialog", value })}
      deleteTarget={deleteTarget}
      isDeleting={deleteMutation.isPending}
      onConfirmDelete={confirmDelete}
      onCancelDelete={() => dispatch({ type: "setDeleteTarget", value: null })}
    />
  );
}
