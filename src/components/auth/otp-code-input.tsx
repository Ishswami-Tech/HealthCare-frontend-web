"use client";

import * as React from "react";
import { OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";

import { InputOTP, InputOTPGroup } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Move the keyboard focus to the code field when it appears. */
  autoFocus?: boolean;
  maxLength?: number;
  className?: string;
  containerClassName?: string;
  slotClassName?: string;
  separator?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/** One code box. Reads its character and caret from the `input-otp` context. */
function OtpCodeSlot({
  index,
  invalid,
  className,
}: {
  index: number;
  invalid: boolean;
  className?: string;
}) {
  const context = React.use(OTPInputContext);
  const { char, hasFakeCaret, isActive } = context?.slots[index] ?? {};
  const filled = Boolean(char);

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      data-filled={filled}
      aria-hidden="true"
      className={cn(
        "relative flex h-[52px] w-11 items-center justify-center rounded-[14px] border-2 border-line bg-white text-[22px] font-extrabold text-ink transition-[border-color,box-shadow] sm:h-[60px] sm:w-[52px] sm:text-2xl",
        "dark:bg-slate-950/60",
        "data-[filled=true]:border-brand",
        "data-[active=true]:z-10 data-[active=true]:border-brand data-[active=true]:ring-4 data-[active=true]:ring-brand/15",
        invalid &&
          "border-[#e11d48] bg-[#fff1f2] text-[#e11d48] data-[filled=true]:border-[#e11d48] data-[active=true]:border-[#e11d48] data-[active=true]:ring-[#e11d48]/15 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-300 dark:data-[filled=true]:border-rose-500 dark:data-[active=true]:border-rose-500",
        className,
      )}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-0.5 animate-caret-blink rounded-full bg-brand duration-1000" />
        </div>
      )}
    </div>
  );
}

export function OtpCodeInput({
  value,
  onChange,
  disabled,
  invalid = false,
  autoFocus = false,
  maxLength = 6,
  className,
  containerClassName,
  slotClassName,
  separator = false,
  ...props
}: OtpCodeInputProps) {
  const slots = React.useMemo(() => {
    return Array.from({ length: maxLength }, (_, index) => (
      <OtpCodeSlot key={index} index={index} invalid={invalid} className={slotClassName} />
    ));
  }, [invalid, maxLength, slotClassName]);

  return (
    <InputOTP
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-invalid={props["aria-invalid"] || invalid}
      aria-describedby={props["aria-describedby"]}
      aria-label={props["aria-label"]}
      id={props.id}
      name={props.name}
      pattern={REGEXP_ONLY_DIGITS}
      className={cn("justify-center", className)}
      containerClassName={cn(
        "flex items-center justify-center gap-1.5 bg-transparent sm:gap-2.5",
        containerClassName,
      )}
    >
      <InputOTPGroup className="flex items-center justify-center gap-1.5 sm:gap-2.5">
        {slots}
      </InputOTPGroup>
    </InputOTP>
  );
}
