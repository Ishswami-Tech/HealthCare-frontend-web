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
 * `useMedicines`, `useSuppliers`, `usePharmacyOrders`, `usePharmacySales` and `usePrescriptions`
 * into the view models the tabs and dialogs render. No React, no fetching.
 *
 * Low stock uses the dashboard rule (`buildInventorySummary`): stock at or below the reorder
 * level (`minStockThreshold` / `minStockLevel`), or no stock at all.
 */

export { formatRupees };

// ── What the backend can do today ──────────────────────────────────────────

/**
 * `PATCH /pharmacy/inventory/:id` accepts only `quantityChange` and `price`, and there is no
 * DELETE route, so a medicine cannot be removed yet. Set to `true` when the backend supports it:
 * the Remove button (danger, with a confirm dialog, wired to `useDeleteMedicine`) appears.
 */
export const CAN_REMOVE_MEDICINE = false;

/** Values `POST /pharmacy/inventory` accepts for the medicine type. */
export const DOSAGE_FORMS = [
  { value: "TABLET", label: "Tablet" },
  { value: "CAPSULE", label: "Capsule" },
  { value: "SYRUP", label: "Syrup" },
  { value: "INJECTION", label: "Injection" },
  { value: "CREAM", label: "Cream" },
  { value: "DROPS", label: "Drops" },
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
  const lower = clean.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
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
  id: string;
  name: string;
  quantity: number;
  received: number | null;
  unitPrice: number | null;
}

export interface OrderRow {
  id: string;
  /** "PO-1A2B3C4D" — shown to people; there is no order number in the API. */
  reference: string;
  status: string;
  supplierName: string;
  lines: OrderLine[];
  orderedAt: string | null;
  expectedAt: string | null;
  /** Null when no line carries a price. */
  total: number | null;
  notes: string;
}

const ORDER_TONES: Record<string, PillTone> = {
  DRAFT: "slate",
  SENT: "blue",
  PROCESSING: "blue",
  PARTIALLY_RECEIVED: "blue",
  SHIPPED: "amber",
  RECEIVED: "green",
  DELIVERED: "green",
  CANCELLED: "rose",
};

export function orderTone(status: string): PillTone {
  return ORDER_TONES[status.toUpperCase()] ?? "slate";
}

/** Orders still on their way to the clinic. */
const OPEN_ORDER_STATUSES = new Set(["SENT", "PROCESSING", "SHIPPED", "PARTIALLY_RECEIVED"]);

/**
 * Maps the `usePharmacyOrders` payload. Returns null when the API has no order list
 * (today the backend can create purchase orders but has no route that lists them).
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
      return {
        id: text(item.id) || `${medicineId || "line"}-${index}`,
        name:
          text(item.description) ||
          text(asRecord(item.medicine).name) ||
          medicineNames.get(medicineId) ||
          "Medicine",
        quantity: amount(item.quantity) ?? 0,
        received: amount(item.receivedQuantity),
        unitPrice: amount(item.unitPrice),
      };
    });
    const priced = lines.filter((line) => line.unitPrice !== null);
    const compact = id.replace(/[^a-zA-Z0-9]/g, "");

    orders.push({
      id,
      reference: text(order.orderNumber) || `PO-${compact.slice(0, 8).toUpperCase()}`,
      status: text(order.status).toUpperCase() || "DRAFT",
      supplierName:
        text(asRecord(order.supplier).name) || supplierNames.get(text(order.supplierId)) || "",
      lines,
      orderedAt: isoDate(order.createdAt) ?? isoDate(order.orderDate),
      expectedAt: isoDate(order.expectedDeliveryDate),
      total:
        amount(order.totalAmount) ??
        (priced.length > 0
          ? priced.reduce((sum, line) => sum + line.quantity * (line.unitPrice ?? 0), 0)
          : null),
      notes: text(order.notes),
    });
    return orders;
  }, []);
}

// ── Analytics ──────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  /** Prescriptions written today. */
  prescriptionsToday: number | null;
  /** Medicine sales this month; null = the API has no sales data. */
  revenueThisMonth: number | null;
  /** Orders on their way; null = the API has no order list. */
  pendingDeliveries: number | null;
  topSelling: string | null;
  /** Share of this month's sales by category, largest first; null = no data. */
  categoryShare: { label: string; percent: number }[] | null;
  /** Sales of the last six months, oldest first; null = no data. */
  monthly: { key: string; label: string; amount: number; current: boolean }[] | null;
}

