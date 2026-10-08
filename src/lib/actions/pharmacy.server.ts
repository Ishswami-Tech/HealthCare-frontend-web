"use server";

import { authenticatedApi, getServerSession } from "./auth.server";
import { API_ENDPOINTS } from "../config/config";
import type {
  AdjustBatchStockInput,
  DispensePrescriptionData,
  PharmacyBatchAuditEntry,
  PharmacySalesGroupBy,
  PharmacySalesReport,
  PharmacySalesRow,
  PurchaseOrderPage,
  PurchaseOrderRecord,
  PurchaseOrderStatus,
  ReceiveOrderBatch,
  ReceiveStockBatchInput,
  ReversePrescriptionDispenseData,
  StockAlertRecord,
  StockBatchRecord,
  SupplierInput,
} from "@/types/pharmacy.types";

function parseDateTime(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDaysUntilExpiry(expiryDate: unknown): number | null {
  const expiry = parseDateTime(expiryDate);
  if (!expiry) {
    return null;
  }

  return Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function normalizeMedicineRecord(medicine: Record<string, unknown>) {
  const stockQuantity = Number(
    medicine.stockQuantity ??
      medicine.stock ??
      medicine.currentStock ??
      medicine.quantity ??
      0,
  );
  const minStockLevel = Number(
    medicine.minStockLevel ??
      medicine.minStockThreshold ??
      medicine.minStock ??
      0,
  );
  const price = Number(medicine.unitPrice ?? medicine.price ?? 0);
  const daysToExpiry = getDaysUntilExpiry(medicine.expiryDate);

  return {
    ...medicine,
    stockQuantity,
    currentStock: stockQuantity,
    minStockLevel,
    minStockThreshold: minStockLevel,
    maxStockLevel: Number(medicine.maxStockLevel ?? medicine.maxStock ?? 0),
    unitPrice: price,
    price,
    packSize: Number(medicine.packSize ?? 1),
    dosageForm: String(medicine.dosageForm ?? medicine.dosage ?? "Units"),
    category: String(medicine.category ?? medicine.type ?? "General"),
    prescriptionRequired: Boolean(medicine.prescriptionRequired ?? false),
    expiryDate: medicine.expiryDate ? String(medicine.expiryDate) : null,
    isExpiringSoon:
      typeof daysToExpiry === "number" ? daysToExpiry <= 90 : false,
    daysToExpiry,
    status:
      stockQuantity <= 0
        ? "Out of Stock"
        : stockQuantity <= minStockLevel
          ? stockQuantity <= Math.max(1, Math.floor(minStockLevel * 0.5))
            ? "Critical"
            : "Low Stock"
          : "In Stock",
  };
}

/** Values `POST /pharmacy/inventory` accepts for `type` (backend `CreateMedicineDto`). */
const BACKEND_MEDICINE_TYPES = [
  "TABLET",
  "SYRUP",
  "CAPSULE",
  "INJECTION",
  "CREAM",
  "DROPS",
  "OTHER",
] as const;

function toBackendMedicineType(value: unknown): (typeof BACKEND_MEDICINE_TYPES)[number] {
  const upper = String(value ?? "").trim().toUpperCase();
  return BACKEND_MEDICINE_TYPES.find((type) => type === upper) ?? "OTHER";
}

/** One CSV cell: quoted when needed; a leading formula character is neutralised. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let cell = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(cell) && Number.isNaN(Number(cell))) cell = `'${cell}`;
  return /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function unwrapRecords(value: unknown, key: string): Record<string, unknown>[] {
  const list = Array.isArray(value) ? value : asRecord(value)[key];
  return Array.isArray(list) ? list.map(asRecord) : [];
}

function dayKey(value: unknown): string {
  const parsed = parseDateTime(value);
  return parsed ? parsed.toISOString().slice(0, 10) : "";
}

async function requireSession() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return session;
}

function scoped(clinicId?: string) {
  return clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {};
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIso(value: unknown): string | null {
  const parsed = parseDateTime(value);
  return parsed ? parsed.toISOString() : null;
}

/** The record list of a paged or plain list response (`[]`, `{ data: [] }`, `{ <key>: [] }`). */
function listOf(value: unknown, key: string): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map(asRecord);
  const body = asRecord(value);
  const nested = asRecord(body.data);
  const list = [body[key], body.data, nested[key], nested.data].find(Array.isArray);
  return Array.isArray(list) ? list.map(asRecord) : [];
}

function normalizePurchaseOrder(raw: Record<string, unknown>): PurchaseOrderRecord {
  const items = Array.isArray(raw.items) ? raw.items.map(asRecord) : [];
  return {
    id: String(raw.id ?? ""),
    poNumber: String(raw.poNumber ?? ""),
    supplierId: String(raw.supplierId ?? ""),
    clinicId: String(raw.clinicId ?? ""),
    status: String(raw.status ?? "DRAFT").toUpperCase() as PurchaseOrderStatus,
    notes: raw.notes ? String(raw.notes) : null,
    expectedDeliveryDate: toIso(raw.expectedDeliveryDate),
    sentAt: toIso(raw.sentAt),
    totalAmount: toNumber(raw.totalAmount),
    createdAt: toIso(raw.createdAt) ?? "",
    items: items.map((item) => ({
      id: String(item.id ?? ""),
      productId: String(item.productId ?? ""),
      description: item.description ? String(item.description) : null,
      quantity: toNumber(item.quantity),
      receivedQuantity: toNumber(item.receivedQuantity),
      unitPrice: toNullableNumber(item.unitPrice),
      lineTotal: toNumber(item.lineTotal),
    })),
  };
}

function normalizeBatch(raw: Record<string, unknown>): StockBatchRecord {
  return {
    id: String(raw.id ?? ""),
    productId: String(raw.productId ?? ""),
    lotNumber: String(raw.lotNumber ?? ""),
    manufactureDate: toIso(raw.manufactureDate),
    expiryDate: toIso(raw.expiryDate) ?? "",
    quantityOnHand: toNumber(raw.quantityOnHand),
    quantityReceived: toNumber(raw.quantityReceived),
    costPrice: toNullableNumber(raw.costPrice),
    medicineName: raw.medicineName ? String(raw.medicineName) : null,
    createdAt: toIso(raw.createdAt) ?? "",
  };
}

// ===== PHARMACY MANAGEMENT ACTIONS =====

/**
 * Get all medicines for a clinic
 */
export async function getMedicines(
  clinicId: string,
  filters?: {
    search?: string;
    category?: string;
    manufacturer?: string;
    inStock?: boolean;
    lowStock?: boolean;
    expiringSoon?: boolean;
    prescriptionRequired?: boolean;
    expiringDays?: number;
    limit?: number;
    offset?: number;
  },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  // Backend: GET /pharmacy/inventory (clinic-scoped via guard)
  const endpoint = `/pharmacy/inventory${params.toString() ? `?${params.toString()}` : ""}`;
  try {
    const { data } = await authenticatedApi(endpoint, {
      ...(clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {}),
    });
    return Array.isArray(data) ? data.map(normalizeMedicineRecord) : data;
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as { statusCode?: number }).statusCode : undefined;
    if (statusCode === 403) {
      return [];
    }
    throw error;
  }
}

