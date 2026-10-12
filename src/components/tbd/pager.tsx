"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * The one table pager of the portals: "Showing 1–10 of 42 …", Previous / Next and
 * "Page 1 of 5", with an optional rows-per-page select.
 *
 *  - a list held in memory: `const paging = usePagedRows(rows, 10)` then
 *    `paging.pageRows` and `<Pager paging={paging} />`;
 *  - a page kept by the parent (deep links, tabs): `paginateRows(rows, page, size)`;
 *  - a list the server pages: `serverPaging({ page, pageSize, total, … })`.
 *
 * Pages are counted from 1 everywhere.
 */

/** The standard rows-per-page choices. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/** One page of a list: the rows to show and the numbers the pager prints. */
export interface PageSlice<T> {
  pageRows: T[];
  /** Current page, from 1 (already clamped to the last page). */
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  /** Number of the first and the last row on the page; both 0 when the list is empty. */
  rangeStart: number;
  rangeEnd: number;
}

/** What `<Pager>` needs: the numbers and the way to change the page. */
export interface PagerState extends Omit<PageSlice<unknown>, "pageRows"> {
  setPage: (page: number) => void;
  /** Given when the rows-per-page select may be shown. */
  setPageSize?: ((size: number) => void) | undefined;
}

export interface PagedRows<T> extends PageSlice<T> {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

/** Cuts one page out of a list. `page` is clamped, so a stale page never shows an empty table. */
export function paginateRows<T>(rows: T[], page: number, pageSize: number): PageSlice<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  return {
    pageRows,
    page: current,
    pageCount,
    pageSize,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: total === 0 ? 0 : start + pageRows.length,
  };
}

export interface UsePagedRowsOptions {
  /** Changes when the filters change; the list then goes back to page 1. */
  resetKey?: string;
  /** Index of a deep-linked row in `rows`; the list opens on its page. */
  focusIndex?: number;
}

/** Client paging for a list held in memory. */
export function usePagedRows<T>(
  rows: T[],
  initialPageSize: number = PAGE_SIZE_OPTIONS[0],
  { resetKey = "", focusIndex = -1 }: UsePagedRowsOptions = {},
): PagedRows<T> {
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [page, setPage] = useState(1);
  const [appliedResetKey, setAppliedResetKey] = useState(resetKey);
  if (appliedResetKey !== resetKey) {
    setAppliedResetKey(resetKey);
    setPage(1);
  }

  useEffect(() => {
    if (focusIndex >= 0) setPage(Math.floor(focusIndex / pageSize) + 1);
  }, [focusIndex, pageSize]);

  return {
    ...paginateRows(rows, page, pageSize),
    setPage,
    setPageSize: (size) => {
      setPageSizeState(size);
      setPage(1);
    },
  };
}

/** Pager numbers for a list the server pages (the rows on screen are already one page). */
export function serverPaging({
  page,
  pageSize,
  total,
  pageCount,
  rowCount,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** Pages as the server counts them; worked out from `total` when left out. */
  pageCount?: number;
  /** Rows on this page, when known: the range then ends at the last row really shown. */
  rowCount?: number;
  onPageChange: (page: number) => void;
}): PagerState {
  const pages = Math.max(1, pageCount ?? Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize;
  const empty = rowCount === undefined ? total === 0 : rowCount === 0;
  const rangeStart = empty ? 0 : start + 1;
  const rangeEnd = empty ? 0 : rowCount === undefined ? Math.min(total, start + pageSize) : start + rowCount;
  return {
    page: current,
    pageCount: pages,
    pageSize,
    // A total the server under-reports never reads "Showing 11–20 of 15".
    total: Math.max(total, rangeEnd),
    rangeStart,
    rangeEnd,
    setPage: onPageChange,
  };
}

export interface PagerProps {
  paging: PagerState;
  /** What is counted, after the total: "active prescriptions", "row(s)". */
  noun?: string | undefined;
  /** Extra words after the count: "(42 in all)". */
  note?: string | undefined;
  /** `false` leaves out the "Showing …" text (the list says its count somewhere else). */
  showRange?: boolean;
  /** Shows the "Show [10]" select with these choices. Needs `paging.setPageSize`. */
  pageSizeOptions?: readonly number[] | undefined;
  /** Renders nothing while everything fits on one page. */
  hideWhenSinglePage?: boolean;
  /** Disables both buttons while a page loads. */
  busy?: boolean;
  /** Accessible name of the page buttons. */
  label?: string;
  /** Prefix for the ids inside (needed when two pagers with a select share a page). */
  id?: string;
  className?: string;
}

/** Table footer with the page buttons. Sits under the rows of a `Surface flush` card. */
export function Pager({
  paging,
  noun,
  note,
  showRange = true,
  pageSizeOptions,
  hideWhenSinglePage = false,
  busy = false,
  label = "Pages",
  id = "pager",
  className,
}: PagerProps) {
  const { page, pageCount, total, rangeStart, rangeEnd, pageSize, setPage, setPageSize } = paging;
  if (hideWhenSinglePage && pageCount <= 1) return null;
  const sizeSelect = pageSizeOptions && setPageSize ? { options: pageSizeOptions, onChange: setPageSize } : null;
  const labelId = `${id}-page-size`;
  // With a select or without the range text the buttons take the full row on a phone.
  const wideNav = sizeSelect !== null || !showRange;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center border-t border-hair px-5 py-3 text-[13px] text-ink-muted",
        sizeSelect ? "gap-x-4 gap-y-3" : "gap-3",
        showRange ? "justify-between" : "justify-end",
        className,
      )}
    >
      {showRange ? (
        <span>
          Showing {rangeStart}–{rangeEnd} of {total}
          {noun ? ` ${noun}` : ""}
          {note ? ` ${note}` : ""}
        </span>
      ) : null}
      {sizeSelect ? (
        <span className="ml-auto flex items-center gap-2">
          <span id={labelId}>Show</span>
          <Select value={String(pageSize)} onValueChange={(value) => sizeSelect.onChange(Number(value))}>
            <SelectTrigger
              size="sm"
              aria-labelledby={labelId}
              className="h-[34px] min-w-[72px] rounded-[10px] px-2.5 text-[13px] font-semibold text-ink data-[size=sm]:h-[34px]"
            >
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {sizeSelect.options.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </span>
      ) : null}
      <nav
        aria-label={label}
        className={cn(
          "flex items-center gap-2",
          wideNav && "w-full justify-between sm:w-auto sm:justify-start",
        )}
      >
        <Button variant="outline" size="compact" onClick={() => setPage(page - 1)} disabled={busy || page <= 1}>
          Previous
        </Button>
        <span className="whitespace-nowrap" aria-live="polite">
          Page {page} of {pageCount}
        </span>
        <Button variant="outline" size="compact" onClick={() => setPage(page + 1)} disabled={busy || page >= pageCount}>
          Next
        </Button>
      </nav>
    </div>
  );
}
