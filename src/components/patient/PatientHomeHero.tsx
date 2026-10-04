"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";

interface PatientHomeHeroProps {
  /** Greeting word, already translated ("Hi"). */
  hello: string;
  /** Patient's first name. */
  name: string;
  /** Second line of the greeting ("how are you feeling today?", "Your care, your schedule."). */
  question: string;
  /** The clinic's doctor. When a name is given, the doctor card shows on the right. */
  doctorName?: string;
  doctorSubtitle?: string;
  /** Where the doctor card leads (booking). */
  doctorHref?: string;
  /** Buttons under the greeting (scan check-in, book). */
  actions?: ReactNode;
}

interface Moment {
  greeting: string;
  date: string;
  night: boolean;
}

/** Time-of-day greeting, resolved on the client so server and browser clocks can't disagree. */
function readMoment(): Moment {
  const now = new Date();
  const hour = now.getHours();
  return {
    greeting: hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening",
    date: now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    night: hour >= 18 || hour < 5,
  };
}

/**
 * Patient Home banner: a mint → amber glow, the time-of-day greeting, "Hi <name>," and the
 * two page actions on the left; the clinic's doctor (when there is one to show) on the right.
 * Sized by its own width (container queries), so it stacks to one column when narrow.
 */
export function PatientHomeHero({
  hello,
  name,
  question,
  doctorName,
  doctorSubtitle,
  doctorHref,
  actions,
}: PatientHomeHeroProps) {
  const [moment, setMoment] = useState<Moment | null>(null);
  const [portraitFailed, setPortraitFailed] = useState(false);
  useEffect(() => {
    setMoment(readMoment());
  }, []);
  const TimeIcon = moment?.night ? Moon : Sun;
  const showDoctor = Boolean(doctorName && doctorHref);

  return (
    <section
      aria-label="Welcome"
      className="@container relative overflow-hidden rounded-3xl border border-[#fde68a] bg-[radial-gradient(60%_120%_at_96%_0%,rgba(251,191,36,0.5)_0%,rgba(251,191,36,0)_60%),radial-gradient(70%_140%_at_0%_100%,rgba(110,231,183,0.6)_0%,rgba(110,231,183,0)_66%),linear-gradient(120deg,#ecfdf5_0%,#fffbeb_38%,#fef3c7_70%,#fde68a_100%)] px-5 py-6 text-ink shadow-[0_10px_24px_rgba(4,120,87,0.08)] sm:px-7 sm:py-[26px] dark:border-amber-900/40 dark:bg-[radial-gradient(60%_120%_at_96%_0%,rgba(251,191,36,0.18)_0%,rgba(251,191,36,0)_60%),radial-gradient(70%_140%_at_0%_100%,rgba(16,185,129,0.22)_0%,rgba(16,185,129,0)_66%),linear-gradient(120deg,#0f2a22_0%,#15241d_45%,#2b2412_100%)] dark:shadow-none"
    >
      <div className="flex flex-col gap-6 @3xl:flex-row @3xl:items-center @3xl:gap-7">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-center gap-1.5 self-start rounded-full bg-white py-[5px] pl-2 pr-[11px] text-xs text-ink dark:bg-white/10">
            <TimeIcon className="size-[15px] fill-amber-500 text-amber-500" aria-hidden="true" />
            <span className="font-bold">{moment?.greeting ?? "Welcome"}</span>
            {moment ? (
              <>
                <span aria-hidden="true" className="size-[3px] rounded-full bg-ink-soft" />
                <span className="font-medium text-ink-soft">{moment.date}</span>
              </>
            ) : null}
          </div>

          <h1 className="m-0 flex flex-col gap-0.5">
            <span className="break-words text-[30px] font-extrabold leading-[1.15] tracking-[-0.7px]">
              {hello} <span className="text-[#c2410c] dark:text-amber-300">{name}</span>,
            </span>
            <span className="text-[17px] font-semibold text-ink-soft">{question}</span>
          </h1>

          {actions ? <div className="mt-1.5 flex flex-wrap items-center gap-2.5">{actions}</div> : null}
        </div>

        {showDoctor ? (
          <Link
            href={doctorHref as string}
            aria-label={`Book a visit with ${doctorName}`}
            className="relative flex h-[148px] w-full shrink-0 overflow-hidden rounded-[22px] border border-[#fde68a] bg-[linear-gradient(135deg,#ffffff_0%,#fffbeb_100%)] text-ink shadow-[0_14px_30px_rgba(6,78,59,0.16)] transition-transform hover:-translate-y-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 @3xl:w-[380px] dark:border-amber-200/20 dark:bg-[linear-gradient(135deg,#131c2e_0%,#1a2438_100%)] dark:shadow-none"
          >
            {/* Two amber rings behind the portrait. */}
            <span
              aria-hidden="true"
              className="absolute -right-10 -top-9 size-[210px] rounded-full border-[1.2px] border-[rgba(253,230,138,0.85)] bg-[rgba(253,230,138,0.26)] dark:border-amber-300/20 dark:bg-amber-300/10"
            />
            <span
              aria-hidden="true"
              className="absolute right-0 top-2 size-[132px] rounded-full bg-[rgba(253,230,138,0.5)] dark:bg-amber-300/20"
            />
            {portraitFailed ? null : (
              <Image
                src="/assets/dashboard/home-doctor.webp"
                alt=""
                width={148}
                height={148}
                priority
                onError={() => setPortraitFailed(true)}
                className="absolute -right-2 bottom-0 size-[148px]"
              />
            )}
            <span className="relative flex w-[min(220px,calc(100%-120px))] flex-col gap-1 pl-5 pt-[18px]">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#047857] dark:text-emerald-300">
                <span aria-hidden="true" className="size-2 rounded-full bg-[#10b981]" />
                Your doctor
              </span>
              <span className="line-clamp-2 text-[17px] font-extrabold leading-[1.2] tracking-[-0.3px]">
                {doctorName}
              </span>
              {doctorSubtitle ? <span className="truncate text-xs text-ink-soft">{doctorSubtitle}</span> : null}
              <span className="mt-1.5 self-start rounded-[10px] bg-action px-3 py-[7px] text-xs font-extrabold text-[#0f1b2d] shadow-[0_4px_10px_rgba(254,154,0,0.28)]">
                Book a visit
              </span>
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
