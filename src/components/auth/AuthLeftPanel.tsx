"use client";

import Image from "next/image";
import { CalendarDays, Heart, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function AuthBrandLogo({
  className = "",
  imgClassName = "",
}: {
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cn("relative shrink-0 flex items-center justify-center", className)}>
      {/* Light mode logo */}
      <Image
        src="/assets/dhanvantari-logo-light.png"
        alt="Ayurveda Care"
        width={128}
        height={128}
        className={cn("block dark:hidden object-contain drop-shadow-xs", imgClassName)}
      />
      {/* Dark mode logo */}
      <Image
        src="/assets/dhanvantari-logo-dark.png"
        alt="Ayurveda Care"
        width={128}
        height={128}
        className={cn("hidden dark:block object-contain rounded-full drop-shadow-xs", imgClassName)}
      />
    </div>
  );
}

// Retain LotusMark export for backwards compatibility
export function LotusMark({ className = "" }: { className?: string }) {
  return <AuthBrandLogo className={className} />;
}

const points = [
  { icon: ShieldCheck, title: "Secure & private", copy: "Your health data stays protected." },
  { icon: CalendarDays, title: "Easy appointments", copy: "Book, reschedule and manage with ease." },
  { icon: Heart, title: "Expert Ayurvedic care", copy: "Guidance directly from the doctor." },
];

const promises = [
  "Holistic healing, rooted in Ayurveda",
  "Thousands of happy patients",
  "Years of trusted service",
];

/** Clinic panel on the left of every auth page (desktop only; phones use the artwork background). */
export function AuthLeftPanel() {
  return (
    <section className="auth-desktop-panel absolute inset-y-0 left-0 z-10 hidden overflow-hidden text-[#132238] transition-colors duration-300 lg:block lg:w-[70.2%] dark:text-slate-100">
      <div
        role="img"
        aria-label="Dr. Chandrakumar Deshmukh in an Ayurvedic forest setting"
        className="auth-desktop-hero pointer-events-none absolute inset-0"
      />

      <div
        className={cn(
          "relative z-10 flex h-full flex-col justify-between gap-6 px-11 py-7",
          // Short laptop screens: shrink the copy instead of letting it collide.
          "[@media(min-height:600.1px)_and_(max-height:700px)]:[zoom:0.86]",
          "[@media(max-height:600px)]:[zoom:0.74]",
        )}
      >
        {/* Clinic name */}
        <header className="flex items-center gap-3">
          <AuthBrandLogo className="size-[52px]" imgClassName="size-full" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[clamp(16px,1.39vw,20px)] font-extrabold leading-tight tracking-[-0.4px] text-[#075735] dark:text-emerald-400">
              Dr. Chandrakumar Deshmukh
            </span>
            <span className="text-[clamp(9.5px,0.76vw,11px)] font-semibold tracking-[1.6px] text-[#1f2937] dark:text-emerald-200/80">
              AYURVEDA &nbsp;•&nbsp; VIDDHAKARMA &nbsp;•&nbsp; AGNIKARMA
            </span>
          </div>
        </header>

        {/* Welcome copy */}
        <div className="flex max-w-[clamp(280px,25.8vw,372px)] flex-col">
          <span className="self-start rounded-full bg-[#edf0cf] px-3.5 py-1.5 text-[13px] font-bold leading-tight text-[#075735] dark:bg-emerald-950/70 dark:text-emerald-300">
            Welcome to
          </span>
          <h1 className="m-0 mt-[18px] text-[clamp(31px,3.05vw,44px)] font-extrabold leading-[1.05] tracking-[-1.2px] text-[#075735] dark:text-emerald-50">
            <span className="whitespace-nowrap">Dr. Chandrakumar</span>
            <br />
            Deshmukh
          </h1>
          <span className="mt-2 text-[clamp(18px,1.67vw,24px)] font-semibold leading-tight text-[#075735] dark:text-emerald-400">
            Healthcare Portal
          </span>
          <span aria-hidden="true" className="mt-4 h-[3px] w-16 rounded-sm bg-brand" />
          <p className="m-0 mt-4 text-[clamp(13px,1.04vw,15px)] leading-[1.6] text-[#132238] dark:text-slate-300">
            Authentic Ayurvedic care. Book appointments, consult the doctor and keep your health
            records in one place.
          </p>

          <ul className="m-0 mt-[22px] flex list-none flex-col gap-3.5 p-0">
            {points.map(({ icon: Icon, title, copy }) => (
              <li
                key={title}
                // Narrow desktops: the copy runs over the photo, so it gets a soft backdrop.
                className="-m-1.5 flex items-center gap-3 self-start rounded-full p-1.5 pr-4 max-xl:bg-[#fffdfa]/85 dark:max-xl:bg-slate-900/75"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#edf0cf] text-[#075735] dark:bg-emerald-950/80 dark:text-emerald-400">
                  <Icon className="size-[17px]" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-bold leading-tight text-[#101820] dark:text-slate-100">
                    {title}
                  </span>
                  <span className="text-xs text-[#475467] dark:text-slate-400">{copy}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Promises */}
        <ul className="m-0 flex list-none flex-wrap items-center gap-2.5 p-0 text-xs font-semibold text-[#075735] dark:text-emerald-300">
          {promises.map((promise) => (
            <li
              key={promise}
              className="whitespace-nowrap rounded-full border border-[#eadfc9] bg-[#fffdfa]/[0.92] px-3.5 py-[7px] leading-tight dark:border-slate-700 dark:bg-slate-900/85"
            >
              {promise}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
