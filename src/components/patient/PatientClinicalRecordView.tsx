"use client";

import { useMemo, useState, type ReactNode } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  Calendar,
  Check,
  ChevronRight,
  ClipboardPlus,
  FileText,
  FlaskConical,
  Heart,
  History,
  Pill as PillIcon,
  Receipt,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  CellTitle,
  EmptyBlock,
  GridHead,
  GridRow,
  IconBox,
  Kpi,
  Note,
  Pill,
  Surface,
  statusLabel,
  statusTone,
  normalizeStatus,
  type PillTone,
  type TbdIcon,
} from "@/components/tbd";
import { useHashTab } from "@/hooks/navigation/useHashTab";
import { canViewCaseSheet } from "@/lib/utils/case-sheet-access";
import type { AppointmentHistoryTab } from "./PatientAppointmentHistory";
import { cn } from "@/lib/utils";
import { formatDateInIST, formatDateTimeInIST } from "@/lib/utils/date-time";
import { useAuthStore } from "@/stores/auth.store";
import { Role } from "@/types/auth.types";

type RecordLike = Record<string, unknown>;

export interface PatientClinicalRecordViewProps {
  patient: RecordLike;
  ehr: RecordLike;
  appointments: RecordLike[];
  history: RecordLike[];
  vitals: RecordLike[];
  labs: RecordLike[];
  carePlan: RecordLike[];
  prescriptions?: RecordLike[];
  /**
   * Visit-scoped OPD case-sheet; replaces the flat history table when provided.
   * Clinical notes: it is only rendered for doctors and clinic admins, whatever is passed.
   */
  caseSheet?: ReactNode;
  /**
   * The "History" tab: a timeline of every appointment. Left out, the tab is not shown.
   * `openTab` moves the record to another tab.
   */
  renderAppointmentHistory?: (openTab: (tab: AppointmentHistoryTab) => void) => ReactNode;
  /** Per-patient Bill History (consultation + pharmacy invoices and payments). */
  billing?: ReactNode;
  /**
   * Shown in the same card as the tab rail, above it (patient header, visit selector).
   * Without it the rail is a card of its own.
   */
  header?: ReactNode;
  /**
   * The Bills tab. Left out, it follows the role: a doctor or assistant doctor sees no money,
   * so the tab (and `billing`) is not rendered for them; other staff roles keep it.
   */
  showBills?: boolean;
  /** The record is still loading: numbers and table rows show placeholders. */
  loading?: boolean;
  className?: string;
}

const TAB_IDS = ["overview", "timeline", "appointments", "history", "vitals", "reports", "prescriptions", "medications", "bills"] as const;
type TabId = (typeof TAB_IDS)[number];

const PAGE_SIZE = 10;
const DATE_FORMAT = { day: "numeric", month: "short", year: "numeric" } as const;
const DATE_TIME_FORMAT = { ...DATE_FORMAT, hour: "numeric", minute: "2-digit", hour12: true } as const;

function toArray(value: unknown): RecordLike[] {
  if (Array.isArray(value)) return value as RecordLike[];
  if (value && typeof value === "object") {
    const record = value as RecordLike;
    for (const key of ["data", "items", "records", "appointments", "history", "labs", "results"]) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate as RecordLike[];
    }
  }
  return [];
}

const asRecord = (value: unknown): RecordLike =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : {};

