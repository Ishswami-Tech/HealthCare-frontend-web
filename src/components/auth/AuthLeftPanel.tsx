"use client";

import Image from "next/image";
import { CalendarDays, Heart, Leaf, ShieldCheck, Stethoscope } from "lucide-react";

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
  { icon: Stethoscope, title: "Expert Ayurvedic Care", copy: "Get guidance directly from Dr. Chandrakumar Deshmukh." },
];

export function AuthLeftPanel() {
  return (
    <section className="relative hidden h-screen min-h-0 overflow-hidden bg-[#fbfaf5] dark:bg-[#0c1310] lg:flex lg:w-[69.5%] flex-col justify-between px-[3.5vw] py-[2.2vh] text-[#132238] dark:text-slate-100 transition-colors duration-300">
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
      <div className="relative z-10 my-[1.2vh] flex min-h-0 flex-1 items-center">
        {/* Left text column */}
        <div className="relative z-20 flex h-full max-h-[100%] w-[44%] max-w-[430px] flex-col justify-center py-[1vh]">
          <div>
            <span className="inline-flex rounded-xl border border-transparent bg-[#e9efdf] px-[clamp(12px,1vw,18px)] py-[clamp(4px,0.6vh,8px)] text-[clamp(11.5px,0.9vw,16px)] font-medium text-[#075735] dark:border-emerald-800/50 dark:bg-emerald-950/70 dark:text-emerald-300">
              Welcome to
            </span>
            <h1 className="mt-[clamp(12px,2vh,22px)] font-serif text-[clamp(28px,2.7vw,54px)] font-bold leading-[1.06] tracking-[-.035em] text-[#005438] dark:text-emerald-50">
              Dr. Chandrakumar<br />Deshmukh
            </h1>
            <p className="mt-[clamp(8px,1.3vh,15px)] font-serif text-[clamp(18px,1.75vw,34px)] leading-tight text-[#075735] dark:text-emerald-400">
              Patient Care Portal
            </p>
            <div className="mt-[clamp(12px,1.8vh,20px)] h-[3px] w-[clamp(56px,5.5vw,88px)] rounded-full bg-[#2e8b49] dark:bg-emerald-500" />
            <p className="mt-[clamp(12px,1.8vh,22px)] max-w-[380px] text-[clamp(11.5px,0.85vw,15.5px)] leading-[1.55] text-[#132238] dark:text-slate-300">
              Your trusted partner for authentic Ayurvedic care.<br />
              Book appointments, consult with the doctor and manage your health records — all in one place.
            </p>
          </div>

          {/* 3 Feature cards */}
          <div className="mt-[clamp(16px,2.4vh,28px)] space-y-[clamp(10px,1.5vh,16px)]">
            {features.map(({ icon: Icon, title, copy }) => (
              <div
                key={title}
                className="flex w-full max-w-[380px] items-center gap-[clamp(10px,1vw,14px)] rounded-2xl border border-[#e4e6df] bg-white/95 px-[clamp(12px,1vw,16px)] py-[clamp(8px,1.1vh,12px)] shadow-[0_4px_18px_rgba(22,69,44,.06)] backdrop-blur-xs transition-colors dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_4px_18px_rgba(0,0,0,.35)]"
              >
                <div className="flex size-[clamp(36px,2.6vw,44px)] shrink-0 items-center justify-center rounded-full bg-[#eaf1df] text-[#14723f] dark:border dark:border-emerald-800/40 dark:bg-emerald-950/80 dark:text-emerald-400">
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

        {/* Theme variants share the same subject, pose, and composition. */}
        <div className="absolute inset-y-[-1.5vh] left-[30%] lg:left-[33%] xl:left-[35%] right-[-3.5vw] z-10 overflow-hidden pointer-events-none">
          <div
            className="relative h-full w-full"
            style={{
              maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 100%)",
            }}
          >
            <Image
              src="/assets/auth-login-hero-light.png"
              alt="Dr. Chandrakumar Deshmukh"
              fill
              priority
              className="block object-cover object-[50%_35%] dark:hidden"
              sizes="65vw"
            />
            <Image
              src="/assets/auth-login-hero.png"
              alt="Dr. Chandrakumar Deshmukh"
              fill
              priority
              className="hidden object-cover object-[50%_35%] dark:block"
              sizes="65vw"
            />
            <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-[#fbfaf5] to-transparent pointer-events-none dark:from-[#0c1310]" />
          </div>
        </div>
      </div>

      {/* Bottom Floating Stats Bar */}
      <div className="relative z-30 shrink-0 mr-[-2vw] grid grid-cols-3 rounded-[18px] border border-[#dfe3da] bg-white/95 px-[clamp(10px,1.2vw,18px)] py-[clamp(8px,1.1vh,13px)] shadow-[0_6px_20px_rgba(22,69,44,.07)] backdrop-blur-xs transition-colors dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-[0_6px_20px_rgba(0,0,0,.35)]">
        {[
          { icon: Leaf, title: "Holistic Healing", sub: "Rooted in Ayurveda" },
          { icon: Heart, title: "Thousands of Happy Patients", sub: "Across India" },
          { isLogo: true, title: "Years of Trusted Service", sub: "Serving with Compassion" }
        ].map((item, i) => {
          const Icon = "icon" in item ? item.icon : null;
          return (
            <div key={item.title} className={`flex items-center gap-[clamp(8px,0.8vw,14px)] px-[clamp(6px,0.8vw,14px)] ${i ? "border-l border-[#d7ddd5] dark:border-slate-800" : ""}`}>
              <div className="flex size-[clamp(36px,2.5vw,46px)] shrink-0 items-center justify-center rounded-full bg-[#edf3e4] text-[#218445] dark:border dark:border-emerald-800/40 dark:bg-emerald-950/80 dark:text-emerald-400">
                {"isLogo" in item && item.isLogo ? (
                  <AuthBrandLogo className="size-[clamp(26px,1.9vw,34px)]" imgClassName="size-full" />
                ) : Icon ? (
                  <Icon className="size-[clamp(18px,1.3vw,24px)] fill-current" />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="text-[clamp(10.5px,0.76vw,14.5px)] font-bold leading-tight text-[#075735] dark:text-emerald-300 truncate">{item.title}</div>
                <div className="mt-0.5 text-[clamp(8.5px,0.65vw,12px)] leading-tight text-[#25324a] dark:text-slate-400 truncate">{item.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
