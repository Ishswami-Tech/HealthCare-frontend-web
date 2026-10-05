import Link from "next/link";
import {
  BookOpen,
  ClipboardPlus,
  FlaskConical,
  Hospital,
  Pill,
  Users,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Tinted tile surface. */
  tile: string;
  /** Solid icon square. */
  well: string;
}

/**
 * Static config — add or remove a shortcut here only. One colour per shortcut on a
 * matching tinted tile, the same set the mobile Home uses.
 */
const ACTIONS: QuickAction[] = [
  { label: "Video Consult", href: "/patient/appointments?openBooking=1&mode=VIDEO", icon: Video, tile: "bg-[#eef0ff] dark:bg-indigo-500/10", well: "bg-[#6366f1]" },
  { label: "Book Clinic", href: "/patient/appointments?openBooking=1&mode=IN_PERSON", icon: Hospital, tile: "bg-[#e2f8ec] dark:bg-emerald-500/10", well: "bg-[#22b07d]" },
  { label: "Reports & Lab", href: "/patient/health/reports", icon: FlaskConical, tile: "bg-[#fff1dc] dark:bg-orange-500/10", well: "bg-[#f28a1e]" },
  { label: "Records", href: "/patient/health#records", icon: ClipboardPlus, tile: "bg-[#ffece6] dark:bg-rose-500/10", well: "bg-[#f4664f]" },
  { label: "Family", href: "/patient/family", icon: Users, tile: "bg-[#e6f0ff] dark:bg-blue-500/10", well: "bg-[#3b82f6]" },
  { label: "Medicines", href: "/patient/health/medicines", icon: Pill, tile: "bg-[#dcf6f3] dark:bg-teal-500/10", well: "bg-[#14a8a0]" },
  { label: "Billing", href: "/patient/payments", icon: Wallet, tile: "bg-[#fff5d2] dark:bg-amber-500/10", well: "bg-[#e5a50a]" },
  { label: "Library", href: "/patient/library", icon: BookOpen, tile: "bg-[#f1ebff] dark:bg-violet-500/10", well: "bg-[#8b5cf6]" },
];

/** Shortcut grid: 4 across when narrow, 8 across when its own width allows (container query). */
export function PatientQuickActions({ className }: { className?: string }) {
  return (
    <section aria-labelledby="patient-quick-actions" className={cn("@container flex min-w-0 flex-col gap-3", className)}>
      <h2 id="patient-quick-actions" className="m-0 text-base font-bold text-ink">
        Quick Actions
      </h2>
      <div className="grid grid-cols-4 gap-2 @lg:gap-3 @4xl:grid-cols-8">
        {ACTIONS.map(({ label, href, icon: Icon, tile, well }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 rounded-[18px] border border-white px-1 py-3 text-center text-[11px] font-bold leading-tight text-ink shadow-[0_1px_3px_rgba(15,27,45,0.04)] transition-transform hover:-translate-y-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0 @lg:text-xs dark:border-white/10 dark:shadow-none",
              tile,
            )}
          >
            <span className={cn("flex size-[42px] shrink-0 items-center justify-center rounded-[13px] text-white", well)} aria-hidden="true">
              <Icon className="size-[19px]" strokeWidth={2.2} />
            </span>
            <span className="max-w-full break-words">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