/**
 * Get medicine by ID
 */
export async function getMedicineById(medicineId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // The backend has no GET /pharmacy/inventory/:id (only PATCH), so read the
  // clinic list (GET /pharmacy/inventory) and pick the medicine from it.
  const { data } = await authenticatedApi("/pharmacy/inventory");
  const match = Array.isArray(data)
    ? data.find((medicine) => asRecord(medicine).id === medicineId)
    : null;
  return match ? normalizeMedicineRecord(asRecord(match)) : null;
}

/**
 * Create medicine for a clinic
 */
export async function createMedicine(
  clinicId: string,
  medicineData: {
    name: string;
    manufacturer: string;
    /** Sent as `type`: TABLET, SYRUP, CAPSULE, INJECTION, CREAM, DROPS or OTHER. */
    dosageForm: string;
    unitPrice: number;
    /** Not sent: a new medicine starts at 0 and receives stock as batches. */
    stockQuantity?: number;
    expiryDate: string;
    minStockLevel?: number;
    description?: string;
    /** Dosage instructions ("1 tablet twice a day"). */
    instructions?: string;
    supplierId?: string;
    // Not stored by the backend yet (CreateMedicineDto has no such fields) — accepted
    // so older call sites keep compiling, never sent.
    genericName?: string;
    category?: string;
    strength?: string;
    packSize?: number;
    maxStockLevel?: number;
    batchNumber?: string;
    prescriptionRequired?: boolean;
    sideEffects?: string[];
    contraindications?: string[];
    storageConditions?: string;
  },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Backend: POST /pharmacy/inventory (clinic-scoped via guard). The API rejects
  // unknown fields, so only the CreateMedicineDto fields are sent.
  const { data } = await authenticatedApi("/pharmacy/inventory", {
    method: "POST",
    body: JSON.stringify({
      name: medicineData.name,
      manufacturer: medicineData.manufacturer,
      description: medicineData.description ?? "",
      type: toBackendMedicineType(medicineData.dosageForm),
      // A new medicine starts empty: stock arrives as a batch (receive stock or a purchase
      // order receipt). An opening quantity here would exist without a batch to dispense from.
      quantity: 0,
      price: medicineData.unitPrice,
      expiryDate: medicineData.expiryDate,
      ...(medicineData.minStockLevel !== undefined
        ? { minStockThreshold: medicineData.minStockLevel }
        : {}),
      ...(medicineData.supplierId ? { supplierId: medicineData.supplierId } : {}),
      ...(medicineData.instructions ? { instructions: medicineData.instructions } : {}),
    }),
    ...(clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {}),
  });
  return data;
}