/** First value that is a non-empty string or a number, as text. */
function text(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function dateValue(...values: unknown[]): string {
  for (const value of values) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** "28 Sept 2026, 11:15 am" */
function formatDateTime(value: string): string {
  return (value && formatDateTimeInIST(value, DATE_TIME_FORMAT)) || "-";
}

/** "22 Sept 2026" */
function formatDate(value: string): string {
  return (value && formatDateInIST(value, DATE_FORMAT)) || "-";
}

function timeOf(value: string): number {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

/** Newest first; rows with no date go last and keep their order. */
function newestFirst(rows: RecordLike[], dateOf: (row: RecordLike) => string): RecordLike[] {
  return rows
    .map((row, index) => ({ row, index, time: timeOf(dateOf(row)) }))
    .sort((a, b) => (b.time === a.time ? a.index - b.index : b.time - a.time))
    .map((entry) => entry.row);
}

/** BLOOD_PRESSURE -> "Blood pressure" */
function readable(value: string): string {
  const clean = value.replace(/[_-]+/g, " ").trim();
  if (!clean) return "";
  return clean === clean.toUpperCase() || clean === clean.toLowerCase()
    ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
    : clean;
}

function getDisplayName(patient: RecordLike): string {
  const user = asRecord(patient.user);
  return (
    text(
      patient.name,
      `${text(patient.firstName)} ${text(patient.lastName)}`,
      user.name,
      `${text(user.firstName)} ${text(user.lastName)}`,
      patient.email,
      user.email,
    ) || "Patient Record"
  );
}

function getAge(patient: RecordLike): string {
  const given = Number(patient.age);
  if (Number.isFinite(given) && given > 0) return String(given);
  const birth = new Date(dateValue(patient.dateOfBirth, asRecord(patient.user).dateOfBirth));
  if (Number.isNaN(birth.getTime())) return "";
  const today = new Date();
  const months = today.getMonth() - birth.getMonth();
  const years = today.getFullYear() - birth.getFullYear() - (months < 0 || (months === 0 && today.getDate() < birth.getDate()) ? 1 : 0);
  return years >= 0 ? String(years) : "";
}

function summaryValue(value: unknown): string {
  if (Array.isArray(value)) return String(value.length);
  if (value === null || value === undefined || value === "") return "0";
  if (typeof value === "object") return String(Object.keys(value as RecordLike).length);
  return String(value);
}

const appointmentDate = (row: RecordLike) => dateValue(row.startTime, row.appointmentDate, row.date);
const historyDate = (row: RecordLike) => dateValue(row.date, row.createdAt, row.startDate);
const labDate = (row: RecordLike) => dateValue(row.date, row.testDate, row.reportedDate);
const vitalDate = (row: RecordLike) => dateValue(row.recordedAt, row.date, row.createdAt);
const prescriptionDate = (row: RecordLike) => dateValue(row.date, row.createdAt);

/** A medicine the patient is taking now: not switched off and not marked stopped. */
function isCurrentMedication(row: RecordLike): boolean {
  if (row.isActive === false) return false;
  return !["INACTIVE", "STOPPED", "DISCONTINUED", "COMPLETED", "CANCELLED"].includes(normalizeStatus(text(row.status)));
}

function medicationStatus(row: RecordLike): string {
  return text(row.status) || (row.isActive === true ? "ACTIVE" : row.isActive === false ? "INACTIVE" : "");
}

/** Lab results read differently from visit statuses: normal is good news. */
const RESULT_TONES: Record<string, PillTone> = {
  NORMAL: "green",
  ABNORMAL: "amber",
  BORDERLINE: "amber",
  REVIEW: "amber",
  CRITICAL: "rose",
};

function StatusPill({ status, tones }: { status: string; tones?: Record<string, PillTone> }) {
  if (!status) return <span className="text-ink-muted">-</span>;
  return <Pill tone={tones?.[normalizeStatus(status)] ?? statusTone(status)}>{statusLabel(status)}</Pill>;
}

function VisitTypePill({ row }: { row: RecordLike }) {
  const type = text(row.type, row.appointmentType, row.consultationType, row.consultationMode);
  if (!type) return <span className="text-ink-muted">-</span>;
  const code = normalizeStatus(type);
  if (code.includes("VIDEO")) return <Pill tone="video">Video call</Pill>;
  if (code.includes("PERSON") || code.includes("CLINIC")) return <Pill tone="clinic">In-clinic</Pill>;
  return <Pill tone="slate">{readable(type)}</Pill>;
}

// ── Grid table with its own paging ─────────────────────────────────────────

interface RecordColumn {
  label: string;
  cell: (row: RecordLike) => ReactNode;
}

function RecordTable({
  title,
  description,
  grid,
  columns,
  rows,
  loading,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  /** CSS grid-template-columns shared by the head and the rows. */
  grid: string;
  columns: RecordColumn[];
  rows: RecordLike[];
  loading: boolean;
  emptyIcon: TbdIcon;
  emptyTitle: string;
  emptyDescription?: string;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = rows.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = total === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const rangeEnd = currentPage * PAGE_SIZE + pageRows.length;

  return (
    <Surface flush as="section" aria-label={title}>
      <div className="flex flex-col gap-0.5 px-5 pb-1.5 pt-5">
        <h2 className="m-0 text-base font-bold text-ink">{title}</h2>
        <p className="m-0 text-[13px] text-ink-muted">{description}</p>
      </div>

      {loading ? (
        <div aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex min-h-[58px] items-center gap-4 border-b border-hair px-5 py-3 last:border-b-0">
              <Skeleton className="h-3.5 w-36 max-w-[30%] rounded" />
              <Skeleton className="h-[22px] w-24 rounded-lg" />
              <Skeleton className="h-3.5 w-48 max-w-[30%] rounded" />
            </div>
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyBlock icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      ) : (
        <div role="table" aria-label={title}>
          <GridHead columns={grid} labels={columns.map((column) => column.label)} />
          {pageRows.map((row, index) => (
            <GridRow key={text(row.id) || `${currentPage}-${index}`} columns={grid}>
              {columns.map((column) => (
                <div key={column.label} role="cell">
                  <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted lg:hidden">
                    {column.label}
                  </span>
                  {column.cell(row)}
                </div>
              ))}
            </GridRow>
          ))}
        </div>
      )}

      {loading || total === 0 ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair px-5 py-3 text-[13px] text-ink-muted">
          <span>
            Showing {rangeStart}–{rangeEnd} of {total}
          </span>
          <nav aria-label={`${title} pages`} className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-[34px]"
              onClick={() => setPageIndex(currentPage - 1)}
              disabled={currentPage <= 0}
            >
              Previous
            </Button>
            <span className="whitespace-nowrap" aria-live="polite">
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              className="h-[34px]"
              onClick={() => setPageIndex(currentPage + 1)}
              disabled={currentPage >= pageCount - 1}
            >
              Next
            </Button>
          </nav>
        </div>
      )}
    </Surface>
  );
}

const muted = (value: string) => <span className="text-ink-muted">{value || "-"}</span>;
const strong = (value: string) => <span className="font-bold text-ink">{value || "-"}</span>;

const APPOINTMENT_COLUMNS: RecordColumn[] = [
  { label: "When", cell: (row) => strong(formatDateTime(appointmentDate(row))) },
  { label: "Status", cell: (row) => <StatusPill status={text(row.status)} /> },
  {
    label: "Doctor",
    cell: (row) => {
      const doctor = asRecord(row.doctor);
      return muted(text(row.doctorName, doctor.name, asRecord(doctor.user).name) || "Not recorded");
    },
  },
  { label: "Type", cell: (row) => <VisitTypePill row={row} /> },
];

const HISTORY_COLUMNS: RecordColumn[] = [
  { label: "Date", cell: (row) => muted(formatDate(historyDate(row))) },
  { label: "Condition", cell: (row) => strong(text(row.condition, row.diagnosis, row.title) || "Record") },
  { label: "Details", cell: (row) => muted(text(row.treatment, row.description, row.notes)) },
  { label: "Status", cell: (row) => <StatusPill status={text(row.status)} /> },
];

const VITAL_COLUMNS: RecordColumn[] = [
  { label: "Recorded", cell: (row) => muted(formatDateTime(vitalDate(row))) },
  { label: "Vital", cell: (row) => strong(readable(text(row.type, row.vitalType, row.name)) || "Vital") },
  {
    label: "Value",
    cell: (row) => {
      const value = text(row.value);
      return strong(value ? [value, text(row.unit)].filter(Boolean).join(" ") : "");
    },
  },
  { label: "Notes", cell: (row) => muted(text(row.notes)) },
];

const LAB_COLUMNS: RecordColumn[] = [
  { label: "Date", cell: (row) => muted(formatDate(labDate(row))) },
  {
    label: "Report",
    cell: (row) => (
      <CellTitle
        left={<IconBox icon={FlaskConical} tone="amber" size={36} />}
        title={text(row.testName, row.reportType, row.imageType, row.type) || "Report"}
      />
    ),
  },
  {
    label: "Result",
    cell: (row) => {
      const result = text(row.result, row.results, row.findings, row.impression);
      return muted(result ? [result, text(row.unit)].filter(Boolean).join(" ") : "");
    },
  },
  { label: "Status", cell: (row) => <StatusPill status={text(row.status)} tones={RESULT_TONES} /> },
];

const PRESCRIPTION_COLUMNS: RecordColumn[] = [
  { label: "Visit date", cell: (row) => strong(formatDateTime(prescriptionDate(row))) },
  { label: "Doctor", cell: (row) => muted(text(row.doctorName) || "Not recorded") },
  { label: "Diagnosis", cell: (row) => <span className="text-ink">{text(row.diagnosis) || "-"}</span> },
  {
    label: "Medicines given",
    cell: (row) => {
      const items = toArray(row.items);
      if (items.length === 0) return muted("No medicines recorded");
      return (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px]">
          {items.map((item, index) => {
            const details = [text(item.dosage), text(item.frequency), text(item.duration)].filter(Boolean).join(", ");
            const quantity = text(item.quantity);
            return (
              <li key={text(item.id) || index} className="leading-normal">
                <span className="font-bold text-ink">{text(item.medicineName) || "Unknown medicine"}</span>
                {details ? <span className="text-ink-muted"> · {details}</span> : null}
                {quantity ? <span className="text-ink-muted"> (Qty: {quantity})</span> : null}
              </li>
            );
          })}
        </ul>
      );
    },
  },
  { label: "Status", cell: (row) => <StatusPill status={text(row.status)} /> },
];

const MEDICATION_COLUMNS: RecordColumn[] = [
  {
    label: "Medication",
    cell: (row) => (
      <CellTitle
        left={<IconBox icon={PillIcon} tone="mint" size={36} />}
        title={text(row.name, row.medicineName, row.medication) || "Medication"}
      />
    ),
  },
  { label: "Dosage", cell: (row) => <span className="text-ink">{text(row.dosage) || "-"}</span> },
  { label: "Frequency", cell: (row) => muted(text(row.frequency)) },
  { label: "Status", cell: (row) => <StatusPill status={medicationStatus(row)} /> },
];

// ── Small blocks of the overview ───────────────────────────────────────────

const TILE = "rounded-[14px] border border-line bg-[#fbfdfc] dark:bg-white/[0.03]";
const TILE_LABEL = "text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted";

const numberSkeleton = <Skeleton className="my-1 h-6 w-10 rounded" />;

const TABS: Array<{ id: TabId; label: string; icon: TbdIcon }> = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "timeline", label: "History", icon: History },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "history", label: "History", icon: FileText },
  { id: "vitals", label: "Vitals", icon: Heart },
  { id: "reports", label: "Reports", icon: FlaskConical },
  { id: "prescriptions", label: "Prescriptions", icon: ClipboardPlus },
  { id: "medications", label: "Medications", icon: PillIcon },
  { id: "bills", label: "Bills", icon: Receipt },
];

