"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Kv, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import {
  EMPTY_DATE_LABEL,
  formatDateLabel,
  formatISODateInIST,
  formatTimeLabel,
} from "@/lib/utils/date-time";
import { getAppointmentDateTimeValue } from "@/lib/utils/clock";
import { normalizeStatus } from "@/components/tbd";
import { firstText, unwrapList } from "@/lib/utils/coerce";
import {
  THERAPY_PROCEDURE_LABELS,
  type TherapyProcedure,
  type VisitTherapyPlan,
} from "@/types/visit-therapy.types";

type RecordLike = Record<string, unknown>;

/**
 * The compact Overview surfaces: the "At a glance" list (the clinical state, one row per thing
 * the doctor wants to know right now) and the patient snapshot (allergies / active medications
 * as content, not counts). Props only — the parent view owns the data, the deep-link callbacks
 * and the role gating. Rows stay honest: a row shows a muted "nothing" line only for data the
 * caller actually has; a data source the caller did not fetch is left out entirely.
 */

// ── Small helpers ──────────────────────────────────────────────────────────

/**
 * "Today" / "Tomorrow" / a formatted date, in that order. `dateKey` is an IST day key, so the
 * comparisons run on IST days too (the appointment's `date` column is the IST-midnight key).
 */
function nextApptDayLabel(dateKey: string): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateKey === formatISODateInIST(now)) return "Today";
  if (dateKey === formatISODateInIST(tomorrow)) return "Tomorrow";
  return formatDateLabel(dateKey, "Soon");
}

/** Prescription statuses that mean "no longer waiting to be dispensed." */
const COMPLETED_RX_STATUSES = ["FILLED", "DISPENSED", "COMPLETED", "CANCELLED", "STOPPED"];

/** The newest not-yet-completed prescription (newest-first input), or null when the patient has none. */
export function latestActivePrescription(sorted: RecordLike[]): RecordLike | null {
  for (const row of sorted) {
    if (COMPLETED_RX_STATUSES.includes(normalizeStatus(firstText(row.status)))) continue;
    return row;
  }
  return null;
}

/** The allergy name — the EHR record sends objects (`allergen`); flat strings are read too. */
function allergyName(row: RecordLike): string {
  return firstText(row.allergen, row.name, row.allergy, row.substance);
}

/** The medication name from the common EHR field variants. */
function medicationName(row: RecordLike): string {
  return firstText(row.name, row.medicineName, row.medication);
}

/** The therapy plan's label: the stored display label, else the known procedure name, else the code. */
function therapyPlanLabel(plan: Pick<VisitTherapyPlan, "procedure" | "procedureLabel">): string {
  const label = plan.procedureLabel?.trim();
  if (label) return label;
  return THERAPY_PROCEDURE_LABELS[plan.procedure as TherapyProcedure] || String(plan.procedure);
}

/** "CBC · 12 Oct" for a lab row; whichever of name / date is on hand. */
function labRowLabel(row: RecordLike): string {
  const datePart = formatDateLabel(firstText(row.date, row.testDate, row.reportedDate), "");
  const name = firstText(row.testName, row.reportType, row.imageType, row.type);
  if (name && datePart) return `${name} · ${datePart}`;
  return name || datePart;
}

/** "12 Oct · 3 medicines" for a prescription row (its items live in `items`). */
function prescriptionRowLabel(row: RecordLike): string {
  const datePart = formatDateLabel(firstText(row.date, row.createdAt), "");
  const count = unwrapList(row.items, "medications").length;
  if (datePart && count > 0) return `${datePart} · ${count} medicine${count === 1 ? "" : "s"}`;
  if (datePart) return datePart;
  return count > 0 ? `${count} medicine${count === 1 ? "" : "s"}` : "";
}

/** The soonest upcoming appointment, as a deep-link button: "Tomorrow · 4:00 pm · Video". */
function NextAppointmentValue({
  nextAppointment,
  onOpen,
}: {
  nextAppointment: RecordLike | null;
  onOpen?: () => void;
}) {
  if (!nextAppointment) {
    return <span className="text-ink-muted">None booked</span>;
  }
  const when = getAppointmentDateTimeValue(nextAppointment);
  const isVideo = /VIDEO/.test(
    String(firstText(nextAppointment.type, nextAppointment.appointmentType)).toUpperCase(),
  );
  const parts = [
    when ? nextApptDayLabel(formatISODateInIST(when)) : "",
    when ? formatTimeLabel(when) : "",
    isVideo ? "Video" : "In-Clinic",
  ].filter(Boolean);
  if (!onOpen) {
    return <span className="font-bold text-ink">{parts.join(" · ") || "Upcoming"}</span>;
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open the appointments tab"
      className={cn(
        "group inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 -mx-1 text-left transition-colors hover:bg-mint-soft",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
      )}
    >
      <span className="text-sm font-bold text-ink">{parts.join(" · ") || "Upcoming"}</span>
      <ChevronRight
        className="size-3.5 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5"
        strokeWidth={2.4}
        aria-hidden="true"
      />
    </button>
  );
}

