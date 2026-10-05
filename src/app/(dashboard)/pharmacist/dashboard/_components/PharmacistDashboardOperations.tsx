import Link from "next/link";
import { CalendarClock, ChevronRight, History, Search } from "lucide-react";
import { Surface, type TbdIcon } from "@/components/tbd";
import type { InventorySummary } from "./pharmacist-dashboard.logic";

interface PharmacistDashboardOperationsProps {
  inventory: InventorySummary;
  /** True while the inventory is still loading, so no count is shown yet. */
  inventoryLoading?: boolean;
  inventoryHref: string;
  historyHref: string;
  expiryHref: string;
}

function findMedicineText(inventory: InventorySummary, loading: boolean): string {
  if (loading || inventory.totalMedicines === 0) return "Search the inventory";
  const noun = inventory.totalMedicines === 1 ? "medicine" : "medicines";
  return `Inventory: ${inventory.totalMedicines} ${noun}, ${inventory.inStock} in stock`;
}

function expiryText(inventory: InventorySummary, loading: boolean): string {
  if (loading || inventory.expiringSoon === null) return "Medicines close to their expiry date";
  if (inventory.expiringSoon === 0) return "Nothing expires within 90 days";
  return inventory.expiringSoon === 1
    ? "1 medicine expires within 90 days"
    : `${inventory.expiringSoon} medicines expire within 90 days`;
}

function OperationLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: TbdIcon;
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg py-[9px] text-ink hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <Icon className="size-[18px] shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-ink-muted">{description}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-ink-muted" strokeWidth={2.2} aria-hidden="true" />
      </Link>
    </li>
  );
}

/** Quick links to the inventory and the prescription history. */
export function PharmacistDashboardOperations({
  inventory,
  inventoryLoading = false,
  inventoryHref,
  historyHref,
  expiryHref,
}: PharmacistDashboardOperationsProps) {
  return (
    <Surface as="section" className="gap-1.5 p-[18px]" aria-labelledby="pharmacy-operations-title">
      <h2 id="pharmacy-operations-title" className="m-0 text-base font-bold text-ink">
        Pharmacy Operations
      </h2>
      <ul className="m-0 flex list-none flex-col p-0">
        <OperationLink
          href={inventoryHref}
          icon={Search}
          title="Find Medicine"
          description={findMedicineText(inventory, inventoryLoading)}
        />
        <OperationLink
          href={historyHref}
          icon={History}
          title="History"
          description="Dispensed and cancelled prescriptions"
        />
        <OperationLink
          href={expiryHref}
          icon={CalendarClock}
          title="Expiry"
          description={expiryText(inventory, inventoryLoading)}
        />
      </ul>
    </Surface>
  );
}
