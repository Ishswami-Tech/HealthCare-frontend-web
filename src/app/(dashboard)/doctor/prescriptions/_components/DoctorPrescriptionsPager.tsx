"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serverPaging } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { PAGE_SIZE_CHOICES, pageWindow } from "./doctor-prescriptions.filters";

export interface DoctorPrescriptionsPagerProps {
  page: number;
  pageSize: number;
  total: number;
  /** Rows really on this page (the range ends at the last one shown). */
  rowCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const NUMBER = new Intl.NumberFormat("en-IN");

/** "Showing 26–50 of 1,234", rows-per-page select, first / previous / numbers / next / last. */
export function DoctorPrescriptionsPager({
  page,
  pageSize,
  total,
  rowCount,
  onPageChange,
  onPageSizeChange,
}: DoctorPrescriptionsPagerProps) {
  const paging = serverPaging({ page, pageSize, total, rowCount, onPageChange });
  const { pageCount, rangeStart, rangeEnd } = paging;
  const current = paging.page;
  const go = (target: number) => {
    const next = Math.min(Math.max(1, target), pageCount);
    if (next !== current) onPageChange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t border-hair px-4 py-2.5 text-[13px] text-ink-muted">
      <span aria-live="polite">
        Showing {NUMBER.format(rangeStart)}–{NUMBER.format(rangeEnd)} of {NUMBER.format(paging.total)}
      </span>
      <span className="flex items-center gap-2">
        <span id="rx-page-size-label">Rows</span>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger
            size="sm"
            aria-labelledby="rx-page-size-label"
            className="h-8 min-w-[68px] rounded-[10px] px-2.5 text-[13px] font-semibold text-ink data-[size=sm]:h-8"
          >
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_CHOICES.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </span>
      <nav aria-label="Prescription pages" className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => go(1)} disabled={current <= 1} aria-label="First page">
          <ChevronsLeft aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => go(current - 1)} disabled={current <= 1} aria-label="Previous page">
          <ChevronLeft aria-hidden="true" />
        </Button>
        <ul className="m-0 flex list-none items-center gap-1 p-0">
          {pageWindow(current, pageCount).map((entry, index) =>
            entry === "gap" ? (
              <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-ink-muted max-sm:hidden">
                …
              </li>
            ) : (
              <li key={entry} className={cn(entry !== current && "max-sm:hidden")}>
                <Button
                  variant={entry === current ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => go(entry)}
                  aria-label={`Page ${entry}`}
                  aria-current={entry === current ? "page" : undefined}
                  className={cn("h-8 min-w-8 px-2 tabular-nums", entry === current && "font-bold text-brand")}
                >
                  {entry}
                </Button>
              </li>
            ),
          )}
        </ul>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => go(current + 1)}
          disabled={current >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => go(pageCount)} disabled={current >= pageCount} aria-label="Last page">
          <ChevronsRight aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}
