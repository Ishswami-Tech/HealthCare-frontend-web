import { formatDateInIST, formatDateKeyInIST, formatTimeInIST } from "@/lib/utils/date-time";
import type { PillTone } from "@/components/tbd";
import {
  buildInventorySummary,
  formatRupees,
  unwrapList,
  type InventorySummary,
} from "../../pharmacist/dashboard/_components/pharmacist-dashboard.logic";

/**
 * Pure helpers for the pharmacy inventory screen (`/pharmacy`): they turn the raw payloads of
 * `useMedicines`, `useSuppliers`, `usePharmacyOrders`, `usePharmacyStats` and `usePrescriptions`
 * into the view models the tabs and dialogs render. No React, no fetching.
 *
 * Low stock uses the dashboard rule (`buildInventorySummary`): stock at or below the reorder
 * level (`minStockThreshold` / `minStockLevel`), or no stock at all.
 */

export { formatRupees };

// ── What the backend can do today ──────────────────────────────────────────

/**
 * `PATCH /pharmacy/inventory/:id` accepts only `quantityChange` and `price` (the web sends the
 * price only: stock moves through batches), and there is no DELETE route the web can rely on,
 * so a medicine cannot be removed yet. Set to `true` when the backend supports it:
 * the Remove button (danger, with a confirm dialog, wired to `useDeleteMedicine`) appears.
 */
export const CAN_REMOVE_MEDICINE = false;

/** Values `POST /pharmacy/inventory` accepts for the medicine type (dosage form), A to Z with Other last. */
export const DOSAGE_FORMS = [
  { value: "ARISHTA", label: "Arishta" },
  { value: "ASAVA", label: "Asava" },
  { value: "AVALEHA", label: "Avaleha" },
  { value: "BHASMA", label: "Bhasma" },
  { value: "CAPSULE", label: "Capsule" },
  { value: "CHURNA", label: "Churna" },
  { value: "CREAM", label: "Cream" },
  { value: "DRINK", label: "Drink" },
  { value: "DROPS", label: "Drops" },
  { value: "GEL", label: "Gel" },
  { value: "GHRITA", label: "Ghrita" },
  { value: "GRANULE", label: "Granule" },
  { value: "GUTIKA", label: "Gutika" },
  { value: "INJECTION", label: "Injection" },
  { value: "KASHAYAM", label: "Kashayam" },
  { value: "LEPA", label: "Lepa" },
  { value: "LOTION", label: "Lotion" },
  { value: "OIL", label: "Oil" },
  { value: "OINTMENT", label: "Ointment" },
  { value: "PARPATI", label: "Parpati" },
  { value: "PISHTEE", label: "Pishtee" },
  { value: "SHAMPOO", label: "Shampoo" },
  { value: "SOAP", label: "Soap" },
  { value: "SWARASA", label: "Swarasa" },
  { value: "SYRUP", label: "Syrup" },
  { value: "TABLET", label: "Tablet" },
  { value: "TOOTHPASTE", label: "Toothpaste" },
  { value: "VATI", label: "Vati" },
  { value: "YAVKUT_KWATH", label: "Yavkut Kwath" },
  { value: "OTHER", label: "Other" },
] as const;

export type DosageFormValue = (typeof DOSAGE_FORMS)[number]["value"];

// ── Small readers ──────────────────────────────────────────────────────────

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

function amount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isoDate(value: unknown): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  const raw = text(value);
  if (!raw) return null;
  return Number.isNaN(new Date(raw).getTime()) ? null : raw;
}

function joinList(value: unknown): string {
  return Array.isArray(value) ? value.map(text).filter(Boolean).join(", ") : text(value);
}

