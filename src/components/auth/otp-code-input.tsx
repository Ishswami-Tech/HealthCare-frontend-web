"use client";

import * as React from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import {
  InputOTP,
  InputOTPGroup,
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
  separator = false,
  ...props
}: OtpCodeInputProps) {
  const slots = React.useMemo(() => {
    return Array.from({ length: maxLength }, (_, index) => (
      <InputOTPSlot
        key={index}
        index={index}
        aria-invalid={invalid}
        className={cn(
          invalid && "border-destructive text-destructive focus-visible:border-destructive",
          slotClassName
        )}
      />
    ));
  }, [invalid, maxLength, slotClassName]);

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
      className={cn("justify-center text-slate-900 dark:text-white", invalid && "text-destructive", className)}
      containerClassName={cn("flex items-center justify-center gap-2 sm:gap-2.5 bg-transparent", containerClassName)}
    >
      <InputOTPGroup className="gap-2 sm:gap-2.5 flex items-center justify-center">{slots}</InputOTPGroup>
    </InputOTP>
  );
}