/**
 * Update medicine
 */
export async function updateMedicine(
  clinicId: string,
  medicineId: string,
  updates: {
    /** New price per unit. */
    unitPrice?: number;
    // Not editable on the backend yet (UpdateInventoryDto has only quantityChange
    // and price) — accepted so older call sites keep compiling, never sent.
    // Stock is not edited here: it moves through batches (purchase-order receipts,
    // receiveStockBatch, adjustBatchStock) so Medicine.stock and the batches stay equal.
    name?: string;
    genericName?: string;
    manufacturer?: string;
    category?: string;
    dosageForm?: string;
    strength?: string;
    packSize?: number;
    stockQuantity?: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    expiryDate?: string;
    batchNumber?: string;
    prescriptionRequired?: boolean;
    description?: string;
    sideEffects?: string[];
    contraindications?: string[];
    storageConditions?: string;
    isActive?: boolean;
  },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const body = {
    ...(updates.unitPrice !== undefined ? { price: updates.unitPrice } : {}),
  };
  if (Object.keys(body).length === 0) {
    throw new Error('Only the price of a medicine can be changed here.');
  }

  // Backend: PATCH /pharmacy/inventory/:id — sends the price only (quantityChange would move
  // Medicine.stock without a batch, which dispensing then cannot use).
  const { data } = await authenticatedApi(`/pharmacy/inventory/${medicineId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    ...(clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {}),
  });
  return data;
}

/**
 * Delete medicine
 */
export async function deleteMedicine(_clinicId: string, medicineId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Backend: PATCH /pharmacy/inventory/:id with isActive:false (no DELETE endpoint)
  const { data } = await authenticatedApi(`/pharmacy/inventory/${medicineId}`, {
    method: "PATCH",
    body: JSON.stringify({ isActive: false }),
  });
  return data;
}

/**
 * Get prescriptions - uses correct backend endpoints:
 * - Pharmacist: GET /pharmacy/prescriptions (clinicId from x-clinic-id header)
 * - Patient: GET /pharmacy/prescriptions/patient/:userId
 */
export async function getPrescriptions(
  clinicId: string,
  filters?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }

  // Patient view: use /pharmacy/prescriptions/patient/:userId
  if (filters?.patientId) {
    const endpoint = `${API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.GET_BY_PATIENT(filters.patientId)}${params.toString() ? `?${params.toString()}` : ""}`;
    const { data } = await authenticatedApi(endpoint);
    return data;
  }

  // Pharmacist view: GET /pharmacy/prescriptions (clinicId from header)
  const endpoint = `${API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.LIST}${params.toString() ? `?${params.toString()}` : ""}`;
  const { data } = await authenticatedApi(endpoint, {
    headers: clinicId ? { "X-Clinic-ID": clinicId } : {},
  });
  return data;
}

export async function getMedicineDeskQueue(clinicId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(
    API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.QUEUE,
    {
      headers: clinicId ? { "X-Clinic-ID": clinicId } : {},
    },
  );
  return data;
}

/**
 * Get prescription by ID
 */
export async function getPrescriptionById(prescriptionId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(
    API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.GET(prescriptionId),
  );
  return data;
}

/**
 * Create prescription - POST /pharmacy/prescriptions (clinicId from x-clinic-id header)
 */
export async function createPrescription(
  clinicId: string,
  prescriptionData: {
    patientId: string;
    doctorId: string;
    medications: {
      medicineId: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
      quantity: number;
    }[];
    diagnosis?: string;
    notes?: string;
    validUntil?: string;
  },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const items = prescriptionData.medications.map((m) => ({
    medicineId: m.medicineId,
    dosage: m.dosage,
    frequency: m.frequency,
    duration: m.duration,
    quantity: m.quantity,
  }));
  const { data } = await authenticatedApi(
    API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.CREATE,
    {
      method: "POST",
      body: JSON.stringify({
        patientId: prescriptionData.patientId,
        doctorId: prescriptionData.doctorId,
        items,
        notes: prescriptionData.notes,
        diagnosis: prescriptionData.diagnosis,
      }),
      headers: clinicId ? { "X-Clinic-ID": clinicId } : {},
    },
  );
  return data;
}

/**
 * Update prescription status
 */
export async function updatePrescriptionStatus(
  prescriptionId: string,
  status: string,
  notes?: string,
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(
    API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.UPDATE_STATUS(prescriptionId),
    {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    },
  );
  return data;
}

export async function getPrescriptionPaymentSummary(prescriptionId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(
    API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.PAYMENT_SUMMARY(prescriptionId),
  );
  return data;
}

/**
 * Dispense prescription items - supports full or partial fulfillment via backend POST /pharmacy/prescriptions/:id/dispense
 */
export async function dispensePrescription(
  prescriptionId: string,
  dispensingData?: DispensePrescriptionData,
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(
    API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.DISPENSE(prescriptionId),
    {
      method: "POST",
      body: JSON.stringify({
        ...(dispensingData?.dispensedMedications?.length
          ? {
              items: dispensingData.dispensedMedications.map((item) => ({
                medicineId: item.medicineId,
                ...(item.prescriptionItemId
                  ? { prescriptionItemId: item.prescriptionItemId }
                  : {}),
                quantity: item.quantityDispensed,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,
                // A substitute and its reason travel with the line (the API accepts both).
                ...(item.substituteMedicineId
                  ? { substituteMedicineId: item.substituteMedicineId }
                  : {}),
                ...(item.substituteMedicineId && item.substitutionReason
                  ? { substitutionReason: item.substitutionReason }
                  : {}),
              })),
            }
          : {}),
        ...(dispensingData?.dispensedAt
          ? { dispensedAt: dispensingData.dispensedAt }
          : {}),
        ...(dispensingData?.notes ? { notes: dispensingData.notes } : {}),
      }),
    },
  );
  return data;
}

/**
 * Reverse a dispense correction and restore stock
 */
export async function reversePrescriptionDispense(
  prescriptionId: string,
  reversalData: ReversePrescriptionDispenseData,
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(
    API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.REVERSE_DISPENSE(prescriptionId),
    {
      method: "POST",
      body: JSON.stringify(reversalData),
    },
  );
  return data;
}

/**
 * Get batch audit entries for pharmacy operations
 */
export async function getPharmacyBatchAudit(
  clinicId: string,
  filters?: {
    prescriptionId?: string;
    medicineId?: string;
    batchNumber?: string;
    patientId?: string;
    startDate?: string;
    endDate?: string;
  },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, String(value));
      }
    });
  }

  const endpoint = `${API_ENDPOINTS.PHARMACY.AUDIT_BATCHES}${params.toString() ? `?${params.toString()}` : ""}`;
  const { data } = await authenticatedApi(endpoint, {
    ...(clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {}),
  });
  return Array.isArray(data) ? (data as PharmacyBatchAuditEntry[]) : [];
}

/**
 * Get inventory for a clinic
 */
export async function getInventory(
  clinicId: string,
  filters?: {
    lowStock?: boolean;
    expiringSoon?: boolean;
    expiringDays?: number;
    category?: string;
    limit?: number;
  },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  // Backend: GET /pharmacy/inventory (clinic-scoped via guard)
  const endpoint = `/pharmacy/inventory${params.toString() ? `?${params.toString()}` : ""}`;
  const { data } = await authenticatedApi(endpoint, {
    ...(clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {}),
  });
  return Array.isArray(data) ? data.map(normalizeMedicineRecord) : data;
}

/**
 * Purchase orders of the clinic, newest first.
 * Backend: GET /pharmacy/inventory/purchase-orders?status=&limit=&offset= (PHARMACIST, CLINIC_ADMIN).
 */
export async function getPharmacyOrders(
  clinicId: string,
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  },
): Promise<PurchaseOrderPage> {
  await requireSession();

  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.limit !== undefined) {
    params.set("limit", String(Math.min(Math.max(Math.trunc(filters.limit), 1), 200)));
  }
  if (filters?.offset !== undefined) {
    params.set("offset", String(Math.max(Math.trunc(filters.offset), 0)));
  }

  const { data } = await authenticatedApi(
    `/pharmacy/inventory/purchase-orders${params.toString() ? `?${params.toString()}` : ""}`,
    scoped(clinicId),
  );
  const orders = listOf(data, "orders").map(normalizePurchaseOrder);
  const total = toNumber(asRecord(data).total ?? asRecord(asRecord(data).data).total, orders.length);
  return { orders, total };
}

/**
 * One purchase order with its lines.
 * Backend: GET /pharmacy/inventory/purchase-orders/:id
 */
export async function getPharmacyOrderById(
  clinicId: string,
  orderId: string,
): Promise<PurchaseOrderRecord> {
  await requireSession();

  const { data } = await authenticatedApi(
    `/pharmacy/inventory/purchase-orders/${encodeURIComponent(orderId)}`,
    scoped(clinicId),
  );
  const body = asRecord(data);
  return normalizePurchaseOrder(body.id ? body : asRecord(body.data));
}

/**
 * Sends a DRAFT purchase order to the supplier.
 * Backend: POST /pharmacy/inventory/purchase-orders/:id/send
 */
export async function sendPharmacyOrder(
  clinicId: string,
  orderId: string,
): Promise<{ id: string; status: PurchaseOrderStatus; sentAt: string | null }> {
  await requireSession();

  const { data } = await authenticatedApi(
    `/pharmacy/inventory/purchase-orders/${encodeURIComponent(orderId)}/send`,
    { method: "POST", ...scoped(clinicId) },
  );
  const body = asRecord(data);
  const sent = body.id ? body : asRecord(body.data);
  return {
    id: String(sent.id ?? orderId),
    status: String(sent.status ?? "SENT").toUpperCase() as PurchaseOrderStatus,
    sentAt: toIso(sent.sentAt),
  };
}

/**
 * Receives goods against a SENT / PARTIALLY_RECEIVED purchase order: the backend creates the
 * stock batches, the PURCHASE_IN movements and the medicine stock, and moves the order to
 * PARTIALLY_RECEIVED or RECEIVED.
 * Backend: POST /pharmacy/inventory/purchase-orders/:id/receive (PHARMACIST, CLINIC_ADMIN).
 */
export async function receivePharmacyOrder(
  clinicId: string,
  orderId: string,
  batches: ReceiveOrderBatch[],
): Promise<PurchaseOrderRecord> {
  await requireSession();

  if (batches.length === 0) {
    throw new Error('Enter at least one batch that arrived.');
  }

  const { data } = await authenticatedApi(
    `/pharmacy/inventory/purchase-orders/${encodeURIComponent(orderId)}/receive`,
    {
      method: "POST",
      body: JSON.stringify({
        items: batches.map((batch) => ({
          itemId: batch.itemId,
          quantityReceived: batch.quantityReceived,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          ...(batch.manufactureDate ? { manufactureDate: batch.manufactureDate } : {}),
          ...(batch.unitCost !== undefined ? { unitCost: batch.unitCost } : {}),
        })),
      }),
      ...scoped(clinicId),
    },
  );
  const body = asRecord(data);
  return normalizePurchaseOrder(body.id ? body : asRecord(body.data));
}

/**
 * Create pharmacy order for a clinic
 * Backend: POST /pharmacy/inventory/purchase-orders (a purchase order to a supplier)
 */
export async function createPharmacyOrder(
  clinicId: string,
  orderData: {
    supplierId: string;
    items: { medicineId: string; quantity: number; unitPrice?: number }[];
    expectedDeliveryDate?: string;
    notes?: string;
  },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi("/pharmacy/inventory/purchase-orders", {
    method: "POST",
    body: JSON.stringify({
      supplierId: orderData.supplierId,
      ...(orderData.notes ? { notes: orderData.notes } : {}),
      ...(orderData.expectedDeliveryDate
        ? { expectedDeliveryDate: orderData.expectedDeliveryDate }
        : {}),
      items: orderData.items.map((item) => ({
        productId: item.medicineId,
        quantity: item.quantity,
        ...(item.unitPrice !== undefined ? { unitPrice: item.unitPrice } : {}),
      })),
    }),
    ...(clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {}),
  });
  return data;
}

/**
 * Dispensed totals with a per-day or per-medicine breakdown.
 * Backend: GET /pharmacy/sales?from=&to=&groupBy=day|medicine (PHARMACIST, CLINIC_ADMIN).
 * `from` / `to` are inclusive yyyy-mm-dd days (IST); the range may span 366 days at most.
 */
export async function getPharmacySales(
  clinicId: string,
  filters?: {
    from?: string;
    to?: string;
    groupBy?: PharmacySalesGroupBy;
  },
): Promise<PharmacySalesReport> {
  await requireSession();

  const params = new URLSearchParams();
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  if (filters?.groupBy) params.set("groupBy", filters.groupBy);

  const { data } = await authenticatedApi(
    `/pharmacy/sales${params.toString() ? `?${params.toString()}` : ""}`,
    scoped(clinicId),
  );
  const raw = asRecord(data);
  const report = raw.totals ? raw : asRecord(raw.data);
  const totals = asRecord(report.totals);
  const groupBy: PharmacySalesGroupBy = report.groupBy === "medicine" ? "medicine" : "day";
  const breakdown: PharmacySalesRow[] = (Array.isArray(report.breakdown) ? report.breakdown : [])
    .map(asRecord)
    .map((row) => ({
      ...(row.date ? { date: String(row.date) } : {}),
      ...(row.medicineId ? { medicineId: String(row.medicineId) } : {}),
      ...(row.medicineName ? { medicineName: String(row.medicineName) } : {}),
      prescriptions: toNumber(row.prescriptions),
      quantity: toNumber(row.quantity),
      revenue: toNumber(row.revenue),
    }));

  return {
    from: String(report.from ?? filters?.from ?? ""),
    to: String(report.to ?? filters?.to ?? ""),
    groupBy,
    totals: {
      prescriptions: toNumber(totals.prescriptions),
      quantity: toNumber(totals.quantity),
      revenue: toNumber(totals.revenue),
    },
    breakdown,
  };
}

/**
 * Get pharmacy statistics for a clinic
 */
export async function getPharmacyStats(
  clinicId: string,
  period?: "day" | "week" | "month" | "year",
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Backend: GET /pharmacy/stats (clinic-scoped via guard)
  const params = period ? `?period=${period}` : "";
  const { data } = await authenticatedApi(`/pharmacy/stats${params}`, {
    ...(clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {}),
  });
  return data;
}

/**
 * Search medicines for a clinic
 */
export async function searchMedicines(
  clinicId: string,
  query: string,
  filters?: {
    category?: string;
    prescriptionRequired?: boolean;
    inStock?: boolean;
    limit?: number;
  },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const params = new URLSearchParams({ q: query });
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  // Backend: GET /pharmacy/inventory with search query
  const { data } = await authenticatedApi(
    `/pharmacy/inventory?${params.toString()}`,
    {
      ...(clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {}),
    },
  );
  return data;
}

/**
 * Get suppliers
 */
export async function getSuppliers() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.SUPPLIERS);
  return data;
}

function supplierBody(supplier: Partial<SupplierInput> & { isActive?: boolean }) {
  // The API rejects unknown fields, so only the supplier DTO fields are sent.
  return {
    ...(supplier.name !== undefined ? { name: supplier.name.trim() } : {}),
    ...(supplier.contactPerson !== undefined ? { contactPerson: supplier.contactPerson.trim() } : {}),
    ...(supplier.email !== undefined ? { email: supplier.email.trim() } : {}),
    ...(supplier.phone !== undefined ? { phone: supplier.phone.trim() } : {}),
    ...(supplier.address !== undefined ? { address: supplier.address.trim() } : {}),
    ...(supplier.isActive !== undefined ? { isActive: supplier.isActive } : {}),
  };
}

/**
 * Adds a supplier.
 * Backend: POST /pharmacy/suppliers (PHARMACIST, CLINIC_ADMIN, SUPER_ADMIN).
 */
export async function createSupplier(clinicId: string, supplier: SupplierInput) {
  await requireSession();

  if (!supplier.name.trim()) {
    throw new Error('Enter the supplier name.');
  }
  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.SUPPLIERS, {
    method: "POST",
    body: JSON.stringify(supplierBody(supplier)),
    ...scoped(clinicId),
  });
  return data;
}

/**
 * Edits a supplier of the clinic.
 * Backend: PATCH /pharmacy/suppliers/:id (PHARMACIST, CLINIC_ADMIN, SUPER_ADMIN).
 */
export async function updateSupplier(
  clinicId: string,
  supplierId: string,
  updates: Partial<SupplierInput> & { isActive?: boolean },
) {
  await requireSession();

  const body = supplierBody(updates);
  if (Object.keys(body).length === 0) {
    throw new Error('Nothing was changed.');
  }
  const { data } = await authenticatedApi(
    `${API_ENDPOINTS.PHARMACY.SUPPLIERS}/${encodeURIComponent(supplierId)}`,
    { method: "PATCH", body: JSON.stringify(body), ...scoped(clinicId) },
  );
  return data;
}

/**
 * Batches (lots) of the clinic, soonest expiry first. Empty lots are not listed.
 * Backend: GET /pharmacy/inventory/batches?productId= — dispensing consumes these first-expiry-first.
 * The expiry-window and zero-stock query options are not used: the API reads query values as
 * strings and refuses them, so callers filter the list instead.
 */
export async function getStockBatches(
  clinicId: string,
  filters?: { productId?: string },
): Promise<StockBatchRecord[]> {
  await requireSession();

  const params = new URLSearchParams();
  if (filters?.productId) params.set("productId", filters.productId);
  const { data } = await authenticatedApi(
    `/pharmacy/inventory/batches${params.toString() ? `?${params.toString()}` : ""}`,
    scoped(clinicId),
  );
  return listOf(data, "batches").map(normalizeBatch);
}

/**
 * Receives a batch that did not come through a purchase order. Creates the lot and adds its
 * quantity to the medicine's stock in one step.
 * Backend: POST /pharmacy/inventory/batches (PHARMACIST, CLINIC_ADMIN, SUPER_ADMIN).
 */
export async function receiveStockBatch(
  clinicId: string,
  batch: ReceiveStockBatchInput,
): Promise<StockBatchRecord> {
  await requireSession();

  const { data } = await authenticatedApi("/pharmacy/inventory/batches", {
    method: "POST",
    body: JSON.stringify({
      productId: batch.productId,
      lotNumber: batch.lotNumber.trim(),
      manufactureDate: batch.manufactureDate,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity,
      ...(batch.costPrice !== undefined ? { costPrice: batch.costPrice } : {}),
      ...(batch.medicineName ? { medicineName: batch.medicineName } : {}),
    }),
    ...scoped(clinicId),
  });
  const body = asRecord(data);
  return normalizeBatch(body.id ? body : asRecord(body.data));
}

/**
 * Corrects the quantity of one batch (damage, miscount). Records an ADJUSTMENT stock movement
 * and moves the batch and the medicine stock together, so the two cannot drift apart.
 * Backend: POST /pharmacy/inventory/movements with movementType ADJUSTMENT. (The dedicated
 * PATCH /pharmacy/inventory/adjust path is shadowed by PATCH /pharmacy/inventory/:id.)
 */
export async function adjustBatchStock(clinicId: string, adjustment: AdjustBatchStockInput) {
  await requireSession();

  if (!Number.isInteger(adjustment.quantity) || adjustment.quantity === 0) {
    throw new Error('Enter a whole number of units, other than 0.');
  }
  if (!adjustment.reason.trim()) {
    throw new Error('Say why the quantity is being corrected.');
  }
  const { data } = await authenticatedApi("/pharmacy/inventory/movements", {
    method: "POST",
    body: JSON.stringify({
      productId: adjustment.productId,
      batchId: adjustment.batchId,
      movementType: "ADJUSTMENT",
      quantity: adjustment.quantity,
      reason: adjustment.reason.trim(),
      referenceType: "ADJUSTMENT",
    }),
    ...scoped(clinicId),
  });
  return data;
}

/**
 * Open stock alerts (expiry, low stock, out of stock, reorder).
 * Backend: GET /pharmacy/inventory/alerts (no query: the API refuses its own filters sent as text).
 */
export async function getInventoryAlerts(clinicId: string): Promise<StockAlertRecord[]> {
  await requireSession();

  const { data } = await authenticatedApi("/pharmacy/inventory/alerts", scoped(clinicId));
  return listOf(data, "alerts").map((alert) => ({
    id: String(alert.id ?? ""),
    productId: String(alert.productId ?? ""),
    alertType: String(alert.alertType ?? ""),
    message: String(alert.message ?? ""),
    batchId: alert.batchId ? String(alert.batchId) : null,
    createdAt: toIso(alert.createdAt) ?? "",
  }));
}

/**
 * Export pharmacy data for a clinic.
 * The backend has no export endpoint, so the file is built here from the lists it
 * does serve: GET /pharmacy/inventory (medicines, inventory),
 * GET /pharmacy/prescriptions and GET /pharmacy/sales (sales, per day). CSV only.
 */
export async function exportPharmacyData(
  clinicId: string,
  filters: {
    type: "medicines" | "prescriptions" | "sales" | "inventory";
    format: "csv";
    startDate?: string;
    endDate?: string;
  },
): Promise<{ fileName: string; mimeType: string; content: string; rowCount: number }> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  if (filters.format !== "csv") {
    throw new Error('Only CSV files can be exported.');
  }

  const clinicHeaders = clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {};
  const stamp = new Date().toISOString().slice(0, 10);
  let header: string[];
  let rows: unknown[][];

  if (filters.type === "sales") {
    const report = await getPharmacySales(clinicId, {
      ...(filters.startDate ? { from: filters.startDate } : {}),
      ...(filters.endDate ? { to: filters.endDate } : {}),
      groupBy: "day",
    });
    header = ["Date", "Prescriptions dispensed", "Units dispensed", "Revenue (INR)"];
    rows = report.breakdown.map((row) => [row.date, row.prescriptions, row.quantity, row.revenue]);
    rows.push([
      `Total ${report.from} to ${report.to}`,
      report.totals.prescriptions,
      report.totals.quantity,
      report.totals.revenue,
    ]);
  } else if (filters.type === "prescriptions") {
    const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.LIST, clinicHeaders);
    header = ["Prescription ID", "Date", "Patient", "Doctor", "Status", "Payment", "Medicines", "Total"];
    rows = unwrapRecords(data, "prescriptions")
      .filter((prescription) => {
        const day = dayKey(prescription.date ?? prescription.prescribedAt ?? prescription.createdAt);
        if (filters.startDate && (!day || day < filters.startDate)) return false;
        if (filters.endDate && (!day || day > filters.endDate)) return false;
        return true;
      })
      .map((prescription) => {
        const patient = asRecord(asRecord(prescription.patient).user);
        const doctor = asRecord(asRecord(prescription.doctor).user);
        const medicines = (Array.isArray(prescription.items) ? prescription.items : [])
          .map(asRecord)
          .map((item) => `${String(asRecord(item.medicine).name ?? item.medicineName ?? "Medicine")} x ${Number(item.quantity ?? 0)}`)
          .join("; ");
        return [
          prescription.id,
          dayKey(prescription.date ?? prescription.prescribedAt ?? prescription.createdAt),
          prescription.patientName ?? patient.name,
          prescription.doctorName ?? doctor.name,
          prescription.status,
          prescription.paymentStatus,
          medicines,
          prescription.totalAmount,
        ];
      });
  } else {
    const { data } = await authenticatedApi("/pharmacy/inventory", clinicHeaders);
    const medicines = unwrapRecords(data, "inventory").map(normalizeMedicineRecord);
    if (filters.type === "medicines") {
      header = ["Medicine", "Manufacturer", "Type", "Ingredients", "Description", "Dosage", "Price per unit"];
      rows = medicines.map((medicine) => {
        const raw = medicine as Record<string, unknown>;
        return [raw.name, raw.manufacturer, raw.type, raw.ingredients, raw.properties ?? raw.description, raw.dosage, medicine.unitPrice];
      });
    } else {
      header = ["Medicine", "Manufacturer", "Stock", "Minimum stock", "Status", "Expiry date", "Price per unit", "Stock value"];
      rows = medicines.map((medicine) => {
        const raw = medicine as Record<string, unknown>;
        return [
          raw.name,
          raw.manufacturer,
          medicine.stockQuantity,
          medicine.minStockLevel,
          medicine.stockQuantity <= 0
            ? "Out of stock"
            : medicine.minStockLevel > 0 && medicine.stockQuantity <= medicine.minStockLevel
              ? "Low stock"
              : "In stock",
          dayKey(medicine.expiryDate),
          medicine.unitPrice,
          Number((medicine.stockQuantity * medicine.unitPrice).toFixed(2)),
        ];
      });
    }
  }

  return {
    fileName: `pharmacy-${filters.type}-${stamp}.csv`,
    mimeType: "text/csv;charset=utf-8",
    content: toCsv(header, rows),
    rowCount: rows.length,
  };
}
