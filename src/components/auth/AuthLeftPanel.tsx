"use client";

import Image from "next/image";
import { CalendarDays, Handshake, Heart, Leaf, ShieldCheck, Sprout } from "lucide-react";

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
        priority
      />
      {/* Dark mode logo */}
      <Image
        src="/assets/dhanvantari-logo-dark.png"
        alt="Ayurveda Care"
        width={128}
        height={128}
        className={cn("hidden dark:block object-contain rounded-full drop-shadow-xs", imgClassName)}
        priority
      />
    </div>
  );
}

// Retain LotusMark export for backwards compatibility
export function LotusMark({ className = "" }: { className?: string }) {
  return <AuthBrandLogo className={className} />;
}

const features = [
  { icon: ShieldCheck, title: "Secure & Private", copy: "Your health data is safe with enterprise-grade security." },
  { icon: CalendarDays, title: "Easy Appointments", copy: "Book, reschedule and manage with ease." },
  { icon: Sprout, title: "Expert Ayurvedic Care", copy: "Get guidance directly from Dr. Chandrakumar Deshmukh." },
];

export function AuthLeftPanel() {
  return (
    <section className="relative z-10 hidden h-screen min-h-0 overflow-hidden lg:flex lg:w-[71.5%] flex-col px-[3.15vw] py-[2.35vh] text-[#132238] dark:text-slate-100 transition-colors duration-300">
      <Image
        src="/assets/auth-login-forest-hero-face-corrected.png"
        alt="Dr. Chandrakumar Deshmukh in an Ayurvedic forest setting"
        fill
        priority
        className="object-cover object-[43%_center] dark:hidden"
        sizes="72vw"
        style={{
          maskImage: "linear-gradient(to right, black 0%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 0%, black 92%, transparent 100%)",
        }}
      />
      <Image
        src="/assets/auth-login-hero.png"
        alt="Dr. Chandrakumar Deshmukh in an Ayurvedic setting"
        fill
        priority
        className="hidden object-cover object-[43%_center] dark:block"
        sizes="72vw"
        style={{
          maskImage: "linear-gradient(to right, black 0%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 0%, black 92%, transparent 100%)",
        }}
      />
      {/* Header */}
      <header className="relative z-20 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-[clamp(10px,1vw,16px)]">
          <AuthBrandLogo className="size-[clamp(44px,4.8vh,64px)]" imgClassName="size-full" />
          <div>
            <div className="text-[clamp(17px,1.4vw,28px)] font-bold tracking-[-.03em] leading-tight text-[#075735] dark:text-emerald-400">
              Dr. Chandrakumar Deshmukh
            </div>
            <div className="mt-0.5 text-[clamp(9.5px,0.75vw,14px)] font-medium tracking-wider text-[#161b25] dark:text-emerald-200/80">
              AYURVEDA&nbsp;&nbsp; • &nbsp;&nbsp;VIDDHAKARMA&nbsp;&nbsp; • &nbsp;&nbsp;AGNIKARMA
            </div>
          </div>
        </div>
      </header>

      {/* Middle Hero Area */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center">
        {/* Left text column */}
        <div className="relative z-20 flex h-full w-[46%] max-w-[540px] translate-x-[0.4vw] flex-col justify-center pb-[1vh] pt-[3vh]">
          <div>
            <span className="inline-flex rounded-full border border-transparent bg-[#edf0cf] px-[clamp(13px,1vw,18px)] py-[clamp(5px,0.65vh,8px)] text-[clamp(11.5px,0.85vw,15px)] font-medium text-[#075735] dark:border-emerald-800/50 dark:bg-emerald-950/70 dark:text-emerald-300">
              Welcome to
            </span>
            <h1 className="mt-[clamp(14px,2.1vh,24px)] font-serif text-[clamp(32px,3vw,58px)] font-bold leading-[1.02] tracking-[-.035em] text-[#075735] dark:text-emerald-50">
              <span className="whitespace-nowrap">Dr. Chandrakumar</span><br />Deshmukh
            </h1>
            <p className="mt-[clamp(8px,1.25vh,14px)] font-serif text-[clamp(20px,1.8vw,34px)] leading-tight text-[#075735] dark:text-emerald-400">
              Healthcare Portal
            </p>
            <div className="mt-[clamp(13px,1.8vh,20px)] h-[2px] w-[clamp(56px,5vw,84px)] rounded-full bg-[#cf8b00] dark:bg-emerald-500" />
            <p className="mt-[clamp(12px,1.8vh,22px)] max-w-[380px] text-[clamp(11.5px,0.85vw,15.5px)] leading-[1.55] text-[#132238] dark:text-slate-300">
              Your trusted partner for authentic Ayurvedic care.<br />
              Book appointments, consult with the doctor and manage your health records — all in one place.
            </p>
          </div>

          {/* 3 Feature cards */}
          <div className="mt-[clamp(15px,2.1vh,24px)] space-y-[clamp(8px,1.1vh,12px)]">
            {features.map(({ icon: Icon, title, copy }) => (
              <div
                key={title}
                className="flex w-full max-w-[390px] items-center gap-[clamp(11px,1vw,15px)] rounded-[14px] border border-[#eadfc9] bg-[#fffdfa]/90 px-[clamp(12px,1vw,16px)] py-[clamp(8px,1vh,11px)] shadow-[0_5px_18px_rgba(83,58,15,.06)] backdrop-blur-sm transition-colors dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_4px_18px_rgba(0,0,0,.35)]"
              >
                <div className="flex size-[clamp(38px,2.75vw,46px)] shrink-0 items-center justify-center rounded-full bg-[#eef0cf] text-[#075735] dark:border dark:border-emerald-800/40 dark:bg-emerald-950/80 dark:text-emerald-400">
                  <Icon className="size-[clamp(18px,1.2vw,22px)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[clamp(11px,0.82vw,14.5px)] font-bold leading-snug text-[#101820] dark:text-slate-100">{title}</h3>
                  <p className="mt-0.5 text-[clamp(9.5px,0.68vw,12px)] leading-snug text-[#344054] dark:text-slate-400">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="relative z-30 mb-[0.4vh] grid w-full shrink-0 grid-cols-3 rounded-[14px] border border-[#eadfc9] bg-[#fffdfa]/94 px-[clamp(10px,1.2vw,18px)] py-[clamp(8px,1vh,12px)] shadow-[0_6px_20px_rgba(83,58,15,.07)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85">
        {[
          { icon: Leaf, title: "Holistic Healing", subtitle: "Rooted in Ayurveda" },
          { icon: Heart, title: "Thousands of Happy Patients", subtitle: "Across India" },
          { icon: Handshake, title: "Years of Trusted Service", subtitle: "Serving with Compassion" },
        ].map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className={cn(
                "flex min-w-0 items-center gap-[clamp(8px,1vw,15px)] px-[clamp(6px,1vw,16px)]",
                index > 0 && "border-l border-[#dddccf] dark:border-slate-700",
              )}
            >
              <div className="flex size-[clamp(38px,2.7vw,46px)] shrink-0 items-center justify-center rounded-full bg-[#eef0cf] text-[#168343] dark:bg-emerald-950/80 dark:text-emerald-400">
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-[clamp(18px,1.25vw,23px)]",
                    Icon !== Handshake && "fill-current",
                  )}
                />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[clamp(10px,0.76vw,14px)] font-bold leading-tight text-[#075735] dark:text-emerald-300">
                  {item.title}
                </div>
                <div className="mt-1 truncate text-[clamp(8.5px,0.65vw,12px)] leading-tight text-[#25324a] dark:text-slate-400">
                  {item.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
