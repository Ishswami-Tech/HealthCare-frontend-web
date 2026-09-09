"use client"

import * as React from "react"
import { OTPInputContext } from "input-otp"

import { cn } from "@/lib/utils/index"

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.use(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex size-11 sm:size-12 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50/80 text-base sm:text-lg font-bold text-slate-900 shadow-2xs transition-all outline-none",
        "dark:border-slate-700/90 dark:bg-slate-800/70 dark:text-slate-100",
        "data-[active=true]:z-10 data-[active=true]:border-cyan-500 data-[active=true]:bg-white data-[active=true]:ring-2 data-[active=true]:ring-cyan-500/25",
        "dark:data-[active=true]:border-cyan-400 dark:data-[active=true]:bg-slate-900 dark:data-[active=true]:ring-cyan-400/35 dark:data-[active=true]:shadow-[0_0_14px_rgba(34,211,238,0.25)]",
        "aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-cyan-500 dark:bg-cyan-400 h-5 w-0.5 duration-1000 rounded-full" />
        </div>
      )}
    </div>
  )
}

export { InputOTPSlot }