/** "PROPRIETARY" -> "Proprietary", "cough_and_cold" -> "Cough and cold". */
export function titleCase(value: string): string {
  const clean = value.replace(/[_-]+/g, " ").trim();
  if (!clean) return "";
  // Leave values that are already written for people ("Cough & cold") as they are.
  if (clean !== clean.toUpperCase()) return clean;
  return clean
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Medicines ──────────────────────────────────────────────────────────────

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface MedicineRow {
  id: string;
  name: string;
  manufacturer: string;
  /** Medicine type as the API sends it (for the filter). */
  typeCode: string;
  typeLabel: string;
  /** Only set when the API sends a category that is not just the type again. */
  category: string;
  stock: number;
  /** Reorder level; 0 = none set. */
  minStock: number;
  maxStock: number;
  unit: string;
  price: number;
  stockValue: number;
  status: StockStatus;
  expiryDate: string | null;
  daysToExpiry: number | null;
  expiringSoon: boolean;
  supplierId: string;
  supplierName: string;
  batchNumber: string;
  /** Label / value pairs for the details dialog; only fields the API sent. */
  facts: { label: string; value: string }[];
  /** Longer texts for the details dialog (description, dosage …). */
  notes: { label: string; value: string }[];
  prescriptionRequired: boolean;
}

export interface InventoryOverview {
  rows: MedicineRow[];
  summary: InventorySummary;
  /** Medicines at or below the reorder level or out of stock, worst first. */
  lowStock: MedicineRow[];
  /** Medicines that expire within 90 days (or already have), soonest first. */
  expiring: MedicineRow[];
  totalValue: number;
  typeOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

export const STATUS_TONE: Record<StockStatus, PillTone> = {
  in_stock: "green",
  low_stock: "amber",
  out_of_stock: "rose",
};

function daysUntil(expiryDate: string | null, now: Date): number | null {
  if (!expiryDate) return null;
  return Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / DAY_MS);
}

/** "Aug 2027" */
export function expiryMonthLabel(expiryDate: string | null): string {
  return expiryDate ? formatDateInIST(expiryDate, { month: "short", year: "numeric" }) : "";
}

/** "31 Jan 2027" */
export function dayLabel(value: string | null): string {
  return value ? formatDateInIST(value, { day: "numeric", month: "short", year: "numeric" }) : "";
}

/** "3 Oct 2026, 12:40 pm" */
export function dateTimeLabel(value: string | null): string {
  if (!value) return "";
  return [dayLabel(value), formatTimeInIST(value).toLowerCase()].filter(Boolean).join(", ");
}

/** Builds the list, the alert lists and the filter options from the `useMedicines` payload. */
export function buildInventoryOverview(
  inventoryData: unknown,
  supplierNames: Map<string, string> = new Map(),
  now: Date = new Date(),
): InventoryOverview {
  const summary = buildInventorySummary(inventoryData);
  const alertById = new Map(summary.alerts.map((alert, index) => [alert.id, { alert, rank: index }]));

  const rows = unwrapList(inventoryData, "inventory").map((entry, index): MedicineRow => {
    const medicine = asRecord(entry);
    const name = text(medicine.name) || text(medicine.medicineName) || "Medicine";
    // Same id fallback as the dashboard, so its alerts can be matched to these rows.
    const id = text(medicine.id) || `${name}-${index}`;
    const alert = alertById.get(id)?.alert;

    const stock = Math.max(
      0,
      amount(medicine.currentStock ?? medicine.stockQuantity ?? medicine.stock ?? medicine.quantity) ?? 0,
    );
    const minStock =
      amount(medicine.minStock ?? medicine.minThreshold ?? medicine.minStockThreshold ?? medicine.minStockLevel) ?? 0;
    const maxStock = amount(medicine.maxStockLevel ?? medicine.maxStock) ?? 0;
    const price = amount(medicine.unitPrice ?? medicine.price) ?? 0;
    const expiryDate = isoDate(medicine.expiryDate);
    const daysToExpiry = daysUntil(expiryDate, now) ?? amount(medicine.daysToExpiry);

    const typeCode = text(medicine.type);
    const typeLabel = titleCase(typeCode);
    const rawCategory = text(medicine.category);
    const category = rawCategory && rawCategory.toUpperCase() !== typeCode.toUpperCase() ? titleCase(rawCategory) : "";
    const supplierId = text(medicine.supplierId);
    const supplierName = text(asRecord(medicine.supplier).name) || supplierNames.get(supplierId) || "";
    const unit = text(medicine.unit) || "units";
    const batchNumber = text(medicine.batchNumber);
    const packSize = amount(medicine.packSize);
    const dosage = text(medicine.dosage);

    const facts = [
      { label: "Generic name", value: text(medicine.genericName) },
      { label: "Category", value: category },
      { label: "Type", value: typeLabel },
      { label: "Strength", value: text(medicine.strength) },
      { label: "Pack size", value: packSize !== null && packSize > 1 ? `${packSize} ${unit}` : "" },
      { label: "Batch number", value: batchNumber },
      { label: "Expiry date", value: dayLabel(expiryDate) },
      { label: "Minimum stock level", value: minStock > 0 ? `${minStock} ${unit}` : "" },
      { label: "Last restocked", value: dayLabel(isoDate(medicine.lastRestocked)) },
      { label: "Manufacturer", value: text(medicine.manufacturer) },
      { label: "Supplier", value: supplierName },
      { label: "Ingredients", value: text(medicine.ingredients) },
    ].filter((fact) => fact.value);

    const notes = [
      { label: "Description", value: text(medicine.description) || text(medicine.properties) },
      { label: "Dosage", value: dosage },
      { label: "Storage conditions", value: text(medicine.storageConditions) },
      { label: "Side effects", value: joinList(medicine.sideEffects) },
      { label: "Contraindications", value: joinList(medicine.contraindications) },
    ].filter((note) => note.value);

    return {
      id,
      name,
      manufacturer: text(medicine.manufacturer),
      typeCode,
      typeLabel,
      category,
      stock,
      minStock,
      maxStock,
      unit,
      price,
      stockValue: Number((stock * price).toFixed(2)),
      status: alert ? (alert.outOfStock ? "out_of_stock" : "low_stock") : "in_stock",
      expiryDate,
      daysToExpiry,
      expiringSoon: medicine.isExpiringSoon === true || (daysToExpiry !== null && daysToExpiry <= 90),
      supplierId,
      supplierName,
      batchNumber,
      facts,
      notes,
      prescriptionRequired: medicine.prescriptionRequired === true,
    };
  });

  const lowStock = rows
    .filter((row) => row.status !== "in_stock")
    .sort((left, right) => (alertById.get(left.id)?.rank ?? 0) - (alertById.get(right.id)?.rank ?? 0));
  const expiring = rows
    .filter((row) => row.expiringSoon)
    .sort((left, right) => (left.daysToExpiry ?? 0) - (right.daysToExpiry ?? 0));

  const distinct = (values: { value: string; label: string }[]) =>
    [...new Map(values.filter((option) => option.value).map((option) => [option.value, option])).values()].sort(
      (left, right) => left.label.localeCompare(right.label),
    );

  return {
    rows,
    summary,
    lowStock,
    expiring,
    totalValue: rows.reduce((sum, row) => sum + row.stockValue, 0),
    typeOptions: distinct(rows.map((row) => ({ value: row.typeCode, label: row.typeLabel }))),
    categoryOptions: distinct(rows.map((row) => ({ value: row.category, label: row.category }))),
  };
}

/** Second line under a medicine name: "Tablet · Cipla". */
export function medicineSubline(row: MedicineRow): string {
  // The type sits in the Category column when the API sends no separate category.
  return [row.category ? row.typeLabel : "", row.manufacturer].filter(Boolean).join(" · ");
}

/** "4 of 20 minimum · Tablet · Cipla" */
export function lowStockLine(row: MedicineRow): string {
  const level = row.minStock > 0 ? `${row.stock} of ${row.minStock} minimum` : `${row.stock} in stock`;
  return [level, row.typeLabel, row.manufacturer].filter(Boolean).join(" · ");
}

/** "Batch MON8120 · 4 in stock · Cipla" */
export function expiringLine(row: MedicineRow): string {
  return [row.batchNumber ? `Batch ${row.batchNumber}` : "", `${row.stock} in stock`, row.manufacturer]
    .filter(Boolean)
    .join(" · ");
}

/** Pill for the expiry column of the "Expiring soon" list. */
export function expiryPill(row: MedicineRow): { label: string; tone: PillTone } {
  if (row.daysToExpiry !== null && row.daysToExpiry < 0) return { label: "Expired", tone: "rose" };
  const label = `Expires ${expiryMonthLabel(row.expiryDate)}`.trim();
  return { label, tone: row.daysToExpiry !== null && row.daysToExpiry <= 30 ? "rose" : "amber" };
}

// ── List filters ───────────────────────────────────────────────────────────

/** `restock` = low or out of stock (what `/pharmacy?filter=low` asks for). */
export type StockFilter = "all" | "in_stock" | "restock" | "out_of_stock" | "expiring";

export const STOCK_FILTER_OPTIONS: { value: StockFilter; label: string }[] = [
  { value: "all", label: "All stock status" },
  { value: "in_stock", label: "In stock" },
  { value: "restock", label: "Low or out of stock" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "expiring", label: "Expiring soon" },
];

export interface InventoryFilters {
  search: string;
  /** "" = all */
  type: string;
  /** "" = all */
  category: string;
  stock: StockFilter;
}

export const EMPTY_FILTERS: InventoryFilters = { search: "", type: "", category: "", stock: "all" };

/** `?filter=low` / `?filter=expiring` from the dashboard links. */
export function stockFilterFromQuery(value: string | null | undefined): StockFilter {
  const filter = String(value ?? "").trim().toLowerCase();
  if (filter === "low" || filter === "low-stock" || filter === "restock") return "restock";
  if (filter === "expiring" || filter === "expiring-soon") return "expiring";
  if (filter === "out" || filter === "out-of-stock") return "out_of_stock";
  return "all";
}

export function filterMedicines(rows: MedicineRow[], filters: InventoryFilters): MedicineRow[] {
  const needle = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (needle) {
      const haystack = [row.name, row.category, row.typeLabel, row.manufacturer].join(" ").toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (filters.type && row.typeCode !== filters.type) return false;
    if (filters.category && row.category !== filters.category) return false;
    switch (filters.stock) {
      case "in_stock":
        return row.status === "in_stock";
      case "restock":
        return row.status !== "in_stock";
      case "out_of_stock":
        return row.status === "out_of_stock";
      case "expiring":
        return row.expiringSoon;
      default:
        return true;
    }
  });
}

