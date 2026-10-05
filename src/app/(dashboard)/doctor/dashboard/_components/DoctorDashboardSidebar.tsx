import Link from "next/link";
import { CalendarDays, ChevronRight, UserX, Users, Video } from "lucide-react";
import { Surface, type TbdIcon } from "@/components/tbd";

const TOOLS: Array<{ label: string; href: string; icon: TbdIcon }> = [
  { label: "Master Calendar", href: "/doctor/appointments", icon: CalendarDays },
  { label: "Patient Directory", href: "/doctor/patients", icon: Users },
  { label: "Appointments", href: "/doctor/appointments", icon: Video },
  { label: "Appointment Manager", href: "/doctor/appointments", icon: CalendarDays },
  { label: "Missed Appointments", href: "/doctor/appointments?view=NO_SHOW", icon: UserX },
];

/** Right rail "Workspace Tools": shortcuts to the doctor's other screens. */
export function DoctorDashboardSidebar() {
  return (
    <Surface as="section" className="gap-2 p-[18px]" aria-label="Workspace tools">
      <h2 className="m-0 text-base font-bold text-ink">Workspace Tools</h2>
      <nav className="flex flex-col" aria-label="Workspace tools">
        {TOOLS.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex min-h-10 items-center gap-2.5 rounded-lg text-sm font-semibold text-ink hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <Icon className="size-4 shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="size-[15px] shrink-0 text-ink-muted" strokeWidth={2.2} aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </Surface>
  );
}
