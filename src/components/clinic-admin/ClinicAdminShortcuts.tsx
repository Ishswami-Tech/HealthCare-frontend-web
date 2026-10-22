import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarOff, MapPin, Printer, ShieldCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClinicAdminShortcut {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const SETTINGS_SHORTCUTS: ClinicAdminShortcut[] = [
  { href: "/clinic-admin/print-settings", label: "Print settings", icon: Printer },
  { href: "/clinic-admin/roles", label: "Roles & permissions", icon: ShieldCheck },
  { href: "/clinic-admin/schedule/holidays", label: "Holidays & leave", icon: CalendarOff },
  { href: "/clinic-admin/locations", label: "Locations & QR", icon: MapPin },
  { href: "/clinic-admin/billing", label: "Service fees", icon: Wallet },
];

/** Row of link chips to the clinic admin sub-screens (settings, schedule). */
export function ClinicAdminShortcuts({ items = SETTINGS_SHORTCUTS, className }: { items?: ClinicAdminShortcut[]; className?: string }) {
  return (
    <nav aria-label="Related settings" className={cn("flex flex-wrap gap-2", className)}>
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-card px-3.5 text-[13px] font-bold text-ink hover:bg-mint-soft"
        >
          <Icon className="size-4 text-brand" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
