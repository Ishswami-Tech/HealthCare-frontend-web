"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download, FileText, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CellTitle,
  DateField,
  EmptyBlock,
  FilterChips,
  GridHead,
  GridRow,
  InitialsAvatar,
  LoadError,
  Pager,
  SearchBox,
  SkeletonRows,
  Surface,
  TbdPage,
  serverPaging,
} from "@/components/tbd";
import { BillingAdminNav, InvoiceStatusPill } from "@/components/billing/clinic-admin/BillingAdminNav";
import { downloadCsv, invoiceStatusKey, toCsv, type InvoiceStatusKey } from "@/components/billing/clinic-admin/billing-admin.logic";
import { invoiceNumberLabel } from "@/components/billing/staff/billing.logic";
import { fetchAllClinicInvoices, useClinicInvoicePage, type ClinicInvoicePageParams } from "@/hooks/query/useBilling";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useDebouncedValue } from "@/hooks/core/useDebouncedValue";
import { useSendInvoiceReminders } from "@/hooks/query/useClinicAdminBilling";
import { formatRupees } from "@/lib/utils/currency";
import { formatDateTimeLabel } from "@/lib/utils/date-time";
import type { Invoice } from "@/types/billing.types";

type StatusFilter = "ALL" | "PAID" | "PENDING" | "REFUNDED";
const COLUMNS = "36px 1.1fr 1.6fr 1.2fr 1fr 0.9fr 1fr";

const description = (invoice: Invoice) =>
  String((invoice as Invoice & { description?: string }).description ?? invoice.items?.[0]?.description ?? "Invoice");

const matchesStatus = (key: InvoiceStatusKey, filter: StatusFilter) =>
  filter === "ALL" || (filter === "PENDING" ? key === "PENDING" || key === "PARTIAL" : key === filter);

/** Chip -> server status (stored statuses are PENDING | PAID | VOID; nothing is ever REFUNDED). */
const SERVER_STATUS: Record<StatusFilter, ClinicInvoicePageParams["status"]> = {
  ALL: undefined,
  PAID: "PAID",
  PENDING: "PENDING",
  REFUNDED: undefined,
};

// CaInvoices (B1): every invoice of the clinic, search / status / date filters, remind selected unpaid.
export default function CaInvoicesPage() {
  return (
    <Suspense fallback={null}>
      <CaInvoices />
    </Suspense>
  );
}

