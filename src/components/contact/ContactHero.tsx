"use client";

import { Clock, Mail, MapPin, MessageCircle, Phone, Star, Stethoscope, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BookVideoCta } from "@/components/home/BookVideoCta";
import { HomeLinkButton } from "@/components/home/HomeLinkButton";
import { PageHero } from "@/components/home/PageHero";
import { toTelHref } from "@/components/home/home-links";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { CARD, META_LABEL } from "@/lib/design/tokens";
import { CLINIC_CONTACT, MAIN_CLINIC } from "./contact-data";

function LineRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 px-5 py-4 sm:px-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className={META_LABEL}>{label}</dt>
        <dd className="mt-1 text-[15px] leading-relaxed text-foreground">{children}</dd>
      </div>
    </div>
  );
}

const LINK = "font-semibold underline-offset-4 transition-colors hover:text-primary hover:underline";

/** The clinic's direct lines, set like a card you could pin to a noticeboard. */
function DirectLineCard() {
  const { t, tArray } = useTranslation();
  const address = tArray("contact.contactInfo.location.details");

  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute -inset-3 -z-10 rotate-2 rounded-[2rem] bg-primary/8 dark:bg-primary/10" />
      <dl className={cn(CARD, "divide-y divide-border/60 shadow-[0_40px_80px_-48px_rgba(10,70,52,0.55)]")}>
        <div className="flex items-center justify-between gap-3 bg-primary/[0.06] px-5 py-4 sm:px-6">
          <p className="font-heading text-sm font-semibold text-foreground">{t("contact.getInTouch")}</p>
          <span className="relative flex size-2.5" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
        </div>

        <LineRow icon={Phone} label={t("contact.contactInfo.phoneNumbers.title")}>
          <span className="flex flex-col">
            {CLINIC_CONTACT.phones.map((phone) => (
              <a key={phone} href={toTelHref(phone)} className={cn(LINK, "tabular-nums")}>
                {phone}
              </a>
            ))}
          </span>
        </LineRow>

        <LineRow icon={Mail} label={t("contact.contactInfo.emailAddresses.title")}>
          <a href={`mailto:${CLINIC_CONTACT.email}`} className={cn(LINK, "break-all")}>
            {CLINIC_CONTACT.email}
          </a>
        </LineRow>

        <LineRow icon={MapPin} label={t("contact.contactInfo.location.title")}>
          <span className="text-muted-foreground">{address.join(", ")}</span>
          <a
            href={MAIN_CLINIC.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(LINK, "mt-1 block text-sm text-primary")}
          >
            {t("contact.map.open")}
          </a>
        </LineRow>

        <LineRow icon={Clock} label={t("clinic.timings")}>
          <span className="flex flex-col gap-0.5 text-sm">
            {MAIN_CLINIC.sessions.map(({ labelKey, hoursKey }) => (
              <span key={labelKey}>
                <span className="text-muted-foreground">{t(labelKey)}:</span>{" "}
                <span className="font-semibold tabular-nums">{t(hoursKey)}</span>
              </span>
            ))}
          </span>
        </LineRow>
      </dl>
    </div>
  );
}

export function ContactHero({ whatsappHref }: { whatsappHref: string }) {
  const { t } = useTranslation();

  return (
    <PageHero
      headingId="contact-hero-heading"
      eyebrow={t("contact.badge")}
      eyebrowIcon={MessageCircle}
      title={t("contact.title")}
      subtitle={t("contact.subtitle")}
      actions={
        <>
          <BookVideoCta className="w-full sm:w-auto" />
          <HomeLinkButton
            href={whatsappHref}
            variant="outline"
            size="lg"
            icon={MessageCircle}
            className="w-full sm:w-auto"
          >
            {t("contact.quickActions.whatsappSupport.title")}
          </HomeLinkButton>
        </>
      }
      chips={[
        { icon: Clock, label: t("contact.badges.support24x7") },
        { icon: Star, label: t("contact.badges.patientRating") },
        { icon: Stethoscope, label: t("contact.badges.expertConsultation") },
      ]}
      aside={<DirectLineCard />}
    />
  );
}