/** The "Open case sheet" deep link on the last-visit row. */
function OpenCaseSheetButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open the case sheet tab"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-xs font-semibold text-brand transition-colors hover:bg-mint-soft",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
      )}
    >
      Open case sheet
      <ChevronRight className="size-3" strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}

// ── At a glance ────────────────────────────────────────────────────────────

/** The most recent OPD visit, as the workspace's visit list carries it. */
export interface GlanceLastVisit {
  opdNumber: string;
  registrationDate: string;
  /** Present complaints from the visit, when written up yet. */
  presentComplaints?: string | null;
}

export interface AtAGlanceRow {
  label: ReactNode;
  value: ReactNode;
  /** Quiet sub-line under the value (the last visit's present complaints). */
  sub?: ReactNode;
  /** Right-aligned action (the "Open case sheet" deep link). */
  action?: ReactNode;
}

export interface AtAGlanceRowsInput {
  /** The soonest upcoming appointment, or null when none is booked. */
  nextAppointment: RecordLike | null;
  /** Left out when the caller has no appointments data — "None booked" would be a lie. */
  showNextAppointment?: boolean;
  /** The most recent OPD visit, or null when the patient has none. */
  latestVisit: GlanceLastVisit | null;
  /** Left out when the caller has no visits data — "No OPD visit yet" would be a lie. */
  showLastVisit?: boolean;
  /**
   * Ongoing therapy plans (the caller pre-filters to SCHEDULED / IN_PROGRESS).
   * Left out — no patient-wide therapy data — the row is not shown at all.
   */
  ongoingTherapyPlans?: readonly VisitTherapyPlan[];
  /** The newest lab-report row, or null when nothing is on file. */
  latestLab: RecordLike | null;
  /** The newest not-yet-completed prescription row, or null. */
  latestPrescription: RecordLike | null;
  onOpenAppointments?: () => void;
  /**
   * Offered only when the case sheet tab exists for this role; deep-links to it. Kept
   * separate from the case-sheet content so clinical notes never leak to other roles.
   */
  onOpenCaseSheet?: () => void;
}

/**
 * Builds the at-a-glance rows. Every row has one data source; a row with nothing shows a
 * single muted line, never a cluster of zero tiles.
 */
export function buildAtAGlanceRows(input: AtAGlanceRowsInput): AtAGlanceRow[] {
  const {
    nextAppointment,
    showNextAppointment = false,
    latestVisit,
    showLastVisit = false,
    ongoingTherapyPlans,
    latestLab,
    latestPrescription,
    onOpenAppointments,
    onOpenCaseSheet,
  } = input;

  const complaint = (latestVisit?.presentComplaints ?? "").trim();
  const truncated = complaint.length > 80 ? `${complaint.slice(0, 80)}…` : complaint;
  const ongoingNames = (ongoingTherapyPlans ?? []).slice(0, 3).map(therapyPlanLabel);

  const rows: AtAGlanceRow[] = [];
  if (showNextAppointment) {
    rows.push({
      label: "Next appointment",
      value: <NextAppointmentValue nextAppointment={nextAppointment} onOpen={onOpenAppointments} />,
    });
  }
  if (showLastVisit) {
    rows.push({
      label: "Last OPD visit",
      value: latestVisit ? (
        <>
          <span className="font-bold text-ink">{latestVisit.opdNumber}</span>
          <span className="text-ink-muted">
            {" · "}
            {formatDateLabel(latestVisit.registrationDate, EMPTY_DATE_LABEL)}
          </span>
        </>
      ) : (
        <span className="text-ink-muted">No OPD visit yet</span>
      ),
      ...(truncated ? { sub: truncated } : {}),
      ...(latestVisit && onOpenCaseSheet ? { action: <OpenCaseSheetButton onOpen={onOpenCaseSheet} /> } : {}),
    });
  }
  if (ongoingTherapyPlans !== undefined) {
    rows.push({
      label: "Ongoing treatments",
      value:
        ongoingTherapyPlans.length === 0 ? (
          <span className="text-ink-muted">None planned</span>
        ) : (
          <span className="font-bold text-ink">
            {ongoingNames.join(", ")}
            {ongoingTherapyPlans.length > 3 && (
              <span className="font-medium text-ink-muted"> +{ongoingTherapyPlans.length - 3} more</span>
            )}
          </span>
        ),
      ...(ongoingTherapyPlans.length > 0
        ? { sub: `${ongoingTherapyPlans.length} plan${ongoingTherapyPlans.length === 1 ? "" : "s"} ongoing` }
        : {}),
    });
  }
  rows.push({
    label: "Latest lab",
    value: latestLab ? (
      <span className="font-bold text-ink">{labRowLabel(latestLab)}</span>
    ) : (
      <span className="text-ink-muted">None on file</span>
    ),
  });
  rows.push({
    label: "Active prescriptions",
    value: latestPrescription ? (
      <span className="font-bold text-ink">{prescriptionRowLabel(latestPrescription)}</span>
    ) : (
      <span className="text-ink-muted">None on file</span>
    ),
  });

  return rows;
}