function CaInvoices() {
  const params = useSearchParams();
  const initialStatus = (params?.get("status")?.toUpperCase() as StatusFilter) || "ALL";
  const [status, setStatus] = useState<StatusFilter>(["ALL", "PAID", "PENDING", "REFUNDED"].includes(initialStatus) ? initialStatus : "ALL");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const clinicId = useCurrentClinicId();
  const remind = useSendInvoiceReminders();
  const term = useDebouncedValue(search.trim(), 300);
  // No invoice is ever stored as REFUNDED: that chip is always empty, nothing to ask for.
  const refundedOnly = status === "REFUNDED";

  // Filtered, counted and paged by the server (GET /billing/invoices/clinic?page=…).
  const filters = useMemo(() => {
    const serverStatus = SERVER_STATUS[status];
    return {
      ...(serverStatus ? { status: serverStatus } : {}),
      ...(term ? { q: term } : {}),
      ...(from ? { dateFrom: from } : {}),
      ...(to ? { dateTo: to } : {}),
    };
  }, [status, term, from, to]);
  const resetKey = `${status}|${term}|${from}|${to}`;
  const [appliedResetKey, setAppliedResetKey] = useState(resetKey);
  if (appliedResetKey !== resetKey) {
    setAppliedResetKey(resetKey);
    setPage(1);
  }
  const invoices = useClinicInvoicePage({ ...filters, page, limit: pageSize }, !refundedOnly);
  const filtered = useMemo(() => (refundedOnly ? [] : (invoices.data?.rows ?? [])), [refundedOnly, invoices.data]);
  const serverCounts = invoices.data?.counts;
  const counts = {
    ALL: serverCounts?.all ?? 0,
    PAID: serverCounts?.PAID ?? 0,
    PENDING: serverCounts?.PENDING ?? 0,
    REFUNDED: 0,
  };

  const paging = {
    ...serverPaging({
      page,
      pageSize,
      total: refundedOnly ? 0 : (invoices.data?.total ?? 0),
      rowCount: filtered.length,
      onPageChange: setPage,
    }),
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    pageRows: filtered,
  };
  const unpaidOnPage = paging.pageRows.filter((invoice) => matchesStatus(invoiceStatusKey(invoice.status), "PENDING"));

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Every invoice matching the filters, not only the page on screen.
  const exportCsv = async () => {
    const rows = refundedOnly ? [] : await fetchAllClinicInvoices(clinicId ?? undefined, filters);
    downloadCsv(
      "invoices.csv",
      toCsv(
        ["Invoice", "Patient", "Service", "Date", "Amount", "Status"],
        rows.map((invoice) => [invoiceNumberLabel(invoice), invoice.patientName ?? "", description(invoice), invoice.createdAt, invoice.amount, invoice.status]),
      ),
    );
  };

  const remindSelected = async () => {
    await remind.mutateAsync({ invoiceIds: [...selected], input: { channel: "WHATSAPP", language: "en" } });
    setSelected(new Set());
  };

  return (
    <TbdPage
      title="All invoices"
      description={`${counts.ALL} invoices · ${counts.PAID} paid · ${counts.PENDING} unpaid`}
      backHref="/clinic-admin/billing"
      backLabel="Billing"
      actions={
        <>
          <Button variant="outline" size="md" onClick={() => void exportCsv()} disabled={filtered.length === 0}>
            <Download aria-hidden="true" /> Export CSV
          </Button>
          <Button asChild size="md">
            <Link href="/clinic-admin/billing/new">
              <Plus aria-hidden="true" /> New invoice
            </Link>
          </Button>
        </>
      }
    >
      <BillingAdminNav />

      <Surface flush as="section" aria-label="Invoices">
        <div className="flex flex-col gap-3 border-b border-hair p-4 lg:flex-row lg:items-center">
          <SearchBox value={search} onChange={setSearch} placeholder="Search invoice no. or patient name" ariaLabel="Search invoices" className="lg:max-w-sm" />
          <div className="flex gap-2">
            <DateField id="inv-from" variant="inline" label="From" value={from} onChange={setFrom} {...(to ? { max: to } : {})} />
            <DateField id="inv-to" variant="inline" label="To" value={to} onChange={setTo} {...(from ? { min: from } : {})} />
          </div>
          <FilterChips
            ariaLabel="Invoice status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "ALL", label: "All", count: counts.ALL },
              { value: "PAID", label: "Paid", count: counts.PAID },
              { value: "PENDING", label: "Pending", count: counts.PENDING },
              { value: "REFUNDED", label: "Refunded", count: counts.REFUNDED },
            ]}
          />
        </div>

        {selected.size > 0 ? (
          <div className="flex items-center justify-between gap-3 border-b border-hair bg-mint-soft px-5 py-2.5 text-sm">
            <span className="font-bold text-ink">{selected.size} unpaid selected</span>
            <Button size="sm" onClick={() => void remindSelected()} disabled={remind.isPending}>
              <Send aria-hidden="true" /> {remind.isPending ? "Sending…" : "Remind on WhatsApp"}
            </Button>
          </div>
        ) : null}

        {!refundedOnly && invoices.isPending ? (
          <div className="p-5">
            <SkeletonRows rows={6} />
          </div>
        ) : !refundedOnly && invoices.error ? (
          <div className="p-5">
            <LoadError title="Invoices could not be loaded" message={invoices.error.message} onRetry={() => void invoices.refetch()} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyBlock icon={FileText} title="No invoices match" description="Change the filters or raise a new invoice." />
        ) : (
          <div role="table" aria-label="Invoices">
            <GridHead
              columns={COLUMNS}
              labels={[
                <Checkbox
                  key="all"
                  aria-label="Select unpaid on this page"
                  checked={unpaidOnPage.length > 0 && unpaidOnPage.every((invoice) => selected.has(invoice.id))}
                  onCheckedChange={(checked) =>
                    setSelected((current) => {
                      const next = new Set(current);
                      unpaidOnPage.forEach((invoice) => (checked ? next.add(invoice.id) : next.delete(invoice.id)));
                      return next;
                    })
                  }
                />,
                "Invoice",
                "Patient",
                "Service",
                "Date",
                "Amount",
                "Status",
              ]}
            />
            {paging.pageRows.map((invoice) => {
              const unpaid = matchesStatus(invoiceStatusKey(invoice.status), "PENDING");
              const href = `/clinic-admin/billing/invoices/${invoice.id}`;
              return (
                <GridRow key={invoice.id} columns={COLUMNS}>
                  <span>
                    {unpaid ? <Checkbox aria-label={`Select ${invoiceNumberLabel(invoice)}`} checked={selected.has(invoice.id)} onCheckedChange={() => toggle(invoice.id)} /> : null}
                  </span>
                  <Link href={href} className="font-extrabold text-brand hover:underline">
                    {invoiceNumberLabel(invoice)}
                  </Link>
                  <CellTitle left={<InitialsAvatar name={invoice.patientName ?? "Patient"} size={32} />} title={invoice.patientName ?? "Patient"} />
                  <span className="truncate text-ink-soft">{description(invoice)}</span>
                  <span className="text-ink-soft">{formatDateTimeLabel(invoice.createdAt)}</span>
                  <span className="font-extrabold text-ink">{formatRupees(invoice.amount)}</span>
                  <InvoiceStatusPill status={invoice.status} />
                </GridRow>
              );
            })}
            <div className="p-4">
              <Pager paging={paging} noun="invoices" pageSizeOptions={[25, 50, 100]} id="ca-invoices-pager" />
            </div>
          </div>
        )}
      </Surface>
    </TbdPage>
  );
}
