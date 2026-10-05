"use client";

/**
 * Presentational pieces shared by every auth screen (sign in, enter code, signed in,
 * forgot / reset password). No data fetching, no auth logic: props in, markup out.
 */

import type { ComponentProps, ReactNode } from "react";
import { Check, CircleAlert, Loader2, Mail, Phone } from "lucide-react";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { Note } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { AuthBrandLogo, AuthLeftPanel } from "./AuthLeftPanel";

/* ── Shared class strings ───────────────────────────────────────────────── */

/** Deep clinic green used for the auth headings and links. */
export const authTitleColor = "text-[#075735] dark:text-emerald-300";

/** Field label above an input. */
export const authLabelClass = "text-[13px] font-bold leading-tight text-ink";

/** 50 px shell around a field that has an icon or a country picker inside. */
export const authFieldShellClass = cn(
  "flex h-[50px] w-full items-center overflow-hidden rounded-[14px] border-2 border-line bg-white transition-[border-color,box-shadow]",
  "focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15",
  "has-[[aria-invalid=true]]:border-[#e11d48] has-[[aria-invalid=true]]:focus-within:ring-[#e11d48]/15",
  "dark:bg-slate-950/60",
);

/** 50 px standalone input (forgot / reset password). */
export const authInputClass = cn(
  "h-[50px] rounded-[14px] border-2 border-line bg-white px-3.5 text-base font-semibold text-ink md:text-base",
  "placeholder:font-medium placeholder:text-ink-muted",
  "focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/15",
  "aria-invalid:border-[#e11d48] dark:bg-slate-950/60",
);

/** Text link inside an auth card. */
export const authLinkClass = cn(
  "rounded-md font-bold underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50",
  authTitleColor,
);

/** Quiet "Back to sign in" link under a card's main action. */
export const authBackLinkClass =
  "mx-auto inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[13px] font-bold text-ink-soft outline-none transition-colors hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Display only: "+919876543210" → "+91 98765 43210". Emails and anything unparsable are shown as typed. */
export function formatAuthIdentifier(identifier: string): string {
  if (!identifier || identifier.includes("@")) return identifier;
  return formatPhoneNumberIntl(identifier) || identifier;
}

/* ── Page frame ─────────────────────────────────────────────────────────── */

/**
 * The whole auth page: forest artwork, the clinic panel on the left (desktop) and the
 * card column on the right. On phones the artwork becomes the page background and the
 * card sits below the portrait.
 */
export function AuthFrame({
  children,
  footer,
}: {
  children: ReactNode;
  /** Pills shown under the card (help line, system status). */
  footer?: ReactNode;
}) {
  return (
    <div className="auth-page-scroll relative h-dvh min-h-0 w-full overflow-x-hidden overflow-y-auto bg-[#fff9ed] transition-colors duration-300 lg:h-screen lg:overflow-hidden">
      {/* Full-canvas scenery contains no person; the doctor is rendered only by AuthLeftPanel. */}
      <div
        aria-hidden="true"
        className="auth-desktop-scenery pointer-events-none absolute inset-0 hidden lg:block"
      />

      {/* The mobile hero and form share one continuous forest background. */}
      <section
        aria-label="Welcome to Dr. Chandrakumar Deshmukh Clinic"
        className="auth-mobile-hero relative h-[max(180px,calc(100dvh-421px))] max-h-[540px] shrink-0 lg:hidden"
        role="img"
      />

      {/* Left side - clinic panel */}
      <AuthLeftPanel />

      {/* Right side - auth card */}
      <div
        className={cn(
          "auth-mobile-login-form relative z-20 flex min-h-0 flex-col px-4 sm:px-6",
          "lg:absolute lg:inset-y-0 lg:right-0 lg:w-[calc(460px+2*clamp(24px,4.45vw,64px))] lg:overflow-y-auto lg:px-[clamp(24px,4.45vw,64px)] lg:py-6",
          // Portrait tablets use the phone layout (see globals.css): the column spans the page again.
          "[@media(min-width:1024px)_and_(max-width:1366px)_and_(orientation:portrait)]:w-full!",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-[460px] flex-col gap-4 lg:my-auto",
            // Short laptop screens: shrink the column instead of cutting the card off.
            // (Ranges do not overlap, so the order of the generated rules does not matter.)
            "[@media(min-width:1024px)_and_(min-height:690.1px)_and_(max-height:760px)]:[zoom:0.9]",
            "[@media(min-width:1024px)_and_(min-height:632.1px)_and_(max-height:690px)]:[zoom:0.82]",
            "[@media(min-width:1024px)_and_(min-height:575.1px)_and_(max-height:632px)]:[zoom:0.74]",
            "[@media(min-width:1024px)_and_(max-height:575px)]:[zoom:0.66]",
          )}
        >
          {children}
          {footer ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** "Need help? Call us" pill shown under every auth card. */
export function AuthHelpPill() {
  return (
    <a
      href="tel:+917218378311"
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#eadfc9] bg-white/95 px-4 text-[13px] text-ink-soft outline-none transition-colors hover:border-brand focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:border-slate-700 dark:bg-slate-900/90"
    >
      <Phone className="size-3.5 shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
      <span>Need help? Call us</span>
      <b className="whitespace-nowrap font-bold text-ink">+91 72183 78311</b>
    </a>
  );
}

/* ── Card ───────────────────────────────────────────────────────────────── */

export function AuthCard({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3.5 rounded-[24px] border border-[#eadfc9] bg-white/[0.97] px-[18px] pb-5 pt-5 shadow-[0_30px_70px_rgba(20,40,20,0.28)] transition-colors",
        "sm:gap-4 sm:rounded-[28px] sm:px-8 sm:pb-[26px] sm:pt-[30px]",
        "dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[0_30px_70px_rgba(0,0,0,0.55)]",
        className,
      )}
      {...props}
    />
  );
}

/** Logo, title and one line of help text at the top of a card. */
export function AuthCardHeader({
  title,
  description,
  mobileHidden = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Keep the header for screen readers only on phones (the artwork above already carries the brand). */
  mobileHidden?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 text-center",
        mobileHidden && "max-lg:sr-only",
      )}
    >
      {/* Phones show the brand in the artwork; short laptop screens drop the logo to save height. */}
      <AuthBrandLogo
        className="hidden size-[60px] lg:flex [@media(min-width:1024px)_and_(max-height:830px)]:hidden!"
        imgClassName="size-full"
      />
      <h2
        className={cn(
          "m-0 text-[24px] font-extrabold leading-tight tracking-[-0.6px] sm:text-[28px]",
          authTitleColor,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="m-0 max-w-[330px] text-sm leading-normal text-ink-soft">{description}</p>
      ) : null}
    </div>
  );
}

