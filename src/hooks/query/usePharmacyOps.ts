import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { TOAST_IDS } from "../utils/use-toast";
import { STOCK_QUERIES } from "./usePharmacy";
import { dataOrThrow } from "@/lib/utils/action-result";
import {
  applyBatchAction,
  confirmPrescriptionHandover,
  createReorderRule,
  getBatchMovementAudit,
  getPrescriptionHandover,
  getReorderEvaluation,
  issuePrescriptionHandoverCode,
  undoPrescriptionHandover,
  verifyPrescriptionHandover,
} from "@/lib/actions/pharmacy-ops.server";
import type {
  BatchAction,
  BatchActionInput,
  ConfirmHandoverInput,
  ReorderRuleInput,
} from "@/types/pharmacy-ops.types";

/**
 * React Query hooks of the pharmacy-ops routes: expiry batch actions (PhExpiry), the counter
 * hand-over (PhHandover) and reorder rules (PhInventoryAlertSettings, CaInventory).
 *
 * The actions resolve the clinic from the session and return an `ActionResult`; `clinicId` here
 * only keys and enables the queries. `dataOrThrow` keeps the backend message for the UI.
 */

/** Stock movements of one batch (PhExpiry audit trail). */
export const useBatchMovementAudit = (clinicId: string, batchId: string) => {
  return useQueryData(
    ["batchMovementAudit", clinicId, batchId],
    async () => {
      return dataOrThrow(await getBatchMovementAudit(batchId));
    },
    {
      enabled: !!clinicId && !!batchId,
    },
  );
};

/** Return a batch to the supplier or discard it (PhExpiry). */
export const useBatchAction = () => {
  return useMutationOperation(
    async ({ action, ...input }: { action: BatchAction } & BatchActionInput) => {
      return dataOrThrow(await applyBatchAction(action, input));
    },
    {
      toastId: TOAST_IDS.PHARMACY.BATCH_ADJUST,
      loadingMessage: "Updating the batch...",
      successMessage: "Batch updated",
      invalidateQueries: [...STOCK_QUERIES, ["batchMovementAudit"]],
    },
  );
};

const HANDOVER_QUERIES = [["prescriptionHandover"], ["prescriptions"], ["prescription"], ["medicineDeskQueue"]];

/** The hand-over of one prescription (null until the patient's code is checked). */
export const usePrescriptionHandover = (clinicId: string, prescriptionId: string) => {
  return useQueryData(
    ["prescriptionHandover", clinicId, prescriptionId],
    async () => {
      return dataOrThrow(await getPrescriptionHandover(prescriptionId));
    },
    {
      enabled: !!clinicId && !!prescriptionId,
    },
  );
};

/**
 * PATIENT: issues the code to show at the medicine counter. No toasts: the panel shows the
 * code itself and the backend reason ("Collect the payment before ...") inline.
 */
export const useIssueHandoverCode = () => {
  return useMutationOperation(
    async ({ prescriptionId }: { prescriptionId: string }) => {
      return dataOrThrow(await issuePrescriptionHandoverCode(prescriptionId));
    },
    {
      toastId: TOAST_IDS.PHARMACY.PRESCRIPTION_UPDATE,
      loadingMessage: "Getting your code...",
      successMessage: "Code ready",
      showToast: false,
      showLoading: false,
    },
  );
};

export const useVerifyPrescriptionHandover = () => {
  return useMutationOperation(
    async ({ prescriptionId, code, method }: { prescriptionId: string; code: string; method: "QR" | "OTP" }) => {
      return dataOrThrow(await verifyPrescriptionHandover(prescriptionId, { code, method }));
    },
    {
      toastId: TOAST_IDS.PHARMACY.PRESCRIPTION_UPDATE,
      loadingMessage: "Checking the code...",
      successMessage: "Patient verified",
      // The verify step shows the failure inline and moves to the checklist on success.
      showToast: false,
      invalidateQueries: HANDOVER_QUERIES,
    },
  );
};

export const useConfirmPrescriptionHandover = () => {
  return useMutationOperation(
    async (input: ConfirmHandoverInput) => {
      return dataOrThrow(await confirmPrescriptionHandover(input));
    },
    {
      toastId: TOAST_IDS.PHARMACY.PRESCRIPTION_UPDATE,
      loadingMessage: "Recording the hand-over...",
      successMessage: "Medicines handed over",
      // The page shows one "handed over" toast (with Undo while the window is open) and the
      // failure inline, so the hook stays quiet to avoid a second toast.
      showToast: false,
      invalidateQueries: HANDOVER_QUERIES,
    },
  );
};

export const useUndoPrescriptionHandover = () => {
  return useMutationOperation(
    async ({ handoverId }: { handoverId: string }) => {
      return dataOrThrow(await undoPrescriptionHandover(handoverId));
    },
    {
      toastId: TOAST_IDS.PHARMACY.PRESCRIPTION_UPDATE,
      loadingMessage: "Undoing the hand-over...",
      successMessage: "Hand-over undone",
      invalidateQueries: HANDOVER_QUERIES,
    },
  );
};

/** What the reorder rules would order now (alert settings, clinic admin inventory). */
export const useReorderEvaluation = (clinicId: string, enabled: boolean = true) => {
  return useQueryData(
    ["reorderEvaluation", clinicId],
    async () => {
      return dataOrThrow(await getReorderEvaluation());
    },
    {
      enabled: !!clinicId && enabled,
    },
  );
};

export const useCreateReorderRule = () => {
  return useMutationOperation(
    async (rule: ReorderRuleInput) => {
      return dataOrThrow(await createReorderRule(rule));
    },
    {
      toastId: TOAST_IDS.PHARMACY.INVENTORY_UPDATE,
      loadingMessage: "Saving the reorder rule...",
      successMessage: "Reorder rule saved",
      invalidateQueries: [["reorderEvaluation"], ["inventoryAlerts"]],
    },
  );
};
