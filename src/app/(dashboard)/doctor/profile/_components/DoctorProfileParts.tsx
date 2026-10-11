import type { ReactNode } from "react";
import { IconBox, Surface, type TbdIcon } from "@/components/tbd";
import { cn } from "@/lib/utils";

/** White profile card with the icon-square heading used on every tab. */
export function ProfileCard({
  icon,
  title,
  description,
  action,
  className,
  children,
}: {
  icon?: TbdIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Surface as="section" className={cn("gap-4 p-[22px]", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {icon ? <IconBox icon={icon} size={36} /> : null}
        <div className="flex min-w-0 flex-1 basis-[200px] flex-col gap-0.5">
          <h2 className="m-0 text-base font-bold text-ink">{title}</h2>
          {description ? <p className="m-0 text-[13px] text-ink-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Surface>
  );
}

/** Label over a form control. `aside` sits next to the label (for example a "Verified" tag). */
export function ProfileField({
  label,
  htmlFor,
  aside,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex min-h-5 items-center gap-2">
        <label htmlFor={htmlFor} className={PROFILE_LABEL}>
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}

export const PROFILE_LABEL = "text-xs font-bold text-ink-soft";

/** The 48 × 28 switch of the designs, on top of the shared `Switch`. */
export const PROFILE_SWITCH =
  "h-7 w-12 border-0 p-[3px] shadow-none data-[state=unchecked]:bg-[#cbd5e1] dark:data-[state=unchecked]:bg-white/20 [&>span]:size-[22px] [&>span]:shadow-[0_1px_3px_rgba(0,0,0,0.2)] [&>span[data-state=checked]]:translate-x-5";
