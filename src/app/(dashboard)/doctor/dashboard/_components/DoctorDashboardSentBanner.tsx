import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { Pill } from "@/components/tbd";
import { formatDateInIST } from "@/lib/utils/appointmentUtils";
import { formatClock, type CompletedVisitSummary } from "./doctor-dashboard.logic";

function formatFollowUp(value: string | null): string {
  if (!value) return "";
  return formatDateInIST(value, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Confirmation strip after a visit is completed. Every part comes from what was really saved:
 * the prescription number returned by the pharmacy, the medicine count, the follow-up date.
 */
export function DoctorDashboardSentBanner({ visit }: { visit: CompletedVisitSummary | null }) {
  if (!visit) {
    return null;
  }

  const time = formatClock(visit.completedAtMs);
  const sent = visit.pharmacyMedicineCount > 0;
  const followUp = formatFollowUp(visit.followUpDate);
  const medicineWord = (count: number) => `${count} ${count === 1 ? "medicine" : "medicines"}`;

  const facts: string[] = [];
  if (sent) {
    facts.push(medicineWord(visit.pharmacyMedicineCount));
    if (visit.outsideMedicineCount > 0) {
      facts.push(`${medicineWord(visit.outsideMedicineCount)} from outside, in the notes only`);
    }
  } else if (visit.outsideMedicineCount > 0) {
    facts.push(`${medicineWord(visit.outsideMedicineCount)} written in the notes, none sent to the pharmacy`);
  } else {
    facts.push("no medicine prescribed");
  }
  if (followUp) {
    facts.push(`follow-up on ${followUp}`);
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3.5 gap-y-3 rounded-[18px] border border-[#6ee7b7] bg-[#ecfdf5] px-[18px] py-3.5 dark:border-emerald-800 dark:bg-emerald-950/30"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#047857] text-white" aria-hidden="true">
        <Check className="size-5" strokeWidth={2.8} />
      </span>
      <span className="flex min-w-[220px] flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-extrabold text-[#065f46] dark:text-emerald-200">
          Visit completed for {visit.patientName}
        </span>
        <span className="text-[13px] text-ink-soft" suppressHydrationWarning>
          {sent ? (
            <>
              {visit.prescriptionNumber ? (
                <>
                  Prescription <b className="font-bold text-ink">{visit.prescriptionNumber}</b> was sent
                </>
              ) : (
                "The prescription was sent"
              )}{" "}
              to the pharmacy{time ? ` at ${time}` : ""}
            </>
          ) : (
            <>Completed{time ? ` at ${time}` : ""}</>
          )}
          {facts.map((fact) => ` · ${fact}`).join("")}
        </span>
      </span>
      {sent ? (
        <>
          <Pill tone="green" dot>
            Sent to pharmacy
          </Pill>
          <Link
            href="/doctor/prescriptions"
            className="inline-flex items-center gap-1 rounded-md text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            View prescription
            <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </>
      ) : (
        <Pill tone="slate">Completed</Pill>
      )}
    </div>
  );
}
