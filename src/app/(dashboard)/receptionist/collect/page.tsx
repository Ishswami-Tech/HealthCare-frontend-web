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

/**
 * Visits the doctor completed today at this location. In-clinic consultations are covered by the
 * patient's monthly in-person plan (no per-visit fee): the desk only collects other open bills.
 */
function CompletedToday() {
  const { visits, isLoading, error, refetch } = useReceptionVisits({ from: todayKey() });
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
              right={<Pill tone="slate">Open</Pill>}
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

/** `patientUserId` is the patient's User.id (the `GET /patients/:id` key); bills use the Patient-record id. */
function PatientCollect({ patientUserId }: { patientUserId: string }) {
  const { clinicId } = useReceptionLocation();
  const patient = usePatient(clinicId, patientUserId);
  const contact = useMemo(() => readPatientContact(patient.data), [patient.data]);
  const bills = usePatientBills(clinicId, contact?.patientId ?? "", { limit: 50 });
  const [collecting, setCollecting] = useState<PatientBillRow | null>(null);
  // Open invoices only (plan renewals, pharmacy, lab ...). No consultation bill is raised here: the
  // in-person visit is covered by the patient's monthly plan.
  const due = (bills.data?.rows ?? []).filter((bill) => bill.source === "INVOICE" && bill.balance > 0);
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
            description="This patient has no open bill. The in-clinic consultation is covered by the monthly plan."
          />
        ) : (
          due.map((bill) => <BillCard key={bill.id} bill={bill} onCollect={setCollecting} />)
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
  return patientUserId ? <PatientCollect patientUserId={patientUserId} /> : <CompletedToday />;
}

/**
 * RecBillingHandoff: after the doctor completes a visit, the desk checks the patient's monthly
 * in-person plan and collects any open bill (records only, no gateway). No per-visit consultation fee.
 */
export default function ReceptionCollectPage() {
  return (
    <TbdPage
      title="Collect payment"
      description="Check the patient's in-person plan and collect any open bill at the desk, then send the receipt."
      backHref={RECEPTION_ROUTES.dashboard}
      backLabel="Dashboard"
    >
      <Suspense fallback={<SkeletonRows rows={3} />}>
        <CollectContent />
      </Suspense>
    </TbdPage>
  );
}
