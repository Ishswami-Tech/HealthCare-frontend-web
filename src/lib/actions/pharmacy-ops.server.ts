"use server";

import { API_ENDPOINTS } from "../config/config";
import { actionFailure, actionSuccess, type ActionResult } from "./_shared";
import { clinicOpsRequest } from "./_ops-request";
import { asRecordOrEmpty, isoDateOrNull, numberOrNull, unwrapRecords } from "@/lib/utils/coerce";
import type {
  BatchAction,
  BatchActionInput,
  BatchActionResult,
  BatchMovementAuditEntry,
  ConfirmHandoverInput,
  HandoverCode,
  HandoverStatus,
  PharmacyHandover,
  ReorderRuleInput,
  ReorderStrategy,
  ReorderSuggestion,
} from "@/types/pharmacy-ops.types";

/**
 * Server actions of the pharmacy-ops routes (API_CONTRACT 8 and 12): batch audit, return to
 * supplier, discard, the verified counter hand-over, and reorder rules. PHARMACIST and
 * CLINIC_ADMIN.
 *
 * The clinic comes from the session (`clinicOpsRequest` -> `resolveClinicContext`), never from
 * the browser, and every action returns an `ActionResult` instead of throwing, so the backend
 * message ("That code does not match", "Too many wrong codes ...") survives a production build.
 */

/** Maps the data of a successful result, passing a failure through untouched. */
function mapResult<T, R>(result: ActionResult<T>, map: (data: T) => R): ActionResult<R> {
  return result.success ? actionSuccess(map(result.data)) : result;
}

const invalid = (message: string) => actionFailure(message, "UNKNOWN");

const asRecord = asRecordOrEmpty;
const toNumber = (value: unknown, fallback = 0) => numberOrNull(value) ?? fallback;
const toNullableNumber = numberOrNull;
function toIso(value: unknown): string | null {
  const iso = isoDateOrNull(value);
  return iso ? new Date(iso).toISOString() : null;
}
function listOf(value: unknown, key: string): Record<string, unknown>[] {
  const direct = unwrapRecords(value, key, "data");
  return direct.length > 0 ? direct : unwrapRecords(asRecord(value).data, key);
}

function normalizeHandover(raw: Record<string, unknown>): PharmacyHandover {
  const status = String(raw.status ?? "PENDING_VERIFICATION").toUpperCase();
  const method = String(raw.method ?? "").toUpperCase();
  return {
    id: String(raw.id ?? ""),
    prescriptionId: String(raw.prescriptionId ?? ""),
    status: (status === "HANDED_OVER" || status === "UNDONE" ? status : "PENDING_VERIFICATION") as HandoverStatus,
    method: method === "QR" || method === "OTP" ? method : null,
    verified: Boolean(raw.verified),
    verifiedAt: toIso(raw.verifiedAt),
    patientName: String(raw.patientName ?? ""),
    items: (Array.isArray(raw.items) ? raw.items : []).map(asRecord).map((item) => ({
      prescriptionItemId: String(item.prescriptionItemId ?? item.id ?? ""),
      medicineName: String(item.medicineName ?? ""),
      dosage: String(item.dosage ?? ""),
      frequency: String(item.frequency ?? ""),
      duration: String(item.duration ?? ""),
      quantity: toNumber(item.quantity),
    })),
    acknowledgedBy: raw.acknowledgedBy ? String(raw.acknowledgedBy) : null,
    handedOverAt: toIso(raw.handedOverAt),
    undoUntil: toIso(raw.undoUntil),
    canUndo: Boolean(raw.canUndo),
    undoneAt: toIso(raw.undoneAt),
  };
}

/** The record of an answer that may come bare or wrapped in `data`. */
function recordOf(value: unknown): Record<string, unknown> {
  const body = asRecord(value);
  return body.id || body.batchId ? body : asRecord(body.data);
}

