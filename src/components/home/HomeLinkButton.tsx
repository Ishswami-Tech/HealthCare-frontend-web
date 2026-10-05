import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTROL_LIFT, CONTROL_TRANSITION } from "@/lib/design/tokens";

const EXTERNAL_HREF = /^https?:\/\//;

interface SmartLinkProps extends Omit<ComponentPropsWithoutRef<"a">, "href"> {
  href: string;
  children: ReactNode;
}

/**
 * Renders a Next.js `Link` for in-app routes and a plain anchor for
 * `tel:`, `mailto:`, hash, and external destinations.
 */
export function SmartLink({ href, children, ...rest }: SmartLinkProps) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} prefetch={false} {...rest}>
        {children}
      </Link>
    );
  }

  const externalProps = EXTERNAL_HREF.test(href)
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <a href={href} {...externalProps} {...rest}>
      {children}
    </a>
  );
}

export type HomeButtonVariant = "solid" | "inverse" | "outline" | "inverseOutline" | "soft" | "ghost";
export type HomeButtonSize = "sm" | "md" | "lg";

const BASE_CLASSES = cn(
  "group/btn relative inline-flex items-center justify-center gap-2.5 rounded-full font-heading font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
  CONTROL_TRANSITION,
  CONTROL_LIFT
);

const VARIANT_CLASSES: Record<HomeButtonVariant, string> = {
  solid:
    "home-sheen bg-primary text-primary-foreground shadow-[0_10px_28px_-10px_oklch(0.62_0.16_150_/_0.7)] hover:bg-primary/92 hover:shadow-[0_18px_38px_-12px_oklch(0.62_0.16_150_/_0.8)]",
  inverse:
    "home-sheen bg-white text-emerald-800 shadow-[0_10px_28px_-12px_rgba(0,0,0,0.45)] hover:bg-emerald-50",
  outline:
    "border border-border bg-card text-foreground shadow-[0_1px_2px_rgba(16,40,32,0.05)] hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
  inverseOutline: "border border-white/25 bg-white/10 text-white backdrop-blur hover:border-white/50 hover:bg-white/18",
  soft: "bg-primary/10 text-primary hover:bg-primary/15",
  ghost: "text-primary hover:bg-primary/10",
};

const SIZE_CLASSES: Record<HomeButtonSize, string> = {
  sm: "h-10 px-4 text-[13px]",
  md: "h-12 px-5 text-sm",
  lg: "h-14 px-7 text-[15px]",
};

const ICON_CLASSES: Record<HomeButtonSize, string> = {
  sm: "size-4",
  md: "size-4.5",
  lg: "size-5",
};

interface HomeLinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: HomeButtonVariant;
  size?: HomeButtonSize;
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  className?: string;
  ariaLabel?: string;
}

/** Pill-shaped call-to-action link used throughout the homepage. */
export function HomeLinkButton({
  href,
  children,
  variant = "solid",
  size = "md",
  icon: Icon,
  trailingIcon: TrailingIcon,
  className,
  ariaLabel,
}: HomeLinkButtonProps) {
  const iconClass = cn("shrink-0", ICON_CLASSES[size]);

  return (
    <SmartLink
      href={href}
      aria-label={ariaLabel}
      className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
    >
      {Icon ? <Icon className={iconClass} aria-hidden="true" /> : null}
      <span className="min-w-0 truncate">{children}</span>
      {TrailingIcon ? (
        <TrailingIcon
          className={cn(iconClass, "transition-transform duration-300 group-hover/btn:translate-x-1")}
          aria-hidden="true"
        />
      ) : null}
    </SmartLink>
  );
}
