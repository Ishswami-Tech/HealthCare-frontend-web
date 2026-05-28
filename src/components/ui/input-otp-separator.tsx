"use client"

import * as React from "react"
import { MinusIcon } from "lucide-react"

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <span
      data-slot="input-otp-separator"
      aria-hidden="true"
      className="text-muted-foreground dark:text-slate-400"
      {...props}
    >
      <MinusIcon />
    </span>
  )
}

export { InputOTPSeparator }
