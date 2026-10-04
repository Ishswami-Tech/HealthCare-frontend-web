"use client";

import { useCallback, useMemo, useReducer } from "react";
import {
  createBatchRow,
  createDispenseLine,
  type DispenseBatchRow,
  type DispenseLineState,
  type PrescriptionRow,
} from "./pharmacist-prescriptions.logic";

type PharmacistPrescriptionsState = {
  searchTerm: string;
  statusFilter: string;
  auditStartDate: string;
  auditEndDate: string;
  auditSearchTerm: string;
  selectedPrescription: PrescriptionRow | null;
  dispenseLines: DispenseLineState[];
  dispenseNotes: string;
  dispenseFormError: string | null;
  selectedReversalPrescription: PrescriptionRow | null;
  reversalReason: string;
  reversalError: string | null;
};

type PharmacistPrescriptionsAction =
  | { type: "setSearchTerm"; value: string }
  | { type: "setStatusFilter"; value: string }
  | { type: "setAuditStartDate"; value: string }
  | { type: "setAuditEndDate"; value: string }
  | { type: "setAuditSearchTerm"; value: string }
  | { type: "openDispenseDialog"; value: PrescriptionRow }
  | { type: "updateDispenseLines"; value: (current: DispenseLineState[]) => DispenseLineState[] }
  | { type: "setDispenseNotes"; value: string }
  | { type: "setDispenseFormError"; value: string | null }
  | { type: "openReverseDialog"; value: PrescriptionRow }
  | { type: "setReversalReason"; value: string }
  | { type: "setReversalError"; value: string | null }
  | { type: "resetDispenseDialog" }
  | { type: "resetReverseDialog" };

const initialState: PharmacistPrescriptionsState = {
  searchTerm: "",
  statusFilter: "all",
  auditStartDate: "",
  auditEndDate: "",
  auditSearchTerm: "",
  selectedPrescription: null,
  dispenseLines: [],
  dispenseNotes: "",
  dispenseFormError: null,
  selectedReversalPrescription: null,
  reversalReason: "",
  reversalError: null,
};

function reducer(
  state: PharmacistPrescriptionsState,
  action: PharmacistPrescriptionsAction,
): PharmacistPrescriptionsState {
  switch (action.type) {
    case "setSearchTerm":
      return { ...state, searchTerm: action.value };
    case "setStatusFilter":
      return { ...state, statusFilter: action.value };
    case "setAuditStartDate":
      return { ...state, auditStartDate: action.value };
    case "setAuditEndDate":
      return { ...state, auditEndDate: action.value };
    case "setAuditSearchTerm":
      return { ...state, auditSearchTerm: action.value };
    case "openDispenseDialog":
      return {
        ...state,
        selectedPrescription: action.value,
        dispenseLines: action.value.medicines.map(createDispenseLine),
        dispenseNotes: "",
        dispenseFormError: null,
      };
    case "updateDispenseLines":
      return { ...state, dispenseLines: action.value(state.dispenseLines), dispenseFormError: null };
    case "setDispenseNotes":
      return { ...state, dispenseNotes: action.value };
    case "setDispenseFormError":
      return { ...state, dispenseFormError: action.value };
    case "openReverseDialog":
      return {
        ...state,
        selectedReversalPrescription: action.value,
        reversalReason: "",
        reversalError: null,
      };
    case "setReversalReason":
      return { ...state, reversalReason: action.value, reversalError: null };
    case "setReversalError":
      return { ...state, reversalError: action.value };
    case "resetDispenseDialog":
      return {
        ...state,
        selectedPrescription: null,
        dispenseLines: [],
        dispenseNotes: "",
        dispenseFormError: null,
      };
    case "resetReverseDialog":
      return {
        ...state,
        selectedReversalPrescription: null,
        reversalReason: "",
        reversalError: null,
      };
    default:
      return state;
  }
}

export type LineField = "substituteMedicineId" | "substitutionReason";

/**
 * Client state of the prescriptions screen: the filters and the two dialogs (the dispense
 * form with its batch rows, and the reversal reason). No fetching and no mutations — the
 * data container adds those.
 */
export function usePharmacistPrescriptionsState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo(() => {
    const updateLine = (medicineIndex: number, change: (line: DispenseLineState) => DispenseLineState) =>
      dispatch({
        type: "updateDispenseLines",
        value: (current) =>
          current.map((line, lineIndex) => (lineIndex !== medicineIndex ? line : change(line))),
      });

    return {
      setSearchTerm: (value: string) => dispatch({ type: "setSearchTerm", value }),
      setStatusFilter: (value: string) => dispatch({ type: "setStatusFilter", value }),
      setAuditStartDate: (value: string) => dispatch({ type: "setAuditStartDate", value }),
      setAuditEndDate: (value: string) => dispatch({ type: "setAuditEndDate", value }),
      setAuditSearchTerm: (value: string) => dispatch({ type: "setAuditSearchTerm", value }),

      setDispenseNotes: (value: string) => dispatch({ type: "setDispenseNotes", value }),
      setDispenseFormError: (value: string | null) => dispatch({ type: "setDispenseFormError", value }),
      closeDispenseDialog: () => dispatch({ type: "resetDispenseDialog" }),

      updateBatchRow: (
        medicineIndex: number,
        batchIndex: number,
        field: keyof Omit<DispenseBatchRow, "id">,
        value: string,
      ) =>
        updateLine(medicineIndex, (line) => ({
          ...line,
          batches: line.batches.map((batch, currentBatchIndex) =>
            currentBatchIndex !== batchIndex ? batch : { ...batch, [field]: value },
          ),
        })),
      addBatchRow: (medicineIndex: number) =>
        updateLine(medicineIndex, (line) => ({ ...line, batches: [...line.batches, createBatchRow()] })),
      removeBatchRow: (medicineIndex: number, batchIndex: number) =>
        updateLine(medicineIndex, (line) =>
          line.batches.length === 1
            ? line
            : {
                ...line,
                batches: line.batches.filter((_, currentBatchIndex) => currentBatchIndex !== batchIndex),
              },
        ),
      updateLineField: (medicineIndex: number, field: LineField, value: string) =>
        updateLine(medicineIndex, (line) => ({ ...line, [field]: value })),
      /** Back to the prescribed medicine: the substitute and its reason are dropped. */
      clearSubstitute: (medicineIndex: number) =>
        updateLine(medicineIndex, (line) => ({ ...line, substituteMedicineId: "", substitutionReason: "" })),

      setReversalReason: (value: string) => dispatch({ type: "setReversalReason", value }),
      setReversalError: (value: string | null) => dispatch({ type: "setReversalError", value }),
      closeReverseDialog: () => dispatch({ type: "resetReverseDialog" }),
    };
  }, []);

  /** Opens the dispense form. A prescription that is not paid for cannot be dispensed. */
  const openDispenseDialog = useCallback((prescription: PrescriptionRow) => {
    if (!prescription.canDispense) return;
    dispatch({ type: "openDispenseDialog", value: prescription });
  }, []);

  const openReverseDialog = useCallback((prescription: PrescriptionRow) => {
    dispatch({ type: "openReverseDialog", value: prescription });
  }, []);

  return { state, actions, openDispenseDialog, openReverseDialog };
}

export type PharmacistPrescriptionsActions = ReturnType<typeof usePharmacistPrescriptionsState>["actions"];