/** Stock movements of one batch, newest first. Backend: GET /pharmacy-ops/batches/:id/audit. */
export async function getBatchMovementAudit(batchId: string): Promise<ActionResult<BatchMovementAuditEntry[]>> {
  const result = await clinicOpsRequest<unknown>(API_ENDPOINTS.PHARMACY_EXT.BATCH_AUDIT(encodeURIComponent(batchId)), {
    what: "Batch audit",
  });
  return mapResult(result, (data) =>
    listOf(data, "movements").map((entry) => ({
      id: String(entry.id ?? ""),
      at: toIso(entry.at ?? entry.createdAt) ?? "",
      movementType: String(entry.movementType ?? ""),
      quantity: toNumber(entry.quantity),
      reason: entry.reason ? String(entry.reason) : null,
      referenceType: entry.referenceType ? String(entry.referenceType) : null,
      recordedByName: entry.recordedByName ? String(entry.recordedByName) : null,
    })),
  );
}

/**
 * Takes units of a batch out of stock: back to the supplier, or written off as discarded.
 * Backend: POST /pharmacy-ops/batches/:id/return-to-supplier | /discard (PHARMACIST, CLINIC_ADMIN).
 */
export async function applyBatchAction(action: BatchAction, input: BatchActionInput): Promise<ActionResult<BatchActionResult>> {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    return invalid("Enter a whole number of units, at least 1.");
  }
  if (!input.reason.trim()) {
    return invalid("Say why the stock is being taken out.");
  }
  const batchId = encodeURIComponent(input.batchId);
  const endpoint =
    action === "RETURN_TO_SUPPLIER"
      ? API_ENDPOINTS.PHARMACY_EXT.EXPIRY_RETURN(batchId)
      : API_ENDPOINTS.PHARMACY_EXT.EXPIRY_DISCARD(batchId);
  const result = await clinicOpsRequest<unknown>(endpoint, {
    method: "POST",
    what: "Batch update",
    body: {
      quantity: input.quantity,
      reason: input.reason.trim(),
      ...(action === "RETURN_TO_SUPPLIER" && input.supplierId ? { supplierId: input.supplierId } : {}),
    },
  });
  return mapResult(result, (data) => {
    const body = recordOf(data);
    return {
      batchId: String(body.batchId ?? input.batchId),
      action: String(body.action ?? action),
      quantity: toNumber(body.quantity, input.quantity),
      remainingQuantity: toNumber(body.remainingQuantity),
      reason: String(body.reason ?? input.reason),
      at: toIso(body.at) ?? "",
    };
  });
}

/** The hand-over of a prescription, or null before the patient's code was checked. */
export async function getPrescriptionHandover(prescriptionId: string): Promise<ActionResult<PharmacyHandover | null>> {
  const result = await clinicOpsRequest<unknown>(API_ENDPOINTS.PHARMACY_EXT.HANDOVER_GET(encodeURIComponent(prescriptionId)), {
    what: "Hand-over",
  });
  return mapResult(result, (data) => {
    const body = recordOf(data);
    return body.id ? normalizeHandover(body) : null;
  });
}

/**
 * PATIENT: a fresh 6-digit code (and QR) to collect the medicines of a paid, dispensed
 * prescription. Asking again replaces the previous code. A 409 says why it is not ready yet.
 * Backend: POST /pharmacy-ops/prescriptions/:id/handover/code.
 */
export async function issuePrescriptionHandoverCode(prescriptionId: string): Promise<ActionResult<HandoverCode>> {
  if (!prescriptionId) return invalid("Choose a prescription.");
  const result = await clinicOpsRequest<unknown>(API_ENDPOINTS.PHARMACY_EXT.HANDOVER_CODE(encodeURIComponent(prescriptionId)), {
    method: "POST",
    what: "Collection code",
  });
  return mapResult(result, (data) => {
    const body = asRecord(data);
    const record = body.code || body.handoverId ? body : asRecord(body.data);
    const qrImage = typeof record.qrImage === "string" && record.qrImage.startsWith("data:image/") ? record.qrImage : null;
    return {
      handoverId: String(record.handoverId ?? ""),
      code: String(record.code ?? ""),
      qrPayload: String(record.qrPayload ?? ""),
      qrImage,
      expiresAt: toIso(record.expiresAt),
    };
  });
}

/**
 * Checks the 6-digit code the patient shows (typed, or read from the QR `TBD-HO:<id>:<code>`).
 * Backend: POST /pharmacy-ops/prescriptions/:id/handover/verify. 5 wrong tries lock it.
 */
