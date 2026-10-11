"use client";

import { ArrowUpRight, Clock, MapPin, PhoneCall, Siren } from "lucide-react";
import { HomeLinkButton } from "@/components/home/HomeLinkButton";
import { SectionHeading } from "@/components/home/SectionHeading";
import { toTelHref } from "@/components/home/home-links";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { BOARD, CONTAINER, HEADING_GAP, META_LABEL, SECTION_Y, STATUS, SURFACE } from "@/lib/design/tokens";
import { CLINIC_CONTACT, CLINIC_LOCATIONS, type ClinicLocation } from "./contact-data";

function LocationCell({ clinic }: { clinic: ClinicLocation }) {
  const { t, tArray } = useTranslation();
  const address = clinic.address?.isList
    ? tArray(clinic.address.key).join(", ")
    : clinic.address
      ? t(clinic.address.key)
      : null;

  return (
    <div className="group flex h-full flex-col bg-card p-6 transition-colors hover:bg-primary/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
          <MapPin className="size-5" aria-hidden="true" />
        </span>
        {clinic.isMain ? (
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            {t("contact.clinics.mainBadge")}
          </span>
        ) : null}
      </div>

      <h3 className="home-display mt-5 font-heading text-xl font-semibold text-foreground">
        {t(`contact.clinics.${clinic.id}.name`)}
      </h3>
      {address ? <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{address}</p> : null}

      <ul className="mt-5 flex flex-1 flex-col gap-2.5 border-t border-border/60 pt-5">
        {clinic.sessions.map(({ icon: Icon, labelKey, hoursKey }) => (
          <li key={labelKey} className="flex items-start gap-3">
            <Icon className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className={META_LABEL}>{t(labelKey)}</p>
              <p className="mt-0.5 font-heading text-[15px] font-semibold tabular-nums text-foreground">{t(hoursKey)}</p>
            </div>
          </li>
        ))}
      </ul>

      {clinic.mapsHref ? (
        <a
          href={clinic.mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 self-start font-heading text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("contact.clinics.directions")}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

/** Where and when the doctor sees patients, then the out-of-hours line. */
export function ContactLocations() {
  const { t } = useTranslation();
  const [emergencyPhone] = CLINIC_CONTACT.phones;
  const danger = STATUS.danger;

  return (
    <section className={cn(SURFACE.parchment, SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            align="split"
            index="03"
            eyebrow={t("clinic.timings")}
            icon={Clock}
            title={t("contact.visitClinic.title")}
            description={t("contact.visitClinic.description")}
          />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, BOARD, "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
          {CLINIC_LOCATIONS.map((clinic) => (
            <RevealItem key={clinic.id} className="h-full">
              <LocationCell clinic={clinic} />
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-6">
          <aside
            aria-labelledby="contact-emergency-heading"
            className="flex flex-col gap-5 rounded-[1.75rem] border border-rose-200/70 bg-rose-50/80 p-6 dark:border-rose-900/50 dark:bg-rose-950/30 sm:flex-row sm:items-center sm:gap-6 sm:p-7"
          >
            <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25">
              <span aria-hidden="true" className="absolute -right-1 -top-1 flex size-3">
                <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-70", danger.dot)} />
                <span className={cn("relative inline-flex size-3 rounded-full ring-2 ring-rose-50 dark:ring-rose-950", danger.dot)} />
              </span>
              <Siren className="size-6" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 id="contact-emergency-heading" className="home-display font-heading text-lg font-semibold text-foreground sm:text-xl">
                {t("contact.emergency.title")}
              </h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{t("contact.emergency.description")}</p>
              <a
                href={toTelHref(emergencyPhone)}
                className={cn("mt-2 inline-flex items-center gap-2 font-heading text-base font-semibold tabular-nums underline-offset-4 hover:underline", danger.text)}
              >
                <PhoneCall className="size-4" aria-hidden="true" />
                {emergencyPhone}
              </a>
            </div>

            <HomeLinkButton
              href={toTelHref(emergencyPhone)}
              size="lg"
              icon={PhoneCall}
              className="w-full bg-rose-600 shadow-[0_10px_28px_-10px_rgba(225,29,72,0.6)] hover:bg-rose-700 sm:w-auto sm:shrink-0"
            >
              {t("contact.emergency.action")}
            </HomeLinkButton>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
