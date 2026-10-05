"use server";

import { authenticatedApi, getServerSession } from "./auth.server";
import { API_ENDPOINTS } from "../config/config";
import type {
  DispensePrescriptionData,
  PharmacyBatchAuditEntry,
  ReversePrescriptionDispenseData,
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
    stockQuantity: number;
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
      quantity: medicineData.stockQuantity,
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
    /** Units to add (positive) or take off (negative). */
    quantityChange?: number;
    // Not editable on the backend yet (UpdateInventoryDto has only quantityChange
    // and price) — accepted so older call sites keep compiling, never sent.
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
    ...(updates.quantityChange ? { quantityChange: updates.quantityChange } : {}),
    ...(updates.unitPrice !== undefined ? { price: updates.unitPrice } : {}),
  };
  if (Object.keys(body).length === 0) {
    throw new Error('Only the price and the stock of a medicine can be changed.');
  }

  // Backend: PATCH /pharmacy/inventory/:id — accepts quantityChange and price only.
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
 * Update inventory
 */
export async function updateInventory(
  clinicId: string,
  medicineId: string,
  inventoryData: {
    /** Units received (positive) or taken off (negative). */
    quantityChange?: number;
    // Not stored by the backend yet — accepted so older call sites keep compiling, never sent.
    stockQuantity?: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderPoint?: number;
    lastRestocked?: string;
  },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  if (!inventoryData.quantityChange) {
    throw new Error('Enter how many units to add or take off.');
  }

  // Backend: PATCH /pharmacy/inventory/:id — the stock moves by `quantityChange`.
  const { data } = await authenticatedApi(`/pharmacy/inventory/${medicineId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantityChange: inventoryData.quantityChange }),
    ...(clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {}),
  });
  return data;
}

/**
 * Get pharmacy orders for a clinic
 * Backend: purchase orders can be created (POST /pharmacy/inventory/purchase-orders)
 * but there is no route that lists them yet.
 */
export async function getPharmacyOrders(
  _clinicId: string,
  _filters?: {
    supplierId?: string;
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

  // No backend route lists purchase orders yet — callers show an empty state.
  return null;
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
 * Get pharmacy sales for a clinic
 * Backend: No dedicated sales endpoint
 */
export async function getPharmacySales(
  _clinicId: string,
  _filters?: {
    startDate?: string;
    endDate?: string;
    pharmacistId?: string;
    paymentMethod?: string;
    limit?: number;
  },
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // No backend sales endpoint
  return null;
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
 * Get medicine categories
 */
export async function getMedicineCategories() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.PHARMACY.CATEGORIES);
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

/**
 * Export pharmacy data for a clinic.
 * The backend has no export endpoint, so the file is built here from the lists it
 * does serve: GET /pharmacy/inventory (medicines, inventory) and
 * GET /pharmacy/prescriptions. CSV only; there is no sales data to export.
 */
export async function exportPharmacyData(
  clinicId: string,
  filters: {
    type: "medicines" | "prescriptions" | "sales" | "inventory";
    format: "csv" | "excel" | "pdf";
    startDate?: string;
    endDate?: string;
  },
): Promise<{ fileName: string; mimeType: string; content: string; rowCount: number }> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  if (filters.format !== "csv") {
    throw new Error('Only CSV files can be exported for now.');
  }
  if (filters.type === "sales") {
    throw new Error('Sales cannot be exported yet.');
  }

  const clinicHeaders = clinicId ? { headers: { "X-Clinic-ID": clinicId } } : {};
  const stamp = new Date().toISOString().slice(0, 10);
  let header: string[];
  let rows: unknown[][];

  if (filters.type === "prescriptions") {
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