export async function verifyPrescriptionHandover(
  prescriptionId: string,
  input: { code: string; method: "QR" | "OTP" },
): Promise<ActionResult<PharmacyHandover>> {
  if (!/^\d{6}$/.test(input.code)) {
    return invalid("Enter the 6-digit code from the patient's app.");
  }
  const result = await clinicOpsRequest<unknown>(API_ENDPOINTS.PHARMACY_EXT.HANDOVER_VERIFY(encodeURIComponent(prescriptionId)), {
    method: "POST",
    what: "Code check",
    body: { code: input.code, method: input.method },
  });
  return mapResult(result, (data) => normalizeHandover(recordOf(data)));
}

/** Records the hand-over (items checked, who acknowledged). Backend: POST /pharmacy-ops/handovers/:id/confirm. */
export async function confirmPrescriptionHandover(input: ConfirmHandoverInput): Promise<ActionResult<PharmacyHandover>> {
  if (input.itemChecklist.length === 0) {
    return invalid("There are no medicines to hand over.");
  }
  if (!input.acknowledgedBy.trim()) {
    return invalid("Enter who received the medicines.");
  }
  const result = await clinicOpsRequest<unknown>(API_ENDPOINTS.PHARMACY_EXT.HANDOVER_CONFIRM(encodeURIComponent(input.handoverId)), {
    method: "POST",
    what: "Hand-over",
    body: {
      itemChecklist: input.itemChecklist,
      acknowledgedBy: input.acknowledgedBy.trim(),
      ...(input.signature ? { signature: input.signature } : {}),
    },
  });
  return mapResult(result, (data) => normalizeHandover(recordOf(data)));
}

/** Takes a hand-over back inside its undo window. Stock is not returned (that is reverse-dispense). */
export async function undoPrescriptionHandover(handoverId: string): Promise<ActionResult<PharmacyHandover>> {
  const result = await clinicOpsRequest<unknown>(API_ENDPOINTS.PHARMACY_EXT.HANDOVER_UNDO(encodeURIComponent(handoverId)), {
    method: "POST",
    what: "Hand-over undo",
  });
  return mapResult(result, (data) => normalizeHandover(recordOf(data)));
}

/** Medicines at or below their reorder point under the clinic's rules. Backend: GET /pharmacy/inventory/reorder-evaluation. */
export async function getReorderEvaluation(): Promise<ActionResult<ReorderSuggestion[]>> {
  const result = await clinicOpsRequest<unknown>(API_ENDPOINTS.PHARMACY_EXT.REORDER_EVALUATION, { what: "Reorder evaluation" });
  return mapResult(result, (data) =>
    listOf(data, "suggestions").map((row) => ({
      ruleId: String(row.ruleId ?? ""),
      productId: String(row.productId ?? ""),
      strategy: String(row.strategy ?? "REORDER_POINT").toUpperCase() as ReorderStrategy,
      currentStock: toNumber(row.currentStock),
      reorderPoint: toNumber(row.reorderPoint),
      suggestedQuantity: toNullableNumber(row.suggestedQuantity),
      preferredSupplier: row.preferredSupplier ? String(row.preferredSupplier) : null,
    })),
  );
}

/** Saves a reorder rule for one medicine. Backend: POST /pharmacy/inventory/reorder-rules (PHARMACIST, CLINIC_ADMIN). */
export async function createReorderRule(rule: ReorderRuleInput): Promise<ActionResult<unknown>> {
  if (!rule.productId) return invalid("Choose a medicine.");
  if (!Number.isInteger(rule.reorderPoint) || rule.reorderPoint < 0) {
    return invalid("The reorder level must be a whole number, 0 or more.");
  }
  return clinicOpsRequest<unknown>(API_ENDPOINTS.PHARMACY_EXT.REORDER_RULES, {
    method: "POST",
    what: "Reorder rule",
    body: {
      productId: rule.productId,
      strategy: rule.strategy,
      reorderPoint: rule.reorderPoint,
      ...(rule.orderQuantity !== undefined ? { orderQuantity: rule.orderQuantity } : {}),
      ...(rule.minLevel !== undefined ? { minLevel: rule.minLevel } : {}),
      ...(rule.maxLevel !== undefined ? { maxLevel: rule.maxLevel } : {}),
      ...(rule.preferredSupplier ? { preferredSupplier: rule.preferredSupplier.trim() } : {}),
    },
  });
}
