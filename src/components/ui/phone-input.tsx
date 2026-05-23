"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import PhoneInput, {
  type Country,
  getCountries,
  getCountryCallingCode,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// Country name via browser Intl API — no JSON import needed
const COUNTRY_DISPLAY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });
function getCountryName(country: Country): string {
  try {
    return COUNTRY_DISPLAY_NAMES.of(country) ?? country;
  } catch {
    return country;
  }
}

// Build sorted country list once at module level
const COUNTRY_OPTIONS = getCountries()
  .map((country) => ({
    value: country,
    label: getCountryName(country),
    code: getCountryCallingCode(country),
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export interface PhoneInputProps extends Omit<
  React.ComponentProps<typeof PhoneInput>,
  "onChange"
> {
  onChange?: (value: string) => void;
  className?: string;
  error?: boolean;
}

type CountrySelectProps = {
  value?: Country;
  onChange: (value: Country) => void;
  disabled?: boolean;
  options?: unknown[];
};

// Flag image from flagcdn.com — reliable CDN, works on all platforms including Windows
function FlagImage({ country }: { country: Country }) {
  const code = country.toLowerCase();
  return (
    <Image
      src={`https://flagcdn.com/w20/${code}.png`}
      width={20}
      height={15}
      alt={country}
      className="rounded-sm object-cover"
      loading="lazy"
      unoptimized
      onError={(e) => {
        // Fallback to country code text if image fails
        const target = e.currentTarget;
        target.style.display = "none";
        const fallback = target.nextElementSibling as HTMLElement;
        if (fallback) fallback.style.display = "inline";
      }}
    />
  );
}

function CountryFlag({ country }: { country: Country }) {
  return (
    <span className="inline-flex h-[15px] w-5 shrink-0 items-center justify-center overflow-hidden rounded-sm">
      <FlagImage country={country} />
      <span className="hidden text-[10px] font-bold leading-none">
        {country}
      </span>
    </span>
  );
}

function CountrySelect({ value, onChange, disabled }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const listboxId = React.useId();

  const selectedLabel = useMemo(
    () => (value ? getCountryName(value) : "Select country"),
    [value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          disabled={disabled}
          className={cn(
            "flex h-8 shrink-0 items-center gap-1 rounded-md px-2 hover:bg-accent",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
            disabled && "cursor-not-allowed opacity-50",
          )}
          aria-label={`Select country, current: ${selectedLabel}`}
        >
          {value ? (
            <CountryFlag country={value} />
          ) : (
            <span className="text-sm">🌐</span>
          )}
          <ChevronsUpDown className="size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="p-0"
        style={{
          width: "var(--radix-popover-trigger-width, 300px)",
          minWidth: "280px",
          maxWidth: "min(360px, calc(100vw - 1rem))",
        }}
        sideOffset={6}
      >
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList id={listboxId}>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-64">
                {COUNTRY_OPTIONS.map((opt) => {
                  const isSelected = value === opt.value;
                  return (
                    <CommandItem
                      key={opt.value}
                      value={`${opt.label} ${opt.value} +${opt.code}`}
                      onSelect={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className="flex cursor-pointer items-center gap-2 px-2 py-1.5"
                    >
                      {/* Flag */}
                      <CountryFlag country={opt.value} />

                      {/* Dial code next to flag — fixed width covers +1684 */}
                      <span className="w-[46px] shrink-0 tabular-nums text-xs font-medium text-foreground/70">
                        +{opt.code}
                      </span>

                      {/* Country name */}
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {opt.label}
                      </span>

                      {/* Selected check */}
                      <Check
                        className={cn(
                          "size-3.5 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type PhoneInputComponentProps = PhoneInputProps & {
  ref?: React.Ref<HTMLInputElement>;
};

function PhoneInputComponent({
  className,
  onChange,
  error,
  value,
  ref,
  ...props
}: PhoneInputComponentProps) {
  const sanitizedValue = useMemo(() => {
    if (!value || typeof value !== "string") return "";
    if (value.includes("@")) return "";
    return value;
  }, [value]);

  return (
    <div className="relative w-full">
      <PhoneInput
        className={cn(
          "flex h-9 w-full items-center rounded-md border border-input bg-background px-3 text-sm",
          "phone-input-container",
          "focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-within:ring-destructive/20 dark:focus-within:ring-destructive/40",
          className,
        )}
        onChange={(val) => onChange?.(val ?? "")}
        ref={ref as any}
        value={sanitizedValue}
        countrySelectComponent={CountrySelect as any}
        numberInputProps={{
          className:
            "PhoneInputInput flex-1 bg-transparent outline-none placeholder:text-muted-foreground",
          autoComplete: "tel",
          readOnly: false,
        }}
        defaultCountry="IN"
        {...props}
      />
    </div>
  );
}

PhoneInputComponent.displayName = "PhoneInput";

export default PhoneInputComponent;