export function PatientClinicalRecordView({
  patient,
  ehr,
  appointments,
  history,
  vitals,
  labs,
  carePlan,
  prescriptions = [],
  caseSheet: caseSheetContent,
  renderAppointmentHistory,
  billing,
  header,
  showBills,
  loading = false,
  className,
}: PatientClinicalRecordViewProps) {
  const patientRecord = asRecord(patient);
  const patientUser = asRecord(patientRecord.user);
  const ehrRecord = asRecord(ehr);

  // A doctor sees no money: no Bills tab, and `billing` is never mounted for them.
  const role = useAuthStore((state) => String(state.session?.user?.role ?? "").toUpperCase());
  const billsVisible = showBills ?? (role !== "" && role !== Role.DOCTOR && role !== Role.ASSISTANT_DOCTOR);

  // Clinical notes are for doctors and clinic admins only (receptionist, nurse, pharmacist: never).
  const caseSheet = canViewCaseSheet(role) ? caseSheetContent : undefined;
  const timelineVisible = Boolean(renderAppointmentHistory);

  const tabs = useMemo(
    () =>
      TABS.filter(
        (tab) => (tab.id !== "bills" || billsVisible) && (tab.id !== "timeline" || timelineVisible),
      ),
    [billsVisible, timelineVisible],
  );
  const tabIds = useMemo(() => tabs.map((tab) => tab.id), [tabs]);
  const { tab, setTab } = useHashTab<TabId>({ tabs: tabIds, defaultValue: "overview" });

  const patientDisplayName = getDisplayName(patientRecord);
  const currentMedications = useMemo(
    () => toArray(ehrRecord.medications).filter(isCurrentMedication),
    [ehrRecord.medications],
  );
  const allergies = useMemo(() => toArray(ehrRecord.allergies), [ehrRecord.allergies]);
  const sortedAppointments = useMemo(() => newestFirst(appointments, appointmentDate), [appointments]);
  const sortedHistory = useMemo(() => newestFirst(history, historyDate), [history]);
  const sortedVitals = useMemo(() => newestFirst(vitals, vitalDate), [vitals]);
  const sortedLabs = useMemo(() => newestFirst(labs, labDate), [labs]);
  const sortedPrescriptions = useMemo(() => newestFirst(prescriptions, prescriptionDate), [prescriptions]);
  const upcomingAppointments = useMemo(
    () =>
      appointments.filter((item) => {
        const time = timeOf(appointmentDate(item));
        return Number.isFinite(time) && time >= Date.now();
      }),
    [appointments],
  );

  const latestLab = sortedLabs[0] ? labDate(sortedLabs[0]) : "";
  const historyCount = summaryValue(ehrRecord.medicalHistory || history);
  const count = (value: ReactNode) => (loading ? numberSkeleton : value);

  /** Case sheet section links keep the nested hash (`#history/past-history`) the case sheet reads on mount. */
  const openTab = (next: TabId, section?: string) => {
    if (section && typeof window !== "undefined") {
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}#${next}/${section}`,
      );
    }
    setTab(next);
  };

  const snapshot: Array<[string, string]> = [
    ["Name", patientDisplayName],
    ["Email", text(patientRecord.email, patientUser.email)],
    ["Phone", text(patientRecord.phone, patientUser.phone)],
    ["Age", getAge(patientRecord)],
    ["Blood group", text(patientRecord.bloodGroup, ehrRecord.bloodGroup)],
    ["Gender", readable(text(patientRecord.gender, patientUser.gender))],
    ["Allergies", String(allergies.length)],
    ["Active medications", String(currentMedications.length)],
  ];

  const summary: Array<[string, ReactNode]> = [
    ["Upcoming appointments", upcomingAppointments.length],
    ["History entries", historyCount],
    ["Lab reports", labs.length],
    ["Vitals", vitals.length],
    ["Care plan items", carePlan.length],
  ];

  const shortcuts: Array<{ label: string; value: ReactNode; tab: TabId; section?: string }> = [
    { label: "Medical history", value: historyCount, tab: "history", ...(caseSheet ? { section: "past-history" } : {}) },
    { label: "Lab reports", value: summaryValue(ehrRecord.labReports || labs), tab: "reports" },
    { label: "Prescriptions", value: summaryValue(prescriptions), tab: "prescriptions" },
    { label: "Vitals", value: summaryValue(ehrRecord.vitals || vitals), tab: "vitals" },
  ];

  return (
    <Tabs value={tab} onValueChange={setTab} className={cn("gap-5", className)}>
      <div className="min-w-0 overflow-hidden rounded-[20px] border border-[#c9eedb] bg-card text-card-foreground shadow-card dark:border-border/70">
        {header}
        <TabsPrimitive.List
          aria-label="Record sections"
          className={cn("scrollbar-hide flex gap-0.5 overflow-x-auto px-2.5", header ? "border-t border-hair" : null)}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <TabsPrimitive.Trigger
              key={id}
              value={id}
              className={cn(
                "inline-flex h-[50px] shrink-0 items-center gap-2 whitespace-nowrap px-3.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink",
                "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
                "data-[state=active]:font-bold data-[state=active]:text-brand data-[state=active]:shadow-[inset_0_-3px_0_var(--color-brand)]",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
              {id === "history" ? (caseSheet ? "Case Sheet" : "Treatment History") : label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
      </div>

      <TabsContent value="overview" className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Appointments" value={count(appointments.length)} hint="All visits booked" icon={Calendar} tone="mint" />
          <Kpi label="History Items" value={count(history.length)} hint="Past conditions" icon={FileText} tone="blue" />
          <Kpi
            label="Lab Reports"
            value={count(labs.length)}
            hint={latestLab ? `Latest ${formatDate(latestLab)}` : "None on file"}
            icon={FlaskConical}
            tone="amber"
          />
          <Kpi
            label="Active Medications"
            value={count(currentMedications.length)}
            hint="Currently taking"
            icon={PillIcon}
            tone="mint"
          />
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[2fr_1fr]">
          <Surface as="section" aria-label="Patient snapshot">
            <h2 className="m-0 text-base font-bold text-ink">Patient Snapshot</h2>
            <dl className="m-0 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
              {snapshot.map(([label, value]) => (
                <div key={label} className={cn(TILE, "flex min-w-0 flex-col gap-1 px-3.5 py-3")}>
                  <dt className={TILE_LABEL}>{label}</dt>
                  <dd className="m-0 truncate text-sm font-bold text-ink">{value || "-"}</dd>
                </div>
              ))}
            </dl>
          </Surface>

          <Surface as="section" aria-label="Clinical summary" className="gap-1.5">
            <h2 className="m-0 text-base font-bold text-ink">Clinical Summary</h2>
            <dl className="m-0 flex flex-1 flex-col justify-between">
              {summary.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 border-b border-hair py-3.5 text-sm text-ink-soft last:border-b-0"
                >
                  <dt>{label}</dt>
                  <dd className="m-0 text-base font-extrabold text-ink">{count(value)}</dd>
                </div>
              ))}
            </dl>
          </Surface>
        </div>

        <Surface as="section" aria-label="EHR overview">
          <h2 className="m-0 text-base font-bold text-ink">EHR Overview</h2>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.label}
                type="button"
                onClick={() => openTab(shortcut.tab, shortcut.section)}
                className={cn(
                  TILE,
                  "flex items-center gap-3 px-4 py-3.5 text-left text-ink transition-colors hover:border-brand/50 hover:bg-mint-soft",
                  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className={TILE_LABEL}>{shortcut.label}</span>
                  <span className="text-2xl font-extrabold leading-[1.1]">{count(shortcut.value)}</span>
                </span>
                <ChevronRight className="size-[18px] shrink-0 text-ink-soft" strokeWidth={2.2} aria-hidden="true" />
              </button>
            ))}
          </div>
        </Surface>

        <Surface as="section" aria-label="Care plan">
          <h2 className="m-0 text-base font-bold text-ink">Care Plan</h2>
          {carePlan.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {carePlan.map((item, index) => {
                const goals = Array.isArray(item.goals) ? item.goals : [];
                return (
                  <div key={text(item.id) || index} className={cn(TILE, "flex items-start gap-3 px-4 py-3.5")}>
                    <IconBox icon={Check} tone="mint" size={36} />
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-sm font-bold text-ink">
                        {text(goals[0], item.title, item.name) || `Plan item ${index + 1}`}
                      </span>
                      <span className="text-[13px] leading-normal text-ink-muted">
                        {text(item.followUpInstructions, item.instructions, item.description, item.notes) || "-"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-line px-4 py-5 text-[13px] text-ink-muted">
              {loading ? "Loading the care plan…" : "No care plan has been added for this patient yet."}
            </div>
          )}
        </Surface>

        <Note tone="blue">
          This record uses clinic-scoped patient data. If a section is empty, no records have been added for it yet.
        </Note>
      </TabsContent>

      {renderAppointmentHistory ? (
        <TabsContent value="timeline">{renderAppointmentHistory((next) => openTab(next))}</TabsContent>
      ) : null}

      <TabsContent value="appointments">
        <RecordTable
          title="Appointments"
          description="Every appointment this patient has had at the clinic, newest first."
          grid="1.3fr 1fr 1.6fr 1fr"
          columns={APPOINTMENT_COLUMNS}
          rows={sortedAppointments}
          loading={loading}
          emptyIcon={Calendar}
          emptyTitle="No appointments yet"
          emptyDescription="Appointments booked for this patient at the clinic will show here."
        />
      </TabsContent>

      <TabsContent value="history">
        {caseSheet ?? (
          <RecordTable
            title="Treatment History"
            description="Past conditions and treatments on record, newest first."
            grid="0.8fr 1.4fr 2fr 0.8fr"
            columns={HISTORY_COLUMNS}
            rows={sortedHistory}
            loading={loading}
            emptyIcon={FileText}
            emptyTitle="No treatment history yet"
          />
        )}
      </TabsContent>

      <TabsContent value="vitals" className="flex flex-col gap-5">
        <RecordTable
          title="Vitals"
          description="Readings recorded for this patient, newest first."
          grid="1.3fr 1.2fr 1fr 1.6fr"
          columns={VITAL_COLUMNS}
          rows={sortedVitals}
          loading={loading}
          emptyIcon={Heart}
          emptyTitle="No vitals recorded yet"
        />
        {caseSheet ? (
          <Note tone="green">Vitals are entered for each OPD visit in Case Sheet, under General Exam.</Note>
        ) : null}
      </TabsContent>

      <TabsContent value="reports" className="flex flex-col gap-5">
        <RecordTable
          title="Lab and Imaging Reports"
          description="Results on file for this patient, newest first."
          grid="0.8fr 1.4fr 2fr 0.8fr"
          columns={LAB_COLUMNS}
          rows={sortedLabs}
          loading={loading}
          emptyIcon={FlaskConical}
          emptyTitle="No reports on file yet"
        />
        {caseSheet ? (
          <Note tone="green">
            Report files (PDF, images, audio, video) are uploaded and previewed in Case Sheet, under Investigation.
          </Note>
        ) : null}
      </TabsContent>

      <TabsContent value="prescriptions">
        <RecordTable
          title="Prescription History"
          description="Every visit where a doctor prescribed medicine from pharmacy inventory, most recent first."
          grid="1.05fr 0.85fr 1.15fr 2.3fr 0.65fr"
          columns={PRESCRIPTION_COLUMNS}
          rows={sortedPrescriptions}
          loading={loading}
          emptyIcon={ClipboardPlus}
          emptyTitle="No prescriptions recorded yet"
        />
      </TabsContent>

      <TabsContent value="medications" className="flex flex-col gap-5">
        <RecordTable
          title="Current Medications"
          description="Medicines the patient is taking now."
          grid="1.6fr 1fr 1.8fr 0.8fr"
          columns={MEDICATION_COLUMNS}
          rows={currentMedications}
          loading={loading}
          emptyIcon={PillIcon}
          emptyTitle="No active medications"
        />
        {caseSheet ? (
          <Note tone="green">
            This list is kept in Case Sheet, under Medicine History. Medicines prescribed here are under Prescriptions.
          </Note>
        ) : null}
      </TabsContent>

      {billsVisible ? (
        <TabsContent value="bills">
          {billing ?? (
            <Surface flush>
              <EmptyBlock icon={Receipt} title="Bill history is not available" />
            </Surface>
          )}
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
