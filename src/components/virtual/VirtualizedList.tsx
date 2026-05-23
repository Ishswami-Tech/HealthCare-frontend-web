"use client";

import React, { useMemo } from "react";
import { useVirtualScroll } from "@/lib/utils/performance";

interface VirtualizedListProps<T> {
  items: T[];
  ItemComponent: React.ComponentType<{ item: T; index: number }>;
  itemHeight: number;
  containerHeight?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
}

/**
 * Virtualized List Component for 10M+ Users
 * Only renders visible items to improve performance with large datasets
 */
export function VirtualizedList<T>({
  items,
  ItemComponent,
  itemHeight,
  containerHeight = 600,
  overscan = 5,
  className = "",
  emptyMessage = "No items found",
}: VirtualizedListProps<T>) {
  const { scrollElementRef, visibleItems, offsetY, totalHeight, handleScroll } =
    useVirtualScroll({
      itemHeight,
      containerHeight,
      itemCount: items.length,
      overscan,
    });

  const getItemKey = (item: T): React.Key => {
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      if (record.id != null) return String(record.id);
      if (record.key != null) return String(record.key);
      if (record.slug != null) return String(record.slug);
      return JSON.stringify(record);
    }

    return String(item);
  };

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      onScroll={handleScroll}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((index) => {
            const item = items[index];
            if (!item) return null;
            return (
              <div
                key={getItemKey(item)}
                style={{ height: itemHeight }}
                className="w-full"
              >
                <ItemComponent item={item} index={index} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Pagination Component for Large Lists
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
}: PaginationProps) {
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
        >
          Previous
        </button>
        {pageNumbers.map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <span className="px-2">...</span>
            ) : (
              <button
                type="button"
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-1 text-sm border rounded ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
        >
          Next
        </button>
      </div>
    </div>
  );
}
