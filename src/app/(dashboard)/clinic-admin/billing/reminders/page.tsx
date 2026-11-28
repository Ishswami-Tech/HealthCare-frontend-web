"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ChoiceChip,
  EmptyBlock,
  FilterChips,
  GridHead,
  GridRow,
  LoadError,
  Note,
  Pill,
  SectionTitle,
  SkeletonRows,
  StatTile,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { BillingAdminNav } from "@/components/billing/clinic-admin/BillingAdminNav";
import {
  filterOverdue,
  OVERDUE_DAYS,
  reminderMessage,
  type ReminderFilter,
} from "@/components/billing/clinic-admin/billing-admin.logic";
import { useOverdueInvoices, useSendInvoiceReminders } from "@/hooks/query/useClinicAdminBilling";
import { useCurrentClinic } from "@/hooks/query/useClinics";
import { formatRupees } from "@/lib/utils/currency";
import { formatDateLabel } from "@/lib/utils/date-time";
import type { ReminderChannel, ReminderLanguage } from "@/types/clinic-admin-ops.types";

const COLUMNS = "36px 1fr 1.6fr 0.8fr 0.8fr 0.8fr";
type ChannelChoice = ReminderChannel | "BOTH";

// CaSendReminders (B1): WhatsApp / SMS payment reminders for unpaid invoices, now or scheduled.
export default function CaSendRemindersPage() {
  const overdue = useOverdueInvoices();
  const clinic = useCurrentClinic();
  const send = useSendInvoiceReminders();
  const [filter, setFilter] = useState<ReminderFilter>("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<ChannelChoice>("WHATSAPP");
  const [language, setLanguage] = useState<ReminderLanguage>("en");
  const [when, setWhen] = useState<"NOW" | "LATER">("NOW");
  const [scheduledFor, setScheduledFor] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const all = useMemo(() => overdue.data ?? [], [overdue.data]);
  const rows = useMemo(() => filterOverdue(all, filter), [all, filter]);

  useEffect(() => {
    // Everything starts selected, as on the board.
    setSelected(new Set(all.map((row) => row.invoiceId)));
  }, [all]);

  const totalPending = all.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const first = rows.find((row) => selected.has(row.invoiceId)) ?? rows[0];
  const clinicName = String((clinic.data as { name?: string } | null | undefined)?.name ?? "the clinic");
  const preview = first
    ? reminderMessage(
        {
          patientName: first.patientName,
          clinicName,
          invoiceNumber: first.invoiceNumber,
          amountLabel: formatRupees(first.amount),
          sinceLabel: formatDateLabel(first.dueDate),
        },
        language,
      )
    : "";

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = rows.filter((row) => selected.has(row.invoiceId)).map((row) => row.invoiceId);

  const submit = async () => {
    setResult(null);
    const channels: ReminderChannel[] = channel === "BOTH" ? ["WHATSAPP", "SMS"] : [channel];
    const schedule = when === "LATER" && scheduledFor ? { scheduledFor: new Date(scheduledFor).toISOString() } : {};
    let sent = 0;
    let failed = 0;
    for (const entry of channels) {
      const outcome = await send.mutateAsync({ invoiceIds: chosen, input: { channel: entry, language, ...schedule } });
      sent += outcome.sent;
      failed += outcome.failed.length;
    }
    setResult(failed > 0 ? `${sent} reminders queued, ${failed} could not be sent.` : `${sent} reminders queued.`);
  };

  return (
    <TbdPage title="Remind patients about unpaid invoices" backHref="/clinic-admin/billing" backLabel="Billing">
      <BillingAdminNav />
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Unpaid invoices" value={overdue.isPending ? "…" : all.length} />
        <StatTile tone="amber" label="Total pending" value={formatRupees(totalPending)} />
        <StatTile tone="rose" label={`Overdue ${OVERDUE_DAYS}+ days`} value={filterOverdue(all, "OVERDUE").length} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Surface flush as="section" aria-label="Select invoices">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <SectionTitle title="Select invoices" />
            <FilterChips
              ariaLabel="Filter unpaid invoices"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "ALL", label: "All", count: all.length },
                { value: "OVERDUE", label: "Overdue", count: filterOverdue(all, "OVERDUE").length },
                { value: "NEVER", label: "Never reminded", count: filterOverdue(all, "NEVER").length },
              ]}
            />
          </div>
          {overdue.isPending ? (
            <div className="p-5">
              <SkeletonRows rows={6} />
            </div>
          ) : overdue.error ? (
            <div className="p-5">
              <LoadError title="Unpaid invoices could not be loaded" message={overdue.error.message} onRetry={() => void overdue.refetch()} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyBlock icon={BellRing} title="Nothing to remind" description="No unpaid invoices match this filter." />
          ) : (
            <div role="table" aria-label="Unpaid invoices">
              <GridHead
                columns={COLUMNS}
                labels={[
                  <Checkbox
                    key="all"
                    aria-label="Select all"
                    checked={rows.every((row) => selected.has(row.invoiceId))}
                    onCheckedChange={(checked) => setSelected(checked ? new Set(rows.map((row) => row.invoiceId)) : new Set())}
                  />,
                  "Invoice",
                  "Patient",
                  "Amount",
                  "Age",
                  "Reminded",
                ]}
              />
              {rows.map((row) => (
                <GridRow key={row.invoiceId} columns={COLUMNS}>
                  <Checkbox aria-label={`Select ${row.invoiceNumber}`} checked={selected.has(row.invoiceId)} onCheckedChange={() => toggle(row.invoiceId)} />
                  <span className="font-extrabold text-ink">{row.invoiceNumber}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-ink">{row.patientName}</span>
                    <span className="text-xs text-ink-muted">{row.patientPhone ?? "No phone"}</span>
                  </span>
                  <span className="font-extrabold">{formatRupees(row.amount)}</span>
                  <Pill tone={row.daysOverdue >= OVERDUE_DAYS ? "rose" : "amber"}>{row.daysOverdue <= 0 ? "Today" : `${row.daysOverdue} days`}</Pill>
                  <span className="text-ink-soft">{row.remindersSent > 0 ? `${row.remindersSent}×` : "Never"}</span>
                </GridRow>
              ))}
            </div>
          )}
        </Surface>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Channel and language">
            <SectionTitle title="Channel & language" />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Send via">
              {(["WHATSAPP", "SMS", "BOTH"] as const).map((value) => (
                <ChoiceChip key={value} active={channel === value} onClick={() => setChannel(value)}>
                  {value === "WHATSAPP" ? "WhatsApp" : value === "SMS" ? "SMS" : "Both"}
                </ChoiceChip>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Message language">
              {([
                ["en", "English"],
                ["mr", "मराठी"],
                ["hi", "हिन्दी"],
              ] as const).map(([value, label]) => (
                <ChoiceChip key={value} active={language === value} onClick={() => setLanguage(value)}>
                  {label}
                </ChoiceChip>
              ))}
            </div>
            {preview ? (
              <div className="mt-3 rounded-[14px] bg-mint-soft p-3 text-sm text-ink">
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">Preview</p>
                {preview}
              </div>
            ) : null}
            <Note tone="blue" className="mt-3">Each patient&apos;s name, amount and date are filled in automatically.</Note>
          </Surface>

          <Surface as="section" aria-label="When to send">
            <SectionTitle title="When to send" />
            <div className="flex gap-2">
              <ChoiceChip active={when === "NOW"} onClick={() => setWhen("NOW")}>Send now</ChoiceChip>
              <ChoiceChip active={when === "LATER"} onClick={() => setWhen("LATER")}>Schedule for later</ChoiceChip>
            </div>
            {when === "LATER" ? (
              <Input className="mt-2" type="datetime-local" aria-label="Send at" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
            ) : null}
            {result ? <Note tone="green" className="mt-3">{result}</Note> : null}
            <Button
              className="mt-3 w-full"
              disabled={chosen.length === 0 || send.isPending || (when === "LATER" && !scheduledFor)}
              onClick={() => void submit()}
            >
              <Send aria-hidden="true" /> {send.isPending ? "Sending…" : `Send ${chosen.length} reminder${chosen.length === 1 ? "" : "s"}`}
            </Button>
          </Surface>
        </div>
      </div>
    </TbdPage>
  );
}
