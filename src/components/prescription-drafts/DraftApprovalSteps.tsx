import { Check, Circle, CornerUpLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RxDraft } from "@/types/rx-drafts.types";
import { draftTimeLabel } from "./rx-drafts.logic";

type StepState = "done" | "current" | "todo" | "returned";

/** Prepared → sent to the doctor → approved (or returned). Who did what, and when. */
export function DraftApprovalSteps({ draft, doctorName }: { draft: RxDraft; doctorName?: string }) {
  const status = String(draft.status).toUpperCase();
  const approved = status === "PENDING" || Boolean(draft.approvedAt);
  const returned = status === "RETURNED";
  const doctor = doctorName || "the doctor";
  const steps: Array<{ title: string; detail: string; state: StepState }> = [
    {
      title: `Prepared by ${draft.draftedByName || "the assistant"}`,
      detail: draftTimeLabel(draft.submittedAt),
      state: "done",
    },
    {
      title: returned ? `Returned by ${doctor}` : `Sent to ${doctor} for review`,
      detail: returned ? draftTimeLabel(draft.returnedAt) : approved ? "" : "Waiting for review",
      state: returned ? "returned" : approved ? "done" : "current",
    },
    {
      title: `Approved and signed by ${doctor}`,
      detail: approved ? draftTimeLabel(draft.approvedAt) : "",
      state: approved ? "done" : "todo",
    },
  ];

  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Approval status">
      {steps.map((step) => (
        <li key={step.title} className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full",
              step.state === "done" && "bg-brand text-white",
              step.state === "current" && "bg-[#fef3c7] text-[#92400e] dark:bg-amber-500/15 dark:text-amber-300",
              step.state === "returned" && "bg-[#ffe4e6] text-[#be123c] dark:bg-rose-500/15 dark:text-rose-300",
              step.state === "todo" && "bg-well text-ink-muted",
            )}
            aria-hidden="true"
          >
            {step.state === "done" ? <Check className="size-3.5" /> : step.state === "returned" ? <CornerUpLeft className="size-3.5" /> : <Circle className="size-2.5" />}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className={cn("text-sm font-bold", step.state === "todo" ? "text-ink-muted" : "text-ink")}>{step.title}</span>
            {step.detail ? <span className="text-xs text-ink-muted">{step.detail}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
