import { CircleCheck, X } from "lucide-react";
import { IconBox } from "@/components/tbd";
import { formatTimeInIST } from "@/lib/utils/date-time";
import { formatRupees, type CashRecordedNotice } from "./pharmacist-dashboard.logic";

interface PharmacistCashRecordedBannerProps {
  notice: CashRecordedNotice;
  onDismiss: () => void;
}

/** Shown right after a cash payment was recorded, built from the server's answer. */
export function PharmacistCashRecordedBanner({ notice, onDismiss }: PharmacistCashRecordedBannerProps) {
  const time = formatTimeInIST(notice.recordedAt).toLowerCase();
  const readyNow = notice.stillDue <= 0;

  const title = notice.alreadyPaid
    ? "Already paid — ready to dispense"
    : readyNow
      ? "Cash payment recorded — ready to dispense"
      : "Cash payment recorded";

  const event = notice.alreadyPaid
    ? "this prescription was already paid, no cash was recorded"
    : [
        notice.amount !== null && notice.amount > 0 ? `${formatRupees(notice.amount)} received in cash` : "cash received",
        time ? `at ${time}` : "",
        notice.recordedBy ? `by ${notice.recordedBy}` : "",
      ]
        .filter(Boolean)
        .join(" ");

  const details = [
    notice.patientName,
    notice.reference,
    event,
    !notice.alreadyPaid && !readyNow ? `${formatRupees(notice.stillDue)} still to collect` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-[#a7f3d0] bg-card px-4 py-3 shadow-[0_8px_20px_rgba(4,120,87,0.12)] dark:border-emerald-800 dark:shadow-none"
    >
      <IconBox icon={CircleCheck} tone="mint" size={36} />
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-sm font-bold text-ink">{title}</span>
        <span className="text-xs text-ink-muted">{details}</span>
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss this message"
        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-ink-soft transition-colors hover:bg-well focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <X className="size-[18px]" aria-hidden="true" />
      </button>
    </div>
  );
}