/**
 * The compact "At a glance" surface: one label / value row per line, single column.
 * While the record is loading it shows a short skeleton list instead of claims.
 */
export function AtAGlanceSurface({
  rows,
  loading = false,
  className,
}: {
  rows: readonly AtAGlanceRow[];
  loading?: boolean;
  className?: string;
}) {
  return (
    <Surface as="section" aria-label="At a glance" className={cn("gap-2", className)}>
      <h2 className="m-0 text-base font-bold text-ink">At a glance</h2>
      {loading ? (
        <div className="flex flex-col gap-2.5" role="status" aria-label="Loading at a glance">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3 border-b border-hair pb-2.5 last:border-b-0">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-3.5 w-32 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <dl className="m-0 flex min-w-0 flex-1 flex-col">
          {rows.map((row, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-wrap items-start justify-between gap-x-3 gap-y-1 border-b border-hair py-3 text-sm",
                i === rows.length - 1 && "border-b-0",
              )}
            >
              <dt className="shrink-0 text-ink-soft">{row.label}</dt>
              <dd className="flex min-w-0 flex-col items-end gap-0.5 text-right">
                <span className="flex min-w-0 items-center gap-1">{row.value}</span>
                {row.sub ? <span className="max-w-56 break-words text-xs text-ink-muted">{row.sub}</span> : null}
                {row.action ? <span className="mt-0.5">{row.action}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Surface>
  );
}

// ── Patient snapshot ───────────────────────────────────────────────────────

const ALLERGY_CHIP =
  "inline-flex items-center rounded-[8px] bg-rose-50 px-[9px] py-1 text-[11px] font-extrabold uppercase leading-none tracking-[0.4px] text-rose-800 dark:bg-rose-500/15 dark:text-rose-300";
const MEDICATION_CHIP =
  "inline-flex items-center rounded-[8px] bg-[#d1fae5] px-[9px] py-1 text-[11px] font-extrabold uppercase leading-none tracking-[0.4px] text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300";

/** One labelled content row of the snapshot: chips when there is content, one muted line when not. */
function SnapshotContentRow({
  label,
  chips,
  hasContent,
  empty,
}: {
  label: string;
  chips: ReactNode[];
  hasContent: boolean;
  empty: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">{label}</dt>
      <dd className="m-0">
        {hasContent ? (
          <div className="flex flex-wrap items-center gap-1.5">{chips}</div>
        ) : (
          <span className="text-[13px] text-ink-muted">{empty}</span>
        )}
      </dd>
    </div>
  );
}

/**
 * The patient snapshot, content-first: allergies as a rose-tinted row of chips (a real
 * safety-critical list, never just a count) and the active medications as the top three
 * names. Identity / demographic rows come first when the header does not own them.
 */
export function PatientSnapshotSurface({
  identityRows,
  allergies,
  activeMedications,
  loading = false,
  className,
}: {
  /** Identity / demographic rows, shown when the header does not already show them. */
  identityRows?: Array<[string, string]>;
  allergies: RecordLike[];
  activeMedications: RecordLike[];
  loading?: boolean;
  className?: string;
}) {
  const allergyChips = allergies
    .map(allergyName)
    .filter(Boolean)
    .map((name) => (
      <span key={`a-${name}`} className={ALLERGY_CHIP}>
        {name}
      </span>
    ));
  const medNames = activeMedications.map(medicationName).filter(Boolean);
  const medChips = [
    ...medNames
      .slice(0, 3)
      .map((name) => (
        <span key={`m-${name}`} className={MEDICATION_CHIP}>
          {name}
        </span>
      )),
    medNames.length > 3 ? (
      <span key="m-more" className="text-xs font-semibold text-ink-muted">
        +{medNames.length - 3} more
      </span>
    ) : null,
  ];

  return (
    <Surface as="section" aria-label="Patient snapshot" className={cn("gap-3", className)}>
      <h2 className="m-0 text-base font-bold text-ink">Patient Snapshot</h2>
      {loading ? (
        <div className="flex flex-col gap-2.5" role="status" aria-label="Loading patient snapshot">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-4 w-56 rounded" />
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {identityRows && identityRows.length > 0 ? (
            <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-2 min-[480px]:grid-cols-2">
              {identityRows.map(([label, value]) => (
                <Kv key={label} label={label} value={value || "-"} className="min-w-0" />
              ))}
            </dl>
          ) : null}
          <dl className="m-0 flex min-w-0 flex-col gap-3">
            {/* Allergies first: the safety-critical list a busy doctor must not have to hunt for. */}
            <SnapshotContentRow
              label="Allergies"
              chips={allergyChips}
              hasContent={allergyChips.length > 0}
              empty="No allergies on record."
            />
            <SnapshotContentRow
              label="Active medications"
              chips={medChips}
              hasContent={medNames.length > 0}
              empty="Nothing currently on the active list."
            />
          </dl>
          {medNames.length > 3 ? (
            <span className="self-start text-xs font-semibold text-ink-muted">
              +{medNames.length - 3} more
            </span>
          ) : null}
        </div>
      )}
    </Surface>
  );
}
