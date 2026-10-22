import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReceptionStage } from "./reception.logic";

/** In-clinic stages (product rules v2): Booked → Checked in → With doctor → Completed. Video visits skip the queue. */
const CLINIC_STEPS: Array<{ stage: ReceptionStage; label: string }> = [
  { stage: "booked", label: "Booked" },
  { stage: "checked_in", label: "Checked in" },
  { stage: "with_doctor", label: "With doctor" },
  { stage: "completed", label: "Completed" },
];

const VIDEO_STEPS: Array<{ stage: ReceptionStage; label: string }> = [
  { stage: "booked", label: "Booked" },
  { stage: "with_doctor", label: "In call" },
  { stage: "completed", label: "Completed" },
];

/** The visit's progress as a row of steps. A missed or cancelled visit shows no track. */
export function ReceptionStageTrack({ stage, kind }: { stage: ReceptionStage; kind: "video" | "clinic" }) {
  if (stage === "missed" || stage === "cancelled") return null;
  const steps = kind === "video" ? VIDEO_STEPS : CLINIC_STEPS;
  const current = Math.max(0, steps.findIndex((step) => step.stage === stage));
  return (
    <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0" aria-label="Visit progress">
      {steps.map((step, index) => {
        const done = index < current || stage === "completed";
        const active = index === current && stage !== "completed";
        return (
          <li key={step.stage} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-extrabold",
                done ? "bg-brand text-white" : active ? "bg-mint text-brand-dark ring-2 ring-brand" : "bg-well text-ink-muted",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : index + 1}
            </span>
            <span className={cn("text-[13px]", active || done ? "font-bold text-ink" : "text-ink-muted")}>{step.label}</span>
            {index < steps.length - 1 ? <span className="h-px w-6 bg-line" aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
