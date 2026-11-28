"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, Receipt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyBlock,
  InitialsAvatar,
  ListRow,
  LoadError,
  Pill,
  SectionTitle,
  SkeletonRows,
  StatTile,
  statusLabel,
  statusTone,
  SummaryLine,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { RecordInvoicePaymentDialog } from "@/components/billing/RecordInvoicePaymentDialog";
import { formatRupees } from "@/components/appointments/booking/format";
import { usePatientBills } from "@/hooks/query/usePatientBilling";
import { PatientPlanStatus } from "@/components/billing/PatientPlanStatus";
import { SellPlanAtDesk } from "@/components/billing/SellPlanAtDesk";
import { usePatient } from "@/hooks/query/usePatients";
import { formatDateInIST } from "@/lib/utils/date-time";
import type { PatientBillRow } from "@/types/billing.types";
import { readPatientContact } from "@/components/receptionist/reception.logic";
import { NoClinicalRecordsNote } from "@/components/receptionist/ReceptionNotes";
import {
  RECEPTION_ROUTES,
  todayKey,
  useReceptionLocation,
  useReceptionVisits,
} from "@/components/receptionist/useReceptionDesk";
import { DeskFeeDuePill, DeskFeesDueRows, deskFeeAmount, useDeskFeesToday } from "@/components/receptionist/DeskFeeCollect";

/**
 * Unpaid desk fees of today at this location (plan-less walk-ins under the clinic's desk-fee rule),
 * whatever the visit stage: the desk can collect at arrival or at checkout. Hidden when none is due.
 */
function DeskFeesToday() {
  const { clinicId } = useReceptionLocation();
  const { fees, totalDue, isPending, error, refetch } = useDeskFeesToday();
  if (isPending) return <SkeletonRows rows={2} />;
  if (error && fees.length === 0) {
    return (
      <LoadError
        title="Desk fees could not be loaded"
        message={error instanceof Error ? error.message : undefined}
        onRetry={() => void refetch()}
      />
    );
  }
  if (fees.length === 0) return null;
  return (
    <Surface as="section" aria-label="Desk fees to collect">
      <SectionTitle
        title="Desk fees to collect"
        count={fees.length}
        description={`${deskFeeAmount(totalDue)} due today. Patients without an active plan pay the clinic's desk fee at the counter; the visit goes ahead either way.`}
      />
      <DeskFeesDueRows clinicId={clinicId} fees={fees} />
    </Surface>
  );
}

/**
 * Visits the doctor completed today at this location. A plan covers the in-clinic consultation; a
 * plan-less visit carries a desk fee, tagged here until it is collected. Other open bills too.
 */
function CompletedToday() {
  const { visits, isLoading, error, refetch } = useReceptionVisits({ from: todayKey() });
  const { byAppointment } = useDeskFeesToday();
  const completed = visits.filter((visit) => visit.stage === "completed" && visit.kind === "clinic").reverse();
  return (
    <Surface as="section" aria-label="Completed today">
      <SectionTitle
        title="Completed today"
        count={completed.length}
        description="In-clinic visits the doctor has completed. Pick one to see the patient's plan and any open bill."
      />
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : error && completed.length === 0 ? (
        <LoadError title="Visits could not be loaded" message={error.message} onRetry={() => void refetch()} />
      ) : completed.length === 0 ? (
        <EmptyBlock icon={Wallet} title="Nothing to collect yet" description="Completed visits show here as the doctor finishes them." />
      ) : (
        <div>
          {completed.map((visit) => (
            <ListRow
              key={visit.id}
              href={RECEPTION_ROUTES.collect(visit.patientUserId, visit.id)}
              left={<InitialsAvatar name={visit.patientName} size={36} />}
              title={visit.patientName}
              description={[visit.doctorName, visit.timeLabel, visit.tokenLabel].filter(Boolean).join(" · ")}
              right={byAppointment.get(visit.id) ? <DeskFeeDuePill fee={byAppointment.get(visit.id)} /> : <Pill tone="slate">Open</Pill>}
            />
          ))}
        </div>
      )}
    </Surface>
  );
}

function BillCard({ bill, onCollect }: { bill: PatientBillRow; onCollect: (bill: PatientBillRow) => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <FileText className="size-4 text-brand" aria-hidden="true" />
        <span className="text-sm font-bold text-ink">{bill.invoiceNumber || "Bill"}</span>
        <Pill tone="slate">{statusLabel(bill.billType)}</Pill>
        <Pill tone={statusTone(bill.status)}>{statusLabel(bill.status)}</Pill>
        <span className="ml-auto text-xs text-ink-muted">{formatDateInIST(bill.date)}</span>
      </div>
      {bill.description ? <span className="text-[13px] text-ink-soft">{bill.description}</span> : null}
      <div className="flex flex-col gap-1.5">
        <SummaryLine label="Subtotal" value={formatRupees(bill.subtotal)} />
        {bill.discount > 0 ? <SummaryLine label="Discount" value={`− ${formatRupees(bill.discount)}`} /> : null}
        {bill.tax > 0 ? <SummaryLine label="Tax" value={formatRupees(bill.tax)} /> : null}
        {bill.paidAmount > 0 ? <SummaryLine label="Already paid" value={formatRupees(bill.paidAmount)} /> : null}
        <SummaryLine label="To collect" value={formatRupees(bill.balance)} bold />
      </div>
      <Button size="md" className="self-end" onClick={() => onCollect(bill)}>
        <Wallet aria-hidden="true" /> Collect {formatRupees(bill.balance)}
      </Button>
    </div>
  );
}

