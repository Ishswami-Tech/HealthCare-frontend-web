"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquareText } from "lucide-react";
import { Pill, statusTone } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { getAppointmentPatientRemarks } from "@/lib/utils/appointmentUtils";
import { asRecord } from "@/lib/utils/coerce";

/** What the doctor should know before and during a video visit, from the booking and the record. */
export interface PatientRemarksSummary {
  remark: string;
  urgency: string | null;
  /** Allergies already on the appointment payload; empty when none are known. */
  allergies: string[];
}

function readTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : String(asRecord(item)?.name ?? asRecord(item)?.allergen ?? "")))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

/** Remark, urgency and allergies from a raw appointment record (any endpoint shape). */
export function getPatientRemarksSummary(appointment: unknown): PatientRemarksSummary {
  const { remark, urgency } = getAppointmentPatientRemarks(appointment);
  const patient = asRecord(asRecord(appointment)?.patient);
  const allergies = readTextList(patient?.allergies ?? asRecord(patient?.user)?.allergies);
  return { remark, urgency, allergies };
}

export function hasPatientRemarks(summary: PatientRemarksSummary): boolean {
  return Boolean(summary.remark || summary.urgency || summary.allergies.length > 0);
}

function RemarkLines({ summary, tone }: { summary: PatientRemarksSummary; tone: "light" | "dark" }) {
  const muted = tone === "dark" ? "text-[#9aa7bd]" : "text-ink-muted";
  const strong = tone === "dark" ? "text-white" : "text-ink";
  return (
    <dl className="m-0 flex flex-col gap-2.5 text-sm">
      <div className="flex flex-col gap-0.5">
        <dt className={cn("text-[11px] font-extrabold uppercase tracking-[0.6px]", muted)}>Reason for visit</dt>
        <dd className={cn("m-0 whitespace-pre-wrap break-words leading-normal", summary.remark ? strong : muted)}>
          {summary.remark || "None given at booking"}
        </dd>
      </div>
      {summary.urgency ? (
        <div className="flex items-center gap-2">
          <dt className={cn("text-[11px] font-extrabold uppercase tracking-[0.6px]", muted)}>Urgency</dt>
          <dd className="m-0">
            <Pill tone={statusTone(summary.urgency)}>{summary.urgency}</Pill>
          </dd>
        </div>
      ) : null}
      {summary.allergies.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          <dt className={cn("text-[11px] font-extrabold uppercase tracking-[0.6px]", muted)}>Allergies</dt>
          <dd className={cn("m-0 break-words", strong)}>{summary.allergies.join(", ")}</dd>
        </div>
      ) : null}
    </dl>
  );
}

/** "Patient remarks" block for the doctor's lobby, on the light surface. */
export function PatientRemarksCard({ summary }: { summary: PatientRemarksSummary }) {
  return (
    <section
      aria-labelledby="lobby-patient-remarks"
      className="flex flex-col gap-2.5 rounded-2xl border border-hair bg-card px-4 py-3.5"
    >
      <h3 id="lobby-patient-remarks" className="m-0 flex items-center gap-2 text-sm font-bold text-ink">
        <MessageSquareText className="size-4 text-brand" aria-hidden="true" />
        Patient remarks
      </h3>
      <RemarkLines summary={summary} tone="light" />
    </section>
  );
}

/** Collapsible "Patient remarks" card over the doctor's call stage. Open by default. */
export function PatientRemarksCallOverlay({ summary, className }: { summary: PatientRemarksSummary; className?: string }) {
  const [open, setOpen] = useState(true);
  return (
    <section
      aria-label="Patient remarks"
      className={cn(
        "w-[min(320px,calc(100vw-28px))] rounded-xl border border-white/[0.16] bg-[rgba(8,12,22,0.82)] text-white shadow-xl backdrop-blur-md",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2 text-left text-[13px] font-bold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <span className="flex items-center gap-2">
          <MessageSquareText className="size-[15px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
          Patient remarks
        </span>
        {open ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
      </button>
      {open ? (
        <div className="max-h-[40vh] overflow-y-auto px-3.5 pb-3.5">
          <RemarkLines summary={summary} tone="dark" />
        </div>
      ) : null}
    </section>
  );
}
