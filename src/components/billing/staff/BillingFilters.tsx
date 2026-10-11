"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBox, Surface, DateField } from "@/components/tbd";
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
          variant="placeholder"
          className="basis-full @md:flex-1 @md:basis-0 @4xl:w-[140px] @4xl:flex-none @4xl:basis-auto"
          id={`billing-${scope}-from`}
          label="From date"
          value={filters.startDate}
          max={filters.endDate || undefined}
          onChange={(value) => onChange({ startDate: value })}
        />
        <DateField
          variant="placeholder"
          className="basis-full @md:flex-1 @md:basis-0 @4xl:w-[140px] @4xl:flex-none @4xl:basis-auto"
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
