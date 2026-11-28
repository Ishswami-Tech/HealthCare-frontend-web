"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Pill, type PillTone } from "@/components/tbd";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, invoiceStatusKey } from "./billing-admin.logic";

const TABS = [
  { href: "/clinic-admin/billing", label: "Overview", exact: true },
  { href: "/clinic-admin/billing/invoices", label: "Invoices", exact: false },
  { href: "/clinic-admin/billing/reminders", label: "Reminders", exact: true },
  { href: "/clinic-admin/reports", label: "Reports", exact: true },
] as const;

/** Overview / Invoices / Reminders / Reports switch shared by the clinic admin billing screens. */
export function BillingAdminNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Billing sections" className={cn("inline-flex w-fit flex-wrap gap-1 rounded-xl bg-well p-1", className)}>
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-9 items-center rounded-[10px] px-3.5 text-[13px] font-bold transition-colors",
              active ? "bg-card text-ink shadow-card" : "text-ink-muted hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Status pill of an invoice: "Paid · UPI", "Pending", "Part paid". */
export function InvoiceStatusPill({ status, method }: { status: unknown; method?: string | null }) {
  const key = invoiceStatusKey(status);
  const tone: PillTone = INVOICE_STATUS_TONE[key];
  return (
    <Pill tone={tone}>
      {INVOICE_STATUS_LABEL[key]}
      {key === "PAID" && method ? ` · ${method}` : ""}
    </Pill>
  );
}
