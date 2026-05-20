"use client";

import * as React from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  maxLength?: number;
  className?: string;
  containerClassName?: string;
  slotClassName?: string;
  separator?: boolean;
  id?: string;
  name?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export function OtpCodeInput({
  value,
  onChange,
  disabled,
  invalid = false,
  maxLength = 6,
  className,
  containerClassName,
  slotClassName,
  separator = true,
  ...props
}: OtpCodeInputProps) {
  const slots = React.useMemo(() => {
    return Array.from({ length: maxLength }, (_, index) => (
      <InputOTPSlot
        key={index}
        index={index}
        aria-invalid={invalid}
        className={cn(
          "h-11 w-11 text-base font-semibold sm:h-12 sm:w-12 sm:text-lg",
          invalid && "border-destructive text-destructive focus-visible:border-destructive",
          slotClassName
        )}
      />
    ));
  }, [invalid, maxLength, slotClassName]);

  const shouldSplit = separator && maxLength === 6;
  const leftSlots = shouldSplit ? slots.slice(0, 3) : slots;
  const rightSlots = shouldSplit ? slots.slice(3) : null;

  return (
    <InputOTP
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-invalid={props["aria-invalid"] ?? invalid}
      aria-describedby={props["aria-describedby"]}
      id={props.id}
      name={props.name}
      pattern={REGEXP_ONLY_DIGITS}
      className={cn("justify-center", invalid && "text-destructive", className)}
      containerClassName={cn("flex items-center justify-center gap-2", containerClassName)}
    >
      {shouldSplit ? (
        <>
          <InputOTPGroup className="gap-0">{leftSlots}</InputOTPGroup>
          <InputOTPSeparator className={invalid ? "text-destructive" : undefined} />
          <InputOTPGroup className="gap-0">{rightSlots}</InputOTPGroup>
        </>
      ) : (
        <InputOTPGroup className="gap-0">{slots}</InputOTPGroup>
      )}
    </InputOTP>
  );
}
