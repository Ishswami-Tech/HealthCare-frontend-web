"use client";

import {
  Activity,
  BarChart3,
  Bell,
  CircleAlert,
  CreditCard,
  Eye,
  FileText,
  Hospital,
  IndianRupee,
  Mail,
  MapPin,
  Package,
  Phone,
  Star,
  Truck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/loading";
import { EmptyBlock, IconBox, Kpi, Note, Pill, Surface, statusLabel, type TbdIcon } from "@/components/tbd";
import {
  dateTimeLabel,
  dayLabel,
  formatRupees,
  orderTone,
  type AnalyticsSummary,
  type OrderRow,
  type SupplierCard,
} from "./pharmacy-inventory.logic";

const NOT_YET = "Not available yet";

function CardHead({
  icon,
  title,
  description,
  aside,
}: {
  icon: TbdIcon;
  title: string;
  description: string;
  aside?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <IconBox icon={icon} tone="mint" size={38} />
      <span className="flex min-w-0 flex-1 basis-[200px] flex-col gap-px">
        <h2 className="m-0 text-base font-bold text-ink">{title}</h2>
        <span className="text-[13px] font-medium text-ink-muted">{description}</span>
      </span>
      {aside ? <span className="text-xs font-bold text-ink-soft">{aside}</span> : null}
    </div>
  );
}

// ── Orders ─────────────────────────────────────────────────────────────────

export interface PharmacyOrdersTabProps {
  /** Null = the API has no order list yet. */
  orders: OrderRow[] | null;
  loading?: boolean;
  errorMessage?: string | null;
  canManage: boolean;
  onViewOrder: (order: OrderRow) => void;
  onNewOrder: () => void;
}

/** Board `PhInventoryOrders`: purchase orders to suppliers, newest first. */
export function PharmacyOrdersTab({
  orders,
  loading = false,
  errorMessage = null,
  canManage,
  onViewOrder,
  onNewOrder,
}: PharmacyOrdersTabProps) {
  const count = orders?.length ?? 0;
  return (
    <div className="flex flex-col gap-5">
      <Surface flush as="section" aria-label="Recent orders and deliveries">
        <div className="border-b border-hair px-5 py-[18px]">
          <CardHead
            icon={Truck}
            title="Recent Orders & Deliveries"
            description="Medicines ordered from partner pharmacies for the clinic stock."
            aside={count > 0 ? `${count} ${count === 1 ? "order" : "orders"}` : undefined}
          />
        </div>

        {loading ? (
          <div className="p-5" aria-busy="true">
            <SkeletonList items={3} />
          </div>
        ) : errorMessage ? (
          <EmptyBlock icon={CircleAlert} title="Orders could not be loaded" description={errorMessage} />
        ) : orders === null ? (
          <EmptyBlock
            icon={Truck}
            title="The order list is not available yet"
            description="You can place an order with a supplier, but past orders cannot be shown here yet."
            action={
              canManage ? (
                <Button size="md" onClick={onNewOrder}>
                  <Truck aria-hidden="true" />
                  New order
                </Button>
              ) : undefined
            }
          />
        ) : orders.length === 0 ? (
          <EmptyBlock
            icon={Truck}
            title="No orders yet"
            description="Orders you place with a supplier show here."
            action={
              canManage ? (
                <Button size="md" onClick={onNewOrder}>
                  <Truck aria-hidden="true" />
                  New order
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {orders.map((order) => (
              <li
                key={order.id}
                className="grid grid-cols-1 items-center gap-x-6 gap-y-3 border-b border-hair px-5 py-[18px] last:border-b-0 md:grid-cols-[minmax(0,1fr)_180px_auto]"
              >
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[15px] font-extrabold text-ink">{order.reference}</span>
                    <Pill tone={orderTone(order.status)}>{statusLabel(order.status)}</Pill>
                  </div>
                  <span className="text-[13px] text-ink-soft">
                    <span className="font-bold text-ink">For clinic stock</span>
                    {order.supplierName ? ` · from ${order.supplierName}` : ""}
                  </span>
                  {order.lines.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {order.lines.map((line) => (
                        <span
                          key={line.id}
                          className="rounded-lg bg-mint-soft px-[9px] py-[5px] text-xs font-semibold text-[#065f46] dark:text-emerald-300"
                        >
                          {line.name} × {line.quantity}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-row flex-wrap gap-x-6 gap-y-2.5 md:flex-col">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-xs text-ink-muted">Order date</span>
                    <span className="text-sm font-medium text-ink">{dateTimeLabel(order.orderedAt) || "—"}</span>
                  </div>
                  {order.expectedAt ? (
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-xs text-ink-muted">Expected</span>
                      <span className="text-sm font-bold text-ink">{dayLabel(order.expectedAt)}</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end">
                  <span className="text-lg font-extrabold text-ink">
                    {order.total !== null ? formatRupees(order.total) : "—"}
                  </span>
                  <Button variant="outline" onClick={() => onViewOrder(order)} aria-label={`View order ${order.reference}`}>
                    <Eye aria-hidden="true" />
                    View Details
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <Note tone="green" icon={CircleAlert}>
        To place an order, use <span className="font-bold">Order</span> on a partner pharmacy or on a medicine in the
        stock list.
      </Note>
    </div>
  );
}

// ── Partner pharmacies ─────────────────────────────────────────────────────

export interface PharmacyPartnersTabProps {
  suppliers: SupplierCard[];
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  canManage: boolean;
  onOrder: (supplier: SupplierCard) => void;
  onDetails: (supplier: SupplierCard) => void;
}

function ContactLine({ icon: Icon, children }: { icon: TbdIcon; children: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-[7px] text-[13px] text-ink-soft">
      <Icon className="size-3.5 shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * Board `PhInventoryPharmacies`. A partner pharmacy is a supplier of the clinic (`useSuppliers`):
 * name, address and contact details. Ratings, delivery times, fees and specialties are not in
 * the API, so those lines are left out.
 */
export function PharmacyPartnersTab({
  suppliers,
  loading = false,
  errorMessage = null,
  onRetry,
  canManage,
  onOrder,
  onDetails,
}: PharmacyPartnersTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="m-0 text-base font-bold text-ink">Partner Pharmacies Network</h2>
          <span className="text-[13px] font-medium text-ink-muted">
            Pharmacies you can order from when the clinic stock is short.
          </span>
        </div>
        {suppliers.length > 0 ? (
          <span className="text-xs font-bold text-ink-soft">
            {suppliers.length} {suppliers.length === 1 ? "partner" : "partners"}
          </span>
        ) : null}
      </div>

      {loading ? (
        <Surface aria-busy="true">
          <SkeletonList items={3} />
        </Surface>
      ) : errorMessage && suppliers.length === 0 ? (
        <Surface flush>
          <EmptyBlock
            icon={CircleAlert}
            title="Partner pharmacies could not be loaded"
            description={errorMessage}
            action={
              onRetry ? (
                <Button variant="outline" size="md" onClick={onRetry}>
                  Try again
                </Button>
              ) : undefined
            }
          />
        </Surface>
      ) : suppliers.length === 0 ? (
        <Surface flush>
          <EmptyBlock
            icon={Hospital}
            title="No partner pharmacies yet"
            description="A clinic admin can add the suppliers the clinic orders from. They show here once added."
          />
        </Surface>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((supplier) => {
            const hasContact = supplier.contactPerson || supplier.phone || supplier.email;
            return (
              <Surface key={supplier.id} as="article" aria-label={supplier.name}>
                <div className="flex items-start gap-3">
                  <IconBox icon={Hospital} tone="aqua" size={42} />
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-[5px]">
                    <h3 className="m-0 text-base font-extrabold leading-tight text-ink">{supplier.name}</h3>
                    <Pill tone="green">Partner</Pill>
                  </span>
                </div>
                <div className="flex min-h-[38px] gap-2 text-[13px] leading-[1.45] text-ink-soft">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
                  <span>{supplier.address || "Address not given"}</span>
                </div>
                <div className="flex flex-col gap-2 rounded-xl bg-[#f8fafc] px-3.5 py-3 dark:bg-white/5">
                  {supplier.contactPerson ? <ContactLine icon={UserRound}>{supplier.contactPerson}</ContactLine> : null}
                  {supplier.phone ? <ContactLine icon={Phone}>{supplier.phone}</ContactLine> : null}
                  {supplier.email ? <ContactLine icon={Mail}>{supplier.email}</ContactLine> : null}
                  {!hasContact ? <span className="text-[13px] text-ink-muted">No contact details given</span> : null}
                </div>
                <span className="text-xs font-bold text-ink-muted">
                  {supplier.medicines.length === 0
                    ? "No medicine in the stock list names this supplier"
                    : `Supplies ${supplier.medicines.length} ${supplier.medicines.length === 1 ? "medicine" : "medicines"} in the stock list`}
                </span>
                <div className="mt-auto flex flex-wrap gap-2 pt-0.5">
                  {canManage ? (
                    <Button className="h-10 flex-1" onClick={() => onOrder(supplier)} aria-label={`Order from ${supplier.name}`}>
                      <Truck aria-hidden="true" />
                      Order
                    </Button>
                  ) : null}
                  {supplier.phone ? (
                    <Button asChild variant="outline" className="h-10">
                      <a href={`tel:${supplier.phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${supplier.name}`}>
                        <Phone aria-hidden="true" />
                        Call
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="h-10"
                    onClick={() => onDetails(supplier)}
                    aria-label={`Details of ${supplier.name}`}
                  >
                    <Eye aria-hidden="true" />
                    Details
                  </Button>
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Analytics ──────────────────────────────────────────────────────────────

const BAR_AREA = 160;

/**
 * Board `PhInventoryAnalytics`. Sales figures come from `usePharmacySales`, which has no backend
 * route yet: the cards then say "not available yet" instead of showing numbers.
 */
export function PharmacyAnalyticsTab({ analytics, loading = false }: { analytics: AnalyticsSummary; loading?: boolean }) {
  const blank = "—";
  const peak = Math.max(1, ...(analytics.monthly ?? []).map((month) => month.amount));
  const topShare = Math.max(1, ...(analytics.categoryShare ?? []).map((category) => category.percent));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Total Revenue"
          value={analytics.revenueThisMonth !== null ? formatRupees(Math.round(analytics.revenueThisMonth)) : blank}
          hint={analytics.revenueThisMonth !== null ? "This month" : NOT_YET}
          icon={IndianRupee}
          tone="mint"
        />
        <Kpi
          label="Orders Today"
          value={loading || analytics.prescriptionsToday === null ? blank : analytics.prescriptionsToday}
          hint={loading ? "Loading" : analytics.prescriptionsToday === null ? NOT_YET : "Prescriptions received"}
          icon={FileText}
          tone="video"
        />
        <Kpi
          label="Pending Deliveries"
          value={analytics.pendingDeliveries !== null ? analytics.pendingDeliveries : blank}
          hint={analytics.pendingDeliveries !== null ? "In transit" : NOT_YET}
          icon={Truck}
          tone="amber"
        />
        <Kpi
          label="Top Selling"
          value={analytics.topSelling ?? blank}
          valueClassName={analytics.topSelling ? "text-base leading-[1.6]" : undefined}
          hint={analytics.topSelling ? "Most popular medicine" : NOT_YET}
          icon={Star}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
        <Surface as="section" className="gap-4" aria-label="Category performance">
          <CardHead
            icon={BarChart3}
            title="Category Performance"
            description="Share of medicine sales this month, by category"
          />
          {analytics.categoryShare && analytics.categoryShare.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-[25px] p-0 pt-1.5">
              {analytics.categoryShare.map((category) => (
                <li key={category.label} className="grid grid-cols-[minmax(0,120px)_minmax(0,1fr)_40px] items-center gap-3">
                  <span className="truncate text-[13px] font-semibold text-ink">{category.label}</span>
                  <span className="flex h-4 rounded bg-well" aria-hidden="true">
                    <span
                      className="rounded bg-[#047857] dark:bg-emerald-500"
                      style={{ width: `${Math.max(2, (category.percent / topShare) * 100)}%` }}
                    />
                  </span>
                  <span className="text-right text-[13px] font-extrabold text-ink">{category.percent}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBlock
              icon={BarChart3}
              title="Sales by category are not available yet"
              description="This chart fills in when medicine sales are recorded for the clinic."
              className="my-auto"
            />
          )}
        </Surface>

        <Surface as="section" className="gap-4" aria-label="Monthly trends">
          <CardHead icon={Activity} title="Monthly Trends" description="Medicine sales in each of the last six months" />
          {analytics.monthly && analytics.monthly.length > 0 ? (
            <div className="flex flex-col gap-2">
              <ul className="m-0 flex h-[196px] list-none items-end gap-2 border-b border-line p-0">
                {analytics.monthly.map((month) => (
                  <li key={month.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="whitespace-nowrap text-xs font-bold text-ink">
                      {formatRupees(Math.round(month.amount))}
                    </span>
                    <span
                      className={
                        month.current
                          ? "w-full max-w-11 rounded-t bg-[repeating-linear-gradient(135deg,#047857_0_6px,#34d399_6px_12px)]"
                          : "w-full max-w-11 rounded-t bg-[#047857] dark:bg-emerald-500"
                      }
                      style={{ height: Math.max(4, Math.round((month.amount / peak) * BAR_AREA)) }}
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ul>
              <div className="flex gap-2" aria-hidden="true">
                {analytics.monthly.map((month) => (
                  <span key={month.key} className="flex-1 text-center text-xs text-ink-muted">
                    {month.label}
                  </span>
                ))}
              </div>
              <span className="text-xs font-medium text-ink-muted">The striped bar is this month so far.</span>
            </div>
          ) : (
            <EmptyBlock
              icon={Activity}
              title="Monthly sales are not available yet"
              description="This chart fills in when medicine sales are recorded for the clinic."
              className="my-auto"
            />
          )}
        </Surface>
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────────────────

export interface PharmacySettingsInfo {
  appVersion: string;
  /** Null while suppliers are loading or could not be read. */
  partnerCount: number | null;
  medicineCount: number | null;
  /** When the stock list was last read from the server (ISO). */
  lastSyncedAt: string | null;
}

const SETTING_GROUPS: { title: string; rows: { icon: TbdIcon; title: string; description: string }[] }[] = [
  {
    title: "Inventory Management",
    rows: [
      { icon: Bell, title: "Stock Alert Settings", description: "When to warn about low stock and expiry" },
      { icon: Package, title: "Auto Reorder Settings", description: "Order again when a medicine reaches its minimum" },
    ],
  },
  {
    title: "Delivery & Orders",
    rows: [
      { icon: Truck, title: "Delivery Settings", description: "Delivery partners, charges and timings" },
      { icon: CreditCard, title: "Payment Gateway", description: "How online payments for medicines are taken" },
    ],
  },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-hair py-2.5 text-[13px] last:border-b-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="m-0 text-right font-bold text-ink">{value}</dd>
    </div>
  );
}

/**
 * Board `PhInventorySettings`. None of the four settings has a backend endpoint, so each row is
 * shown as not available yet (no screen that pretends to save). System information shows only
 * what is known: the app version, supplier and medicine counts, and the last stock-list load.
 */
export function PharmacySettingsTab({ info }: { info: PharmacySettingsInfo }) {
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        {SETTING_GROUPS.map((group) => (
          <Surface key={group.title} as="section" className="gap-1" aria-label={group.title}>
            <h2 className="m-0 text-base font-bold text-ink">{group.title}</h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {group.rows.map((row) => (
                <li
                  key={row.title}
                  className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-hair py-3.5 last:border-b-0"
                >
                  <IconBox icon={row.icon} tone="mint" size={42} className="bg-mint-soft" />
                  <span className="flex min-w-0 flex-1 basis-[180px] flex-col gap-px">
                    <span className="text-sm font-bold text-ink">{row.title}</span>
                    <span className="text-xs font-medium text-ink-muted">{row.description}</span>
                  </span>
                  <Pill tone="slate">{NOT_YET}</Pill>
                </li>
              ))}
            </ul>
          </Surface>
        ))}
      </div>

      <Surface as="section" className="gap-1.5" aria-label="System information">
        <h2 className="m-0 text-base font-bold text-ink">System Information</h2>
        <dl className="m-0 flex flex-col">
          <InfoRow label="Pharmacy System Version" value={`v${info.appVersion}`} />
          <InfoRow
            label="Partner Pharmacies"
            value={info.partnerCount !== null ? `${info.partnerCount} active` : "—"}
          />
          <InfoRow label="Medicines in Stock List" value={info.medicineCount !== null ? String(info.medicineCount) : "—"} />
          <InfoRow label="Last Inventory Sync" value={dateTimeLabel(info.lastSyncedAt) || "—"} />
        </dl>
      </Surface>
    </div>
  );
}
