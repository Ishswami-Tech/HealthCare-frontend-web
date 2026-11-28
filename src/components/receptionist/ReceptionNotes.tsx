import { Check, Lock, X } from "lucide-react";
import { Note } from "@/components/tbd";

/** Reception sees no clinical record: the one sentence every desk screen uses. */
export function NoClinicalRecordsNote({ className }: { className?: string }) {
  return (
    <Note tone="blue" icon={Lock} {...(className ? { className } : {})}>
      <strong className="font-bold">Clinical records are visible to doctors only.</strong> Case notes, prescriptions,
      vitals and reports are not shown at the front desk.
    </Note>
  );
}

/** What the front desk can and cannot do (product rules v2). Shown on the profile. */
export const RECEPTION_CAN_DO: Array<{ allowed: boolean; text: string }> = [
  { allowed: true, text: "See every appointment of your location and check patients in with one click" },
  { allowed: true, text: "Add walk-ins to the queue and register new patients" },
  { allowed: true, text: "Reschedule visits and assign the doctor" },
  { allowed: true, text: "Collect payment after the doctor completes a visit" },
  { allowed: false, text: "Book video visits (patients book them in the app)" },
  { allowed: false, text: "See clinical records, prescriptions or reports" },
];

export function ReceptionCanDoList() {
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {RECEPTION_CAN_DO.map((item) => {
        const Icon = item.allowed ? Check : X;
        return (
          <li key={item.text} className="flex items-start gap-2.5 text-[13px] text-ink-soft">
            <Icon
              className={item.allowed ? "mt-0.5 size-4 shrink-0 text-brand" : "mt-0.5 size-4 shrink-0 text-[#be123c] dark:text-rose-300"}
              strokeWidth={2.4}
              aria-hidden="true"
            />
            <span>
              <span className="sr-only">{item.allowed ? "Allowed: " : "Not allowed: "}</span>
              {item.text}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
