"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChips, type TbdOption } from "@/components/tbd";

/** Options worth a chip: "ALL", the active one, and any with people in them. */
export function splitQueueChipOptions(
  options: TbdOption[],
  activeValue: string,
): { shown: TbdOption[]; hiddenCount: number } {
  const shown = options.filter(
    (option) => option.value === "ALL" || option.value === activeValue || Number(option.count ?? 0) > 0,
  );
  return { shown, hiddenCount: options.length - shown.length };
}

interface QueueCompactChipsProps {
  ariaLabel: string;
  options: TbdOption[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * Filter chips for the queue that list only non-empty choices; the empty ones stay one click
 * away behind "More (n)". Keeps the filter on one line so the patient table starts higher.
 */
export function QueueCompactChips({ ariaLabel, options, value, onChange }: QueueCompactChipsProps) {
  const [showAll, setShowAll] = useState(false);
  const { shown, hiddenCount } = splitQueueChipOptions(options, value);
  const visible = showAll ? options : shown;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <FilterChips ariaLabel={ariaLabel} options={visible} value={value} onChange={onChange} />
      {hiddenCount > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="md"
          aria-expanded={showAll}
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
          {showAll ? "Fewer" : `More (${hiddenCount})`}
        </Button>
      ) : null}
    </div>
  );
}
