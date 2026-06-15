"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppointmentStepWrapperProps {
  title?: string;
  description?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AppointmentStepWrapper({
  title,
  description,
  badge,
  children,
  className,
}: AppointmentStepWrapperProps) {
  return (
    <section className={cn("flex w-full min-w-0 flex-col gap-4", className)}>
      {(title || description || badge) && (
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {title ? <h3 className="text-sm font-semibold text-foreground">{title}</h3> : <span />}
            {badge}
          </div>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
}
