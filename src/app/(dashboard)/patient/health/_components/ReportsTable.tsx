"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconBox, Pill } from "@/components/tbd";
import { REPORT_KIND_LABEL, type ReportRow } from "./patient-health.logic";

const COLUMNS = "minmax(0, 2.2fr) minmax(0, 1.3fr) 112px 150px 124px";
const HEAD = ["Report", "Source", "Date", "Status"];

function RowAction({ row, onView }: { row: ReportRow; onView: (row: ReportRow) => void }) {
  if (row.fileUrl) {
    return (
      <Button variant="outline" asChild>
        <a href={row.fileUrl} target="_blank" rel="noopener noreferrer" download aria-label={`Download ${row.title}`}>
          <Download aria-hidden="true" />
          Download
        </a>
      </Button>
    );
  }
  if (row.href) {
    return (
      <Button variant="outline" asChild>
        <Link href={row.href} aria-label={`Open ${row.title}`}>
          Open
          <ChevronRight aria-hidden="true" />
        </Link>
      </Button>
    );
  }
  return (
    <Button variant="outline" onClick={() => onView(row)} aria-label={`View ${row.title}`}>
      <Eye aria-hidden="true" />
      View
    </Button>
  );
}

/**
 * The report list of Reports & Lab (also used by the Reports tab of Records): one row per
 * report with its source, date, status and one action. A report with a stored file downloads
 * it; one without opens its details; a prescription opens in Medicines.
 */
export function ReportsTable({ rows, pageSize = 10 }: { rows: ReportRow[]; pageSize?: number }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [selected, setSelected] = useState<ReportRow | null>(null);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = rows.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  return (
    <div className="flex flex-col">
      <div role="table" aria-label="Reports" className="flex flex-col">
        <div
          role="row"
          className="hidden items-center gap-x-4 border-b border-line pb-2.5 text-xs font-bold text-ink-muted lg:grid"
          style={{ gridTemplateColumns: COLUMNS }}
        >
          {HEAD.map((label) => (
            <span key={label} role="columnheader">
              {label}
            </span>
          ))}
          <span role="columnheader">
            <span className="sr-only">Action</span>
          </span>
        </div>

        {pageRows.map((row) => (
          <div
            key={row.id}
            role="row"
            className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-hair py-3 last:border-b-0 lg:grid lg:flex-none"
            style={{ gridTemplateColumns: COLUMNS }}
          >
            <div role="cell" className="flex w-full min-w-0 items-center gap-3.5 lg:w-auto">
              <IconBox icon={FileText} tone={row.iconTone} size={44} />
              {row.details.length > 0 && !row.href ? (
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className="min-w-0 truncate rounded-md text-left text-sm font-bold text-ink hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  {row.title}
                </button>
              ) : (
                <span className="min-w-0 truncate text-sm font-bold text-ink">{row.title}</span>
              )}
            </div>
            <span role="cell" className="min-w-0 truncate text-[13px] text-ink-muted">
              {row.source}
            </span>
            <span role="cell" className="text-[13px] text-ink-muted">
              {row.dateLabel || "No date"}
            </span>
            <span role="cell" className="flex">
              {row.status ? <Pill tone={row.status.tone}>{row.status.label}</Pill> : <span className="sr-only">No status</span>}
            </span>
            <span role="cell" className="ml-auto flex justify-end lg:ml-0">
              <RowAction row={row} onView={setSelected} />
            </span>
          </div>
        ))}
      </div>

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair py-3 text-[13px] text-ink-muted">
          <span>
            Showing {currentPage * pageSize + 1}–{currentPage * pageSize + pageRows.length} of {rows.length}
          </span>
          <nav aria-label="Report pages" className="flex items-center gap-2">
            <Button variant="outline" className="h-[34px]" onClick={() => setPageIndex(currentPage - 1)} disabled={currentPage <= 0}>
              Previous
            </Button>
            <span className="whitespace-nowrap" aria-live="polite">
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              className="h-[34px]"
              onClick={() => setPageIndex(currentPage + 1)}
              disabled={currentPage >= pageCount - 1}
            >
              Next
            </Button>
          </nav>
        </div>
      ) : null}

      <Dialog open={selected !== null} onOpenChange={(open) => (open ? undefined : setSelected(null))}>
        <DialogContent className="sm:max-w-[520px]">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {[REPORT_KIND_LABEL[selected.kind], selected.source, selected.dateLabel].filter(Boolean).join(" · ")}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                {selected.status ? (
                  <div>
                    <Pill tone={selected.status.tone}>{selected.status.label}</Pill>
                  </div>
                ) : null}
                {selected.details.length > 0 ? (
                  <dl className="m-0 flex flex-col">
                    {selected.details.map((detail) => (
                      <div
                        key={`${detail.label}-${detail.value}`}
                        className="flex flex-col gap-0.5 border-b border-hair py-2.5 last:border-b-0 sm:flex-row sm:justify-between sm:gap-4"
                      >
                        <dt className="shrink-0 text-[13px] text-ink-muted">{detail.label}</dt>
                        <dd className="m-0 text-sm font-semibold text-ink sm:text-right">{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="m-0 text-[13px] text-ink-muted">No more details were recorded for this report.</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" size="md" onClick={() => setSelected(null)}>
                  Close
                </Button>
                {selected.fileUrl ? (
                  <Button size="md" asChild>
                    <a href={selected.fileUrl} target="_blank" rel="noopener noreferrer" download>
                      <Download aria-hidden="true" />
                      Download
                    </a>
                  </Button>
                ) : null}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
