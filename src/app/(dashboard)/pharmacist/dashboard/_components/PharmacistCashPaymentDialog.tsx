"use client";

import { CircleAlert, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Divider,
  InitialsAvatar,
  Kv,
  Note,
  Pill,
  SummaryLine,
  DialogActions,
  DialogBody,
  DialogShell,
} from "@/components/tbd";
import { formatDateTimeLabel, formatTimeLabel } from "@/lib/utils/date-time";
import { type DeskQueueItem } from "./pharmacist-dashboard.logic";
import { formatRupees } from "@/lib/utils/currency";
import { plural } from "@/lib/utils/labels";
import { DESK_STATE_LABEL, DESK_STATE_TONE } from "@/lib/pharmacy/desk-state";

interface PharmacistCashPaymentDialogProps {
  /** The prescription being paid; null closes the dialog. */
  item: DeskQueueItem | null;
  isRecording?: boolean;
  /** Message from the failed mutation, shown inside the dialog. */
  errorMessage?: string | null;
  onConfirm: (item: DeskQueueItem) => void;
  onClose: () => void;
}

/**
 * "Record cash payment" — the pharmacist confirms that cash was taken at the counter.
 * Nothing is recorded until "Mark paid — cash" is pressed.
 */
export function PharmacistCashPaymentDialog({
  item,
  isRecording = false,
  errorMessage = null,
  onConfirm,
  onClose,
}: PharmacistCashPaymentDialogProps) {
  const due = item?.pendingAmount ?? null;
  const dueLabel = due !== null && due > 0 ? formatRupees(due) : "";
  const pricedLines = item?.lines.filter((line) => line.quantity > 0) ?? [];
  const sentAt = item ? formatDateTimeLabel(item.sentAt) : "";
  const failedAt = item?.failedOnlinePaymentAt ? formatTimeLabel(item.failedOnlinePaymentAt) : "";

  return (
    <DialogShell
      open={item !== null}
      onClose={onClose}
      busy={isRecording}
      title="Record cash payment"
      description="Cash received at the counter for this prescription."
      width={520}
    >
      {item ? (
        <>
          <DialogBody className="max-h-[calc(100dvh-220px)]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[14px] border border-hair bg-[#f8fafc] px-3.5 py-2.5 dark:bg-white/5">
              <InitialsAvatar name={item.patientName} size={38} />
              <span className="flex min-w-0 flex-1 basis-[140px] flex-col">
                <span className="truncate text-[15px] font-extrabold text-ink">{item.patientName}</span>
                <span className="truncate text-xs text-ink-muted">
                  {[item.reference, plural(item.itemsCount, "item")].filter(Boolean).join(" · ")}
                </span>
              </span>
              <Pill tone={DESK_STATE_TONE[item.state]}>{DESK_STATE_LABEL[item.state]}</Pill>
            </div>

            {item.doctorName || sentAt ? (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {item.doctorName ? <Kv label="Prescribed by" value={item.doctorName} /> : null}
                {sentAt ? <Kv label="Sent to pharmacy" value={sentAt} /> : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-2.5 rounded-[14px] border border-line px-4 py-3.5">
              {pricedLines.map((line) => (
                <SummaryLine
                  key={line.id}
                  label={
                    line.unitPrice > 0
                      ? `${line.name} · ${line.quantity} × ${formatRupees(line.unitPrice)}`
                      : `${line.name} · ${line.quantity}`
                  }
                  value={line.unitPrice > 0 ? formatRupees(line.quantity * line.unitPrice) : "—"}
                />
              ))}
              {item.paidAmount !== null && item.paidAmount > 0 ? (
                <SummaryLine label="Already paid" value={`− ${formatRupees(item.paidAmount)}`} />
              ) : null}
              {pricedLines.length > 0 || (item.paidAmount ?? 0) > 0 ? <Divider /> : null}
              <SummaryLine bold label="Cash to collect" value={dueLabel || "—"} />
            </div>

            <Note tone="amber" icon={CircleAlert}>
              {failedAt ? `The online payment at ${failedAt} failed. ` : ""}
              {dueLabel ? `Take ${dueLabel} in cash, then confirm: ` : "Take the cash, then confirm: "}
              the prescription becomes ready to dispense and the bill is marked paid.
            </Note>

            {errorMessage ? (
              <Note tone="rose" icon={CircleAlert}>
                <span role="alert">The payment was not recorded. {errorMessage}</span>
              </Note>
            ) : null}
          </DialogBody>

          <DialogActions>
            <Button size="md" variant="outline" onClick={onClose} disabled={isRecording}>
              Cancel
            </Button>
            <Button size="md" variant="action" onClick={() => onConfirm(item)} disabled={isRecording}>
              <IndianRupee aria-hidden="true" />
              {isRecording ? "Recording…" : "Mark paid — cash"}
            </Button>
          </DialogActions>
        </>
      ) : null}
    </DialogShell>
  );
}
