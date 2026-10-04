import { Chip, InitialsAvatar, Pill, statusTone } from "@/components/tbd";
import { getQueuePatientDisplayName, getQueuePositionLabel } from "@/lib/queue/queue-adapter";
import { getQueueDisplayLabel, getQueueStatusText, type QueueDisplayItem } from "./queue.logic";

/** Amber avatar used for every patient in the queue (as in the designs). */
export const QUEUE_AVATAR_CLASS = "bg-[#fde68a] text-[#92400e]";

/** The selected patient at the top of the "Move to" and "Assign doctor" dialogs. */
export function QueuePatientSummary({
  item,
  showCategory = false,
}: {
  item: QueueDisplayItem;
  /** Adds the current queue next to the status tag ("Move to" dialog). */
  showCategory?: boolean;
}) {
  const name = getQueuePatientDisplayName(item);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-hair bg-[#f8fafc] px-3.5 py-3 dark:bg-white/5">
      <InitialsAvatar name={name} className={QUEUE_AVATAR_CLASS} />
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-sm font-bold text-ink">{name}</span>
        <span className="truncate text-xs text-ink-muted">
          {item.doctorName || "Assigned doctor pending"} · {getQueuePositionLabel({ position: item.position || 0 })}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        {showCategory ? <Chip tone="clinic">{getQueueDisplayLabel(item)}</Chip> : null}
        <Pill tone={statusTone(item.status)}>{getQueueStatusText(item)}</Pill>
      </span>
    </div>
  );
}