/** The bill the Collect dialog is open for (a listed bill, or a plan bill just opened at the desk). */
interface CollectTarget {
  id: string;
  invoiceNumber?: string | null;
  balance: number;
}

/** `patientUserId` is the patient's User.id (the `GET /patients/:id` key); bills use the Patient-record id. */
function PatientCollect({ patientUserId }: { patientUserId: string }) {
  const { clinicId } = useReceptionLocation();
  const patient = usePatient(clinicId, patientUserId);
  const contact = useMemo(() => readPatientContact(patient.data), [patient.data]);
  const bills = usePatientBills(clinicId, contact?.patientId ?? "", { limit: 50 });
  const [collecting, setCollecting] = useState<CollectTarget | null>(null);
  // Open invoices only (desk fee of a plan-less visit, plan renewals, pharmacy, lab ...). A visit
  // covered by the monthly plan has no consultation bill. A VOID / PAID bill is never offered.
  const due = (bills.data?.rows ?? []).filter(
    (bill) => bill.source === "INVOICE" && bill.balance > 0 && (bill.status === "PENDING" || bill.status === "PARTIAL"),
  );
  const total = due.reduce((sum, bill) => sum + bill.balance, 0);

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Surface as="section" aria-label="Bills to collect" className="gap-4">
        <div className="flex items-center gap-3">
          <InitialsAvatar name={contact?.name} size={44} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-base font-extrabold text-ink">
              {contact?.name ?? (patient.isPending ? "Loading patient…" : "Patient")}
            </span>
            <span className="truncate text-xs text-ink-muted">
              {contact?.phone || (patient.isPending ? " " : patient.error instanceof Error ? patient.error.message : "No phone")}
            </span>
          </div>
          <Button asChild variant="ghost" size="md">
            <Link href={RECEPTION_ROUTES.patient(patientUserId)}>View patient</Link>
          </Button>
        </div>

        <PatientPlanStatus clinicId={clinicId} patientUserId={contact?.userId || patientUserId} />
        {/* Desk fallback: no plan yet -> sell one here and collect cash / UPI at the counter. */}
        <SellPlanAtDesk
          clinicId={clinicId}
          patientUserId={contact?.userId || patientUserId}
          onInvoiceReady={(invoice) => {
            const paid = due.find((bill) => bill.id === invoice.id)?.paidAmount ?? 0;
            setCollecting({
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber ?? null,
              balance: Math.max(0, invoice.totalAmount - paid),
            });
            void bills.refetch();
          }}
        />

        {patient.isPending || bills.isPending ? (
          <SkeletonRows rows={3} />
        ) : bills.error ? (
          <LoadError
            title="Bills could not be loaded"
            message={bills.error instanceof Error ? bills.error.message : undefined}
            onRetry={() => void bills.refetch()}
          />
        ) : due.length === 0 ? (
          <EmptyBlock
            icon={Receipt}
            title="Nothing to collect"
            description="This patient has no open bill (no desk fee, pharmacy or plan bill is due)."
          />
        ) : (
          due.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onCollect={(row) => setCollecting({ id: row.id, invoiceNumber: row.invoiceNumber, balance: row.balance })}
            />
          ))
        )}
        <p className="m-0 text-xs text-ink-muted">Only billing lines are shown. Diagnosis and prescription stay with the doctor.</p>
      </Surface>

      <div className="flex flex-col gap-5">
        <StatTile value={formatRupees(total)} label="Total to collect" hint={`${due.length} open bill${due.length === 1 ? "" : "s"}`} tone="brand" />
        <NoClinicalRecordsNote />
      </div>

      {collecting ? (
        <RecordInvoicePaymentDialog
          clinicId={clinicId}
          invoiceId={collecting.id}
          invoiceNumber={collecting.invoiceNumber}
          balance={collecting.balance}
          open
          onOpenChange={(open) => {
            if (!open) setCollecting(null);
          }}
          onRecorded={() => {
            setCollecting(null);
            void bills.refetch();
          }}
        />
      ) : null}
    </div>
  );
}

function CollectContent() {
  const params = useSearchParams();
  const patientUserId = params.get("patientId") ?? "";
  return patientUserId ? (
    <PatientCollect patientUserId={patientUserId} />
  ) : (
    <div className="flex flex-col gap-5">
      <DeskFeesToday />
      <CompletedToday />
    </div>
  );
}

/**
 * RecBillingHandoff: the desk collects today's unpaid desk fees (plan-less visits, amount from clinic
 * settings) and, after the doctor completes a visit, checks the patient's monthly in-person plan and
 * collects any open bill (records only, no gateway).
 */
export default function ReceptionCollectPage() {
  return (
    <TbdPage
      title="Collect payment"
      description="Collect desk fees and any open bill at the desk, check the patient's in-person plan, then send the receipt."
      backHref={RECEPTION_ROUTES.dashboard}
      backLabel="Dashboard"
    >
      <Suspense fallback={<SkeletonRows rows={3} />}>
        <CollectContent />
      </Suspense>
    </TbdPage>
  );
}
