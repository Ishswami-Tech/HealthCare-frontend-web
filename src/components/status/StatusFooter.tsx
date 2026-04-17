"use client";

import { cn } from "@/lib/utils/index";

import { MinimalStatusIndicator } from "@/components/common/MinimalStatusIndicator";

export function StatusFooter({ className }: { className?: string }) {
  // Use the properly implemented MinimalStatusIndicator which now handles global status correctly
  return (
    <div className={cn("w-full flex justify-end py-6", className)}>
       <MinimalStatusIndicator />
    </div>
  );
}
