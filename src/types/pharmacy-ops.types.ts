/**
 * Types of the pharmacy-ops routes (API_CONTRACT sections 8 and 12): expiry batch actions,
 * the verified counter hand-over, and reorder rules.
 */

/** One stock movement of a batch (`GET /pharmacy-ops/batches/:id/audit`). */
export interface BatchMovementAuditEntry {
  id: string;
  at: string;
  /** PURCHASE_IN, DISPENSE, ADJUSTMENT, RETURN_TO_SUPPLIER, DISCARD_WRITE_OFF, ... */
  movementType: string;
  quantity: number;
  reason: string | null;
  referenceType: string | null;
  recordedByName: string | null;
}

export type BatchAction = "RETURN_TO_SUPPLIER" | "DISCARD";

export interface BatchActionInput {
  batchId: string;
  quantity: number;
  reason: string;
  supplierId?: string;
}

/** Answer of the return-to-supplier and discard routes. */
export interface BatchActionResult {
  batchId: string;
  action: string;
  quantity: number;
  remainingQuantity: number;
  reason: string;
  at: string;
}

export type HandoverStatus = "PENDING_VERIFICATION" | "HANDED_OVER" | "UNDONE";

export interface HandoverItem {
  prescriptionItemId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

/** Verified physical hand-over at the counter, on top of the dispense (`/pharmacy-ops`). */
export interface PharmacyHandover {
  id: string;
  prescriptionId: string;
  status: HandoverStatus;
  method: "QR" | "OTP" | null;
  verified: boolean;
  verifiedAt: string | null;
  patientName: string;
  items: HandoverItem[];
  acknowledgedBy: string | null;
  handedOverAt: string | null;
  undoUntil: string | null;
  canUndo: boolean;
  undoneAt: string | null;
}

/** The one-time code the patient shows at the counter (`POST /pharmacy-ops/prescriptions/:id/handover/code`). */
export interface HandoverCode {
  handoverId: string;
  /** 6 digits; only its hash is stored, so it is shown once. */
  code: string;
  /** Text behind the QR: `TBD-HO:<handoverId>:<code>`. */
  qrPayload: string;
  /** A ready-made QR picture (data URL) when the API sends one; null otherwise. */
  qrImage: string | null;
  expiresAt: string | null;
}

export interface ConfirmHandoverInput {
  handoverId: string;
  itemChecklist: Array<{ prescriptionItemId: string; handedOver: boolean }>;
  acknowledgedBy: string;
  signature?: string;
}

export type ReorderStrategy = "FIXED_QTY" | "MIN_MAX" | "REORDER_POINT";

export interface ReorderRuleInput {
  productId: string;
  strategy: ReorderStrategy;
  reorderPoint: number;
  orderQuantity?: number;
  minLevel?: number;
  maxLevel?: number;
  preferredSupplier?: string;
}

/** A medicine at or below its reorder point (`GET /pharmacy/inventory/reorder-evaluation`). */
export interface ReorderSuggestion {
  ruleId: string;
  productId: string;
  strategy: ReorderStrategy;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number | null;
  preferredSupplier: string | null;
}
