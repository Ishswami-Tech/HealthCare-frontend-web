"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { InitialsAvatar } from "@/components/tbd";
import { cn } from "@/lib/utils";

export interface BookingVisitForOption {
  /** "" is the signed-in patient ("Myself"); any other value is a family member's id. */
  id: string;
  /** Short name on the tile (first name). */
  name: string;
  /** Used for the avatar colour and the screen-reader label; falls back to `name`. */
  fullName?: string | undefined;
  /** "Myself", "Mother", "Son". */
  relation: string;
}

export interface BookingVisitForProps {
  /** "Myself" first, then the family members. One option means there is nothing to choose. */
  options: BookingVisitForOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** The appointment already exists (waiting for payment): the person can no longer change. */
  locked?: boolean | undefined;
  /** The family list is still loading. "Myself" stays usable meanwhile. */
  loading?: boolean | undefined;
  /** Short plain line under the tiles (for example when the family list could not be read). */
  note?: string | undefined;
  /** Where family members are added. Hidden once the choice is locked. */
  addHref?: string | undefined;
}

/**
 * "Who is this visit for?" on the Confirm step (board WebBookConfirm): the patient or one of
 * their family members. Presentational only: the dialog owns the list and the selection.
 */
export function BookingVisitFor({
  options,
  selectedId,
  onSelect,
  locked = false,
  loading = false,
  note,
  addHref,
}: BookingVisitForProps) {
  return (
    <>
      <h2 id="booking-visit-for" className="m-0 text-base font-bold text-ink">
        Who is this visit for?
      </h2>
      <div role="group" aria-labelledby="booking-visit-for" className="grid grid-cols-3 gap-2.5">
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <button
              key={option.id || "self"}
              type="button"
              aria-pressed={selected}
              aria-label={`${option.fullName || option.name}, ${option.relation}`}
              disabled={locked && !selected}
              onClick={() => {
                if (!locked) onSelect(option.id);
              }}
              className={cn(
                "flex min-h-[108px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 text-center outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-brand/40",
                selected
                  ? "border-[#047857] bg-mint-soft dark:border-emerald-500"
                  : "border-line bg-card hover:border-[#a7f3d0] dark:hover:border-emerald-800",
                locked && !selected && "cursor-not-allowed opacity-50 hover:border-line",
                locked && selected && "cursor-default",
              )}
            >
              <InitialsAvatar name={option.fullName || option.name} size={40} />
              <span className="max-w-full truncate text-[13px] font-bold text-ink">{option.name}</span>
              <span className="max-w-full truncate text-xs text-ink-muted">{option.relation}</span>
            </button>
          );
        })}
        {loading ? (
          <div
            role="status"
            aria-label="Loading your family members"
            className="min-h-[108px] animate-pulse rounded-2xl border-2 border-dashed border-line bg-well/60"
          />
        ) : null}
      </div>
      {note ? <p className="m-0 text-xs leading-normal text-ink-muted">{note}</p> : null}
      {addHref && !locked ? (
        <Link
          href={addHref}
          prefetch={false}
          className="inline-flex min-h-6 items-center gap-1.5 self-start rounded-md text-[13px] font-bold text-brand underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <Plus className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
          Add a family member
        </Link>
      ) : null}
    </>
  );
}
