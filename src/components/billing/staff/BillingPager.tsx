"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export interface BillingPaging<T> {
  pageRows: T[];
  total: number;
  rangeStart: number;
  rangeEnd: number;
  pageSize: number;
  currentPage: number;
  pageCount: number;
  setPageSize: (size: number) => void;
  setPageIndex: (index: number) => void;
}

/**
 * Client paging for a billing table. `resetKey` changes when the filters change, and the
 * table goes back to page 1.
 */
export function useBillingPaging<T>(rows: T[], resetKey: string): BillingPaging<T> {
  const [pageSize, setPageSizeState] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [pageIndex, setPageIndex] = useState(0);
  const [appliedResetKey, setAppliedResetKey] = useState(resetKey);
  if (appliedResetKey !== resetKey) {
    setAppliedResetKey(resetKey);
    setPageIndex(0);
  }

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = rows.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return {
    pageRows,
    total,
    rangeStart: total === 0 ? 0 : currentPage * pageSize + 1,
    rangeEnd: total === 0 ? 0 : currentPage * pageSize + pageRows.length,
    pageSize,
    currentPage,
    pageCount,
    setPageSize: (size) => {
      setPageSizeState(size);
      setPageIndex(0);
    },
    setPageIndex,
  };
}

/** Table footer: "Showing 1–5 of 5 row(s)", rows per page, Previous / Next. */
export function BillingPager<T>({ paging, id }: { paging: BillingPaging<T>; id: string }) {
  const { total, rangeStart, rangeEnd, pageSize, currentPage, pageCount, setPageSize, setPageIndex } = paging;
  const labelId = `${id}-page-size`;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-hair px-5 py-3 text-[13px] text-ink-muted">
      <span>
        Showing {rangeStart}–{rangeEnd} of {total} row(s)
      </span>
      <span className="ml-auto flex items-center gap-2">
        <span id={labelId}>Show</span>
        <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
          <SelectTrigger
            size="sm"
            aria-labelledby={labelId}
            className="h-[34px] min-w-[72px] rounded-[10px] px-2.5 text-[13px] font-semibold text-ink data-[size=sm]:h-[34px]"
          >
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </span>
      <nav aria-label="Pages" className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
        <Button
          variant="outline"
          className="h-[34px]"
          onClick={() => setPageIndex(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
        >
          Previous
        </Button>
        <span className="whitespace-nowrap" aria-live="polite">
          Page {currentPage + 1} of {pageCount}
        </span>
        <Button
          variant="outline"
          className="h-[34px]"
          onClick={() => setPageIndex(Math.min(pageCount - 1, currentPage + 1))}
          disabled={currentPage >= pageCount - 1}
        >
          Next
        </Button>
      </nav>
    </div>
  );
}
