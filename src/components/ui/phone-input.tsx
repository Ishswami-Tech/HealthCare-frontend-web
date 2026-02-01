"use client";

import React, { forwardRef } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./phone-input-overrides.css"; // Our custom overrides AFTER library CSS
import { cn } from "@/lib/utils";

export interface PhoneInputProps
  extends Omit<React.ComponentProps<typeof PhoneInput>, "onChange"> {
  onChange?: (value: string | undefined) => void;
  className?: string;
  error?: boolean;
}

const PhoneInputComponent = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, error, ...props }, ref) => {
    return (
      <PhoneInput
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "phone-input-container",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-within:ring-red-500",
          className
        )}
        onChange={onChange as any}
        ref={ref as any}
        numberInputProps={{
          className: "PhoneInputInput",
          autoComplete: "off",
          readOnly: false
        }}
        defaultCountry="IN"
        {...props}
      />
    );
  }
);
PhoneInputComponent.displayName = "PhoneInput";

export default PhoneInputComponent;