export const PAGE_SIZE = 10;

export function paginate<T>(items: T[], page: number, pageSize: number = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(items.length, start + pageSize),
    total: items.length,
  };
}

/** Finds the medicine a deep link (`?item=`) points at: by id, else by name. */
export function findMedicine(rows: MedicineRow[], key: string | null | undefined): MedicineRow | null {
  const wanted = String(key ?? "").trim();
  if (!wanted) return null;
  return (
    rows.find((row) => row.id === wanted) ??
    rows.find((row) => row.name.toLowerCase() === wanted.toLowerCase()) ??
    null
  );
}

// ── Suppliers (partner pharmacies) ─────────────────────────────────────────

export interface SupplierCard {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  /** Medicines in the stock list that name this supplier. */
  medicines: { id: string; name: string }[];
}

export function buildSuppliers(suppliersData: unknown, rows: MedicineRow[]): SupplierCard[] {
  return unwrapList(suppliersData, "suppliers").reduce<SupplierCard[]>((cards, entry) => {
    const supplier = asRecord(entry);
    const id = text(supplier.id);
    if (!id) return cards;
    cards.push({
      id,
      name: text(supplier.name) || "Supplier",
      contactPerson: text(supplier.contactPerson),
      phone: text(supplier.phone),
      email: text(supplier.email),
      address: text(supplier.address),
      medicines: rows.filter((row) => row.supplierId === id).map((row) => ({ id: row.id, name: row.name })),
    });
    return cards;
  }, []);
}

