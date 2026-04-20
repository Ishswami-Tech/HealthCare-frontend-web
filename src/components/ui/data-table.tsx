"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  pageSize?: number;
  className?: string;
  toolbar?: React.ReactNode;
  pageSizeOptions?: number[];
  compact?: boolean;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No results.",
  pageSize = 10,
  className,
  toolbar,
  pageSizeOptions = [10, 25, 50, 100],
  compact = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    state: {
      sorting,
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const activePageSize = table.getState().pagination.pageSize;
  const currentPageRows = table.getRowModel().rows.length;
  const rangeStart = data.length === 0 ? 0 : pageIndex * activePageSize + 1;
  const rangeEnd = data.length === 0 ? 0 : pageIndex * activePageSize + currentPageRows;

  return (
    <div className={cn("min-w-0 space-y-4", className)}>
      {toolbar}
      <div className="w-full rounded-xl border border-border bg-card">
        <Table className={compact ? "min-w-0" : "min-w-[720px]"} compact={compact}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} compact={compact}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} compact={compact}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div
        className={cn(
          "flex flex-col gap-3 text-sm text-muted-foreground sm:gap-4",
          compact
            ? "sm:flex-row sm:items-center sm:justify-between"
            : "sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        <div className={cn("font-medium", compact && "text-xs sm:text-sm")}>
          {compact ? `${rangeStart}-${rangeEnd} of ${data.length}` : `Showing ${rangeStart}-${rangeEnd} of ${data.length} row(s)`}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!compact && (
            <div className="flex items-center gap-2">
              <span>Show</span>
              <Select
                value={String(activePageSize)}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                  table.setPageIndex(0);
                }}
              >
                <SelectTrigger className="h-8 w-[88px]">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className={cn("whitespace-nowrap", compact && "text-xs sm:text-sm")}>
            Page {pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
