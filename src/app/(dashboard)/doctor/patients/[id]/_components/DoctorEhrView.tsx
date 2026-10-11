"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ChevronLeft, Droplet, Loader2, Mail, Phone, Pill as PillIcon, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Chip, EmptyBlock, InitialsAvatar, Surface } from "@/components/tbd";
import {
  PatientClinicalRecordView,
  type PatientClinicalRecordViewProps,
} from "@/components/patient/PatientClinicalRecordView";

/** What the patient header shows. Empty strings are left out. */
export interface DoctorEhrHeaderInfo {
  name: string;
  /** "32 years · Female" */
  summary: string;
  /** Short patient id shown after "Patient ID:". */
  idLabel: string;
  /** The full id, as a tooltip. */
  fullId: string;
  /** The clinic-issued health ID (UHID); empty when none has been issued. */
  uhid: string;
  bloodGroup: string;
  phone: string;
  email: string;
}

export interface DoctorEhrViewProps {
  /** The patient is still being looked up. */
  loading: boolean;
  /** No patient was found for this link. */
  failed: boolean;
  onRetry: () => void;
  header: DoctorEhrHeaderInfo;
  /** The OPD visit chips (`VisitSelectorView`). */
  visitSelector: ReactNode;
  /** Leave out to hide the button. */
  onNewVisit?: (() => void) | undefined;
  newVisitPending: boolean;
  /** Leave out when this user may not prescribe. */
  onPrescribe?: (() => void) | undefined;
  record: Pick<
    PatientClinicalRecordViewProps,
    "patient" | "ehr" | "appointments" | "history" | "vitals" | "labs" | "carePlan" | "prescriptions"
  >;
  /** The health record is still loading: numbers and tables show placeholders. */
  recordLoading: boolean;
  /** The case sheet of the selected OPD visit; without it the tab shows the plain history table. */
  caseSheet?: ReactNode;
  /** The "History" tab (timeline of every appointment); without it the tab is hidden. */
  renderAppointmentHistory?: PatientClinicalRecordViewProps["renderAppointmentHistory"];
  /** Bills tab. Left out, it follows the signed-in role (never shown to a doctor). */
  showBills?: boolean;
}

const HEADER_BAND =
  "bg-[linear-gradient(135deg,#ecfdf5_0%,#fffbeb_62%,#fef3c7_100%)] dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.14)_0%,rgba(245,158,11,0.06)_62%,rgba(245,158,11,0.12)_100%)]";

function PatientHeader({
  header,
  visitSelector,
  onNewVisit,
  newVisitPending,
  onPrescribe,
}: Pick<DoctorEhrViewProps, "header" | "visitSelector" | "onNewVisit" | "newVisitPending" | "onPrescribe">) {
  return (
    <>
      <div className={`flex flex-wrap items-center gap-x-[18px] gap-y-4 px-4 py-5 sm:px-6 ${HEADER_BAND}`}>
        <InitialsAvatar name={header.name} size={64} />
        <div className="flex min-w-0 flex-1 basis-[220px] flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-brand">
              Electronic health record
            </span>
            {header.uhid ? (
              <span className="font-mono text-xs font-bold text-ink-soft" title="Unique health ID (UHID)">
                UHID {header.uhid}
              </span>
            ) : header.idLabel ? (
              <span className="text-xs font-semibold text-ink-muted" title={header.fullId}>
                Patient ID: {header.idLabel}
              </span>
            ) : null}
          </div>
          <h1 className="m-0 text-[26px] font-extrabold leading-[1.1] tracking-[-0.5px] text-ink">{header.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {header.summary ? (
              <span className="mr-1 whitespace-nowrap text-sm font-semibold text-ink-soft">{header.summary}</span>
            ) : null}
            {header.bloodGroup ? <Chip icon={Droplet}>{header.bloodGroup}</Chip> : null}
            {header.phone ? <Chip icon={Phone}>{header.phone}</Chip> : null}
            {header.email ? (
              <Chip icon={Mail} className="max-w-full">
                <span className="truncate">{header.email}</span>
              </Chip>
            ) : null}
          </div>
        </div>
        {onNewVisit || onPrescribe ? (
          <div className="flex w-full flex-wrap gap-2.5 lg:w-auto lg:shrink-0">
            {onNewVisit ? (
              <Button variant="outline" size="md" className="flex-1 lg:flex-none" onClick={onNewVisit} disabled={newVisitPending}>
                {newVisitPending ? <Loader2 className="animate-spin" /> : <Plus />}
                New OPD visit
              </Button>
            ) : null}
            {onPrescribe ? (
              <Button size="md" className="flex-1 lg:flex-none" onClick={onPrescribe}>
                <PillIcon />
                Move to Prescription
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="border-t border-hair px-4 py-3 sm:px-6">{visitSelector}</div>
    </>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-label="Loading patient record">
      <div className="overflow-hidden rounded-[20px] border border-[#c9eedb] bg-card shadow-card dark:border-border/70">
        <div className={`flex items-center gap-[18px] px-4 py-5 sm:px-6 ${HEADER_BAND}`}>
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-44 rounded" />
            <Skeleton className="h-7 w-56 max-w-full rounded" />
            <Skeleton className="h-6 w-72 max-w-full rounded-lg" />
          </div>
        </div>
        <div className="flex gap-2 border-t border-hair px-4 py-3 sm:px-6">
          <Skeleton className="h-[34px] w-40 rounded-full" />
          <Skeleton className="h-[34px] w-40 rounded-full" />
        </div>
        <div className="flex gap-4 border-t border-hair px-6 py-4">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[88px] rounded-[18px]" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-[20px]" />
    </div>
  );
}

/** EHR workspace of one patient: header, OPD visits, record tabs. Props only. */
export function DoctorEhrView({
  loading,
  failed,
  onRetry,
  header,
  visitSelector,
  onNewVisit,
  newVisitPending,
  onPrescribe,
  record,
  recordLoading,
  caseSheet,
  renderAppointmentHistory,
  showBills,
}: DoctorEhrViewProps) {
  return (
    <DashboardPageShell className="gap-y-2.5">
      <Link
        href="/doctor/patients"
        className="inline-flex items-center gap-1 self-start text-[13px] font-semibold text-ink-muted hover:text-ink"
      >
        <ChevronLeft className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
        Back to patients
      </Link>

      {failed ? (
        <Surface flush role="alert">
          <EmptyBlock
            icon={AlertCircle}
            tone="rose"
            title="This patient record could not be opened"
            description="The link may be wrong, or this patient is not in your clinic. Check your connection and try again."
            action={
              <Button variant="outline" size="md" onClick={onRetry}>
                <RefreshCw />
                Try again
              </Button>
            }
          />
        </Surface>
      ) : loading ? (
        <LoadingState />
      ) : (
        <PatientClinicalRecordView
          {...record}
          loading={recordLoading}
          caseSheet={caseSheet}
          {...(renderAppointmentHistory ? { renderAppointmentHistory } : {})}
          {...(showBills === undefined ? {} : { showBills })}
          header={
            <PatientHeader
              header={header}
              visitSelector={visitSelector}
              onNewVisit={onNewVisit}
              newVisitPending={newVisitPending}
              onPrescribe={onPrescribe}
            />
          }
        />
      )}
    </DashboardPageShell>
  );
}