export function supplierNameMap(suppliersData: unknown): Map<string, string> {
  return new Map(
    unwrapList(suppliersData, "suppliers")
      .map(asRecord)
      .filter((supplier) => text(supplier.id))
      .map((supplier) => [text(supplier.id), text(supplier.name)]),
  );
}

// ── Orders (purchase orders to suppliers) ──────────────────────────────────

export interface OrderLine {
  /** Purchase order line id (what the receive route calls `itemId`). */
  id: string;
  productId: string;
  name: string;
  quantity: number;
  /** Units received so far. */
  received: number;
  /** Units still to arrive. */
  outstanding: number;
  unitPrice: number | null;
}

export interface OrderRow {
  id: string;
  /** The purchase order number from the API ("PO-…"). */
  reference: string;
  status: string;
  supplierId: string;
  supplierName: string;
  lines: OrderLine[];
  orderedAt: string | null;
  sentAt: string | null;
  expectedAt: string | null;
  /** Null when no line carries a price. */
  total: number | null;
  notes: string;
  /** A draft: it has not gone to the supplier yet. */
  canSend: boolean;
  /** Sent or partly received: goods can be booked in. */
  canReceive: boolean;
}

const ORDER_TONES: Record<string, PillTone> = {
  DRAFT: "slate",
  SENT: "blue",
  PARTIALLY_RECEIVED: "amber",
  RECEIVED: "green",
  CANCELLED: "rose",
};

