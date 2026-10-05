import type { ReactNode } from "react";
import { IconBox, Surface, type TbdIcon } from "@/components/tbd";
import { cn } from "@/lib/utils";

/** White settings card with the icon-square heading (Security, Active Sessions). */
export function SettingsSection({
  id,
  icon,
  title,
  description,
  className,
  children,
}: {
  /** Anchor for deep links such as `/settings#sessions`. */
  id?: string;
  icon: TbdIcon;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <Surface
      as="section"
      className={cn("scroll-mt-24 gap-3.5 p-[22px]", className)}
      {...(id ? { id } : {})}
      {...(headingId ? { "aria-labelledby": headingId } : {})}
    >
      <div className="flex items-center gap-3">
        <IconBox icon={icon} size={36} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 id={headingId} className="m-0 text-base font-bold text-ink">
            {title}
          </h2>
          {description ? <p className="m-0 text-[13px] text-ink-muted">{description}</p> : null}
        </div>
      </div>
      {children}
    </Surface>
  );
}
