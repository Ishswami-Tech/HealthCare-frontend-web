"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBox, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import {
  INVOICE_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  type BillingFilterState,
} from "./billing.logic";

interface BillingFiltersProps {
  /** Which list the filters narrow. */
  scope: "invoices" | "payments";
  filters: BillingFilterState;
  onChange: (patch: Partial<BillingFilterState>) => void;
  onReset: () => void;
}

/**
 * Native date field. While it is empty and not focused it reads "From date" / "To date"
 * like the design; the browser's own day / month / year boxes show as soon as it is used.
 */
function DateField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min?: string | undefined;
  max?: string | undefined;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const showLabel = value === "" && !focused;
  return (
    <div className="relative min-w-0 basis-full @md:flex-1 @md:basis-0 @4xl:w-[140px] @4xl:flex-none @4xl:basis-auto">
      <input
        id={id}
        type="date"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "h-11 w-full min-w-0 rounded-xl border border-line bg-card px-3.5 text-sm outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-input/30 dark:[color-scheme:dark]",
          showLabel ? "text-transparent" : "text-ink",
        )}
      />
      {showLabel ? (
        <span
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-muted"
          aria-hidden="true"
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className="w-full basis-full border-line text-ink @md:flex-1 @md:basis-0 @4xl:w-[142px] @4xl:flex-none @4xl:basis-auto"
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Search, date range, status (and method for payments) and Reset. Shown on the Invoices and Payments tabs. */
export function BillingFilters({ scope, filters, onChange, onReset }: BillingFiltersProps) {
  return (
    <Surface className="@container p-4" role="search" aria-label={scope === "invoices" ? "Filter invoices" : "Filter payments"}>
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchBox
          value={filters.searchTerm}
          onChange={(value) => onChange({ searchTerm: value })}
          placeholder={
            scope === "invoices"
              ? "Search by invoice number, patient, or invoice id"
              : "Search by transaction, patient, or payment id"
          }
          className="basis-full @4xl:min-w-0 @4xl:flex-1 @4xl:basis-0"
        />
        <DateField
          id={`billing-${scope}-from`}
          label="From date"
          value={filters.startDate}
          max={filters.endDate || undefined}
          onChange={(value) => onChange({ startDate: value })}
        />
        <DateField
          id={`billing-${scope}-to`}
          label="To date"
          value={filters.endDate}
          min={filters.startDate || undefined}
          onChange={(value) => onChange({ endDate: value })}
        />
        {scope === "invoices" ? (
          <FilterSelect
            label="Invoice status"
            value={filters.invoiceStatus}
            options={INVOICE_STATUS_OPTIONS}
            onChange={(value) => onChange({ invoiceStatus: value })}
          />
        ) : (
          <>
            <FilterSelect
              label="Payment status"
              value={filters.paymentStatus}
              options={PAYMENT_STATUS_OPTIONS}
              onChange={(value) => onChange({ paymentStatus: value })}
            />
            <FilterSelect
              label="Payment method"
              value={filters.paymentMethod}
              options={PAYMENT_METHOD_OPTIONS}
              onChange={(value) => onChange({ paymentMethod: value })}
            />
          </>
        )}
        <Button variant="outline" size="md" onClick={onReset} className="basis-full @md:basis-auto">
          Reset
        </Button>
      </div>
    </Surface>
  );
}