export function orderTone(status: string): PillTone {
  return ORDER_TONES[status.toUpperCase()] ?? "slate";
}

/** Orders still on their way to the clinic. */
const OPEN_ORDER_STATUSES = new Set(["SENT", "PARTIALLY_RECEIVED"]);

/**
 * Maps the `usePharmacyOrders` payload (`{ orders, total }`, the `GET .../purchase-orders` page).
 * Returns null while the list has not been read (loading, failed or no clinic).
 */
export function buildOrders(
  ordersData: unknown,
  rows: MedicineRow[],
  supplierNames: Map<string, string>,
): OrderRow[] | null {
  if (ordersData === null || ordersData === undefined) return null;
  const medicineNames = new Map(rows.map((row) => [row.id, row.name]));

  return unwrapList(ordersData, "orders").reduce<OrderRow[]>((orders, entry) => {
    const order = asRecord(entry);
    const id = text(order.id);
    if (!id) return orders;

    const lines = asList(order.items).map((itemRaw, index): OrderLine => {
      const item = asRecord(itemRaw);
      const medicineId = text(item.productId) || text(item.medicineId);
      const quantity = amount(item.quantity) ?? 0;
      const received = amount(item.receivedQuantity) ?? 0;
      return {
        id: text(item.id) || `${medicineId || "line"}-${index}`,
        productId: medicineId,
        name:
          text(item.description) ||
          text(asRecord(item.medicine).name) ||
          medicineNames.get(medicineId) ||
          "Medicine",
        quantity,
        received,
        outstanding: Math.max(0, quantity - received),
        unitPrice: amount(item.unitPrice),
      };
    });
    const priced = lines.filter((line) => line.unitPrice !== null);
    const compact = id.replace(/[^a-zA-Z0-9]/g, "");
    const status = text(order.status).toUpperCase() || "DRAFT";

    orders.push({
      id,
      reference: text(order.poNumber) || `PO-${compact.slice(0, 8).toUpperCase()}`,
      status,
      supplierId: text(order.supplierId),
      supplierName:
        text(asRecord(order.supplier).name) || supplierNames.get(text(order.supplierId)) || "",
      lines,
      orderedAt: isoDate(order.createdAt),
      sentAt: isoDate(order.sentAt),
      expectedAt: isoDate(order.expectedDeliveryDate),
      total:
        amount(order.totalAmount) ??
        (priced.length > 0
          ? priced.reduce((sum, line) => sum + line.quantity * (line.unitPrice ?? 0), 0)
          : null),
      notes: text(order.notes),
      canSend: status === "DRAFT",
      canReceive: OPEN_ORDER_STATUSES.has(status),
    });
    return orders;
  }, []);
}