/* ── Notes ──────────────────────────────────────────────────────────────── */

/**
 * Status line inside a card, built on the shared `Note`.
 * Rose notes are announced at once (`role="alert"`), the others politely (`role="status"`).
 */
export function AuthNote({
  tone,
  icon,
  children,
  id,
}: {
  tone: "rose" | "green" | "blue";
  icon?: ComponentProps<typeof Note>["icon"];
  children: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} role={tone === "rose" ? "alert" : "status"}>
      <Note
        tone={tone}
        icon={icon ?? (tone === "rose" ? CircleAlert : tone === "green" ? Check : undefined)}
        className={cn(
          "items-start gap-2 rounded-xl border-solid px-3 py-2.5 text-[13px] font-semibold [&_svg]:mt-px [&_svg]:size-4",
          tone === "rose" && "font-bold",
        )}
      >
        {children}
      </Note>
    </div>
  );
}

/** Soft olive hint row ("We'll send a 6-digit login code on WhatsApp"). */
export function AuthHint({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-[#f3f3df] px-3 py-2.5 text-[13px] font-semibold leading-snug text-[#075735] dark:bg-emerald-950/50 dark:text-emerald-300">
      {icon}
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 shrink-0 fill-current", className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

/** Green WhatsApp dot used next to "code sent on WhatsApp" lines. */
export function WhatsAppBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#12b949] text-white",
        className,
      )}
    >
      <WhatsAppIcon className="size-3" />
    </span>
  );
}

/** "Code sent on WhatsApp to +91 … · Change" line above the code boxes. */
export function AuthSentTo({
  channel,
  identifier,
  action,
}: {
  channel: "whatsapp" | "email";
  identifier: string;
  /** "Change" link or button. */
  action?: ReactNode;
}) {
  return (
    <p className="m-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-ink-soft">
      {channel === "whatsapp" ? (
        <WhatsAppBadge className="size-5" />
      ) : (
        <Mail className="size-4 shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
      )}
      <span>{channel === "whatsapp" ? "Code sent on WhatsApp to" : "Code sent by email to"}</span>
      <b className="break-all font-bold text-ink">{identifier}</b>
      {action}
    </p>
  );
}

/* ── Signed in ──────────────────────────────────────────────────────────── */

/** Success card shown while the app takes the person to their portal. */
export function AuthSuccessPanel({
  title = "Signed in!",
  message,
}: {
  title?: ReactNode;
  message: ReactNode;
}) {
  return (
    <AuthCard role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 pb-1.5 pt-[18px] text-center">
        <span className="relative flex size-[72px] items-center justify-center rounded-full bg-[#dcfce7] dark:bg-emerald-900/50">
          <Check
            className="size-9 text-[#075735] dark:text-emerald-300"
            strokeWidth={2.6}
            aria-hidden="true"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-brand/30 border-t-brand animate-spin"
          />
        </span>
        <h2
          className={cn(
            "m-0 text-[26px] font-extrabold leading-tight tracking-[-0.5px]",
            authTitleColor,
          )}
        >
          {title}
        </h2>
        <p className="m-0 text-sm text-ink-soft">{message}</p>
        <p className="m-0 flex items-center gap-2 text-xs font-semibold text-ink-muted">
          <Loader2
            className="size-3.5 animate-spin text-brand"
            aria-hidden="true"
          />
          Loading your portal…
        </p>
      </div>
      <div
        aria-hidden="true"
        className="h-1.5 overflow-hidden rounded-full bg-[#e8efe6] dark:bg-slate-800"
      >
        <div className="h-full w-2/3 rounded-full bg-brand animate-pulse motion-reduce:animate-none" />
      </div>
    </AuthCard>
  );
}