function prescriptionDay(prescription: Raw): string {
  const when = isoDate(prescription.prescribedAt) ?? isoDate(prescription.date) ?? isoDate(prescription.createdAt);
  return when ? formatDateKeyInIST(when) : "";
}

/**
 * `usePharmacySales` has no backend route yet and returns null, so every sales figure is null
 * and the cards show "not available yet". The mapping below is used as soon as a list of
 * sales (`{ totalAmount, createdAt, items: [{ name, category, quantity, total }] }`) arrives.
 * `pharmacyStats` is the `usePharmacyStats` payload.
 */
export function buildAnalytics(
  prescriptionsData: unknown,
  salesData: unknown,
  orders: OrderRow[] | null,
  pharmacyStats: unknown = null,
  now: Date = new Date(),
): AnalyticsSummary {
  const todayKey = formatDateKeyInIST(now);
  const monthKey = todayKey.slice(0, 7);

  const prescriptions =
    prescriptionsData === null || prescriptionsData === undefined
      ? null
      : unwrapList(prescriptionsData, "prescriptions").map(asRecord);

  const sales = Array.isArray(salesData) || Array.isArray(asRecord(salesData).sales)
    ? unwrapList(salesData, "sales").map(asRecord)
    : null;

  let revenueThisMonth: number | null = null;
  let topSelling: string | null = null;
  let categoryShare: AnalyticsSummary["categoryShare"] = null;
  let monthly: AnalyticsSummary["monthly"] = null;

  if (sales && sales.length > 0) {
    const months = Array.from({ length: 6 }, (_, back) => {
      const [year, month] = monthKey.split("-").map(Number);
      const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1 - (5 - back), 1));
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      return {
        key,
        label: date.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" }),
        amount: 0,
        current: key === monthKey,
      };
    });
    const byMonth = new Map(months.map((month) => [month.key, month]));
    const byCategory = new Map<string, number>();
    const byMedicine = new Map<string, number>();
    revenueThisMonth = 0;

    for (const sale of sales) {
      const when = isoDate(sale.saleDate) ?? isoDate(sale.createdAt) ?? isoDate(sale.date);
      const key = when ? formatDateKeyInIST(when).slice(0, 7) : "";
      const total = amount(sale.totalAmount ?? sale.total ?? sale.amount) ?? 0;
      const bucket = byMonth.get(key);
      if (bucket) bucket.amount += total;
      if (key !== monthKey) continue;
      revenueThisMonth += total;
      for (const itemRaw of asList(sale.items)) {
        const item = asRecord(itemRaw);
        const name = text(item.medicineName) || text(item.name) || text(asRecord(item.medicine).name);
        const lineTotal = amount(item.total ?? item.amount) ?? 0;
        const category = titleCase(text(item.category) || text(asRecord(item.medicine).category));
        if (name) byMedicine.set(name, (byMedicine.get(name) ?? 0) + (amount(item.quantity) ?? 0));
        if (category) byCategory.set(category, (byCategory.get(category) ?? 0) + lineTotal);
      }
    }

    monthly = months;
    topSelling = [...byMedicine.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
    const categoryTotal = [...byCategory.values()].reduce((sum, value) => sum + value, 0);
    categoryShare =
      categoryTotal > 0
        ? [...byCategory.entries()]
            .sort((left, right) => right[1] - left[1])
            .map(([label, value]) => ({ label, percent: Math.round((value / categoryTotal) * 100) }))
        : null;
  }

  // The stats endpoint is used when it carries these two figures (it does not today).
  const stats = asRecord(pharmacyStats);

  return {
    prescriptionsToday: prescriptions
      ? prescriptions.filter((prescription) => prescriptionDay(prescription) === todayKey).length
      : null,
    revenueThisMonth: revenueThisMonth ?? amount(stats.totalRevenue),
    pendingDeliveries: orders ? orders.filter((order) => OPEN_ORDER_STATUSES.has(order.status)).length : null,
    topSelling: topSelling ?? (text(stats.topSellingMedicine) || null),
    categoryShare,
    monthly,
  };
}

// ── Mutation payloads ──────────────────────────────────────────────────────

/** Today's date as `yyyy-mm-dd` in IST (for `min` on date inputs and defaults). */
export function todayKey(now: Date = new Date()): string {
  return formatDateKeyInIST(now);
}