/** "3 of 10 received" for the order card; empty for an order nothing has arrived for. */
export function receivedSummary(order: OrderRow): string {
  const ordered = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const received = order.lines.reduce((sum, line) => sum + Math.min(line.received, line.quantity), 0);
  return received > 0 ? `${received} of ${ordered} units received` : "";
}

// ── Analytics ──────────────────────────────────────────────────────────────

/** Window of the revenue and top-seller figures (`GET /pharmacy/stats?period=`). */
export type StatsPeriod = "day" | "week" | "month" | "year";

export interface AnalyticsSummary {
  /** Prescriptions written today. */
  prescriptionsToday: number | null;
  /** Paid pharmacy invoices in the chosen period; null until `GET /pharmacy/stats` has answered. */
  revenue: number | null;
  /** Purchase orders sent and not fully received; null until the order list has been read. */
  pendingDeliveries: number | null;
  /** Medicine with the most units dispensed in the period; null = none dispensed (or no answer yet). */
  topSelling: string | null;
  /** The stats answered, so a blank top seller means "no sales", not "unknown". */
  statsReady: boolean;
}

function prescriptionDay(prescription: Raw): string {
  const when = isoDate(prescription.prescribedAt) ?? isoDate(prescription.date) ?? isoDate(prescription.createdAt);
  return when ? formatDateKeyInIST(when) : "";
}

/**
 * The figures of the analytics cards. Revenue and top seller are the server's own
 * (`totalRevenue`, `topSellingMedicine` of `GET /pharmacy/stats?period=`); nothing is estimated
 * here. `pharmacyStats` is the `usePharmacyStats` payload.
 */
export function buildAnalytics(
  prescriptionsData: unknown,
  orders: OrderRow[] | null,
  pharmacyStats: unknown = null,
  now: Date = new Date(),
): AnalyticsSummary {
  const todayKey = formatDateKeyInIST(now);

  const prescriptions =
    prescriptionsData === null || prescriptionsData === undefined
      ? null
      : unwrapList(prescriptionsData, "prescriptions").map(asRecord);

  const stats = pharmacyStats && typeof pharmacyStats === "object" ? asRecord(pharmacyStats) : null;

  return {
    prescriptionsToday: prescriptions
      ? prescriptions.filter((prescription) => prescriptionDay(prescription) === todayKey).length
      : null,
    revenue: stats ? amount(stats.totalRevenue) : null,
    pendingDeliveries: orders ? orders.filter((order) => OPEN_ORDER_STATUSES.has(order.status)).length : null,
    topSelling: stats ? text(stats.topSellingMedicine) || null : null,
    statsReady: stats !== null,
  };
}

// ── Mutation payloads ──────────────────────────────────────────────────────

/** Today's date as `yyyy-mm-dd` in IST (for `min` on date inputs and defaults). */
export function todayKey(now: Date = new Date()): string {
  return formatDateKeyInIST(now);
}

/** Tomorrow's date as `yyyy-mm-dd` in IST: the earliest expiry date a stock batch accepts. */
export function tomorrowKey(now: Date = new Date()): string {
  return formatDateKeyInIST(new Date(now.getTime() + 86_400_000));
}
