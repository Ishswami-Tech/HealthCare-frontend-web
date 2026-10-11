"use client";

import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { HomeLinkButton } from "@/components/home/HomeLinkButton";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { CARD, CONTROL_TRANSITION } from "@/lib/design/tokens";
import { MAIN_CLINIC, MAPPED_CLINICS, mapEmbedSrc } from "./contact-data";

/** Embedded map with a switch between the clinics that have a fixed address. */
export function ContactMap({ className }: { className?: string }) {
  const { t, tArray, language } = useTranslation();
  const [activeId, setActiveId] = useState(MAIN_CLINIC.id);
  const active = MAPPED_CLINICS.find((clinic) => clinic.id === activeId) ?? MAIN_CLINIC;
  const name = t(`contact.clinics.${active.id}.name`);
  const address = active.address?.isList ? tArray(active.address.key).join(", ") : active.address ? t(active.address.key) : "";

  return (
    <div className={cn(CARD, "flex flex-col", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
        <p className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
          <MapPin className="size-4.5 text-primary" aria-hidden="true" />
          {t("contact.map.title")}
        </p>

        <div className="inline-flex rounded-full border border-border/70 bg-muted/60 p-1">
          {MAPPED_CLINICS.map((clinic) => {
            const isActive = clinic.id === active.id;
            return (
              <button
                key={clinic.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveId(clinic.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-heading text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  CONTROL_TRANSITION,
                  isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(`contact.clinics.${clinic.id}.name`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative min-h-72 flex-1 border-y border-border/60 bg-muted">
        <iframe
          key={`${active.id}-${language}`}
          title={`${t("contact.map.title")}: ${name}`}
          src={mapEmbedSrc(active.coordinates, language)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full border-0 dark:[filter:invert(0.9)_hue-rotate(180deg)_saturate(0.7)]"
        />
      </div>

      <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
        <div>
          <p className="font-heading text-sm font-semibold text-foreground">{name}</p>
          {address ? <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{address}</p> : null}
        </div>
        <HomeLinkButton href={active.mapsHref} variant="outline" size="md" trailingIcon={ExternalLink} className="w-full sm:w-auto sm:self-start">
          {t("contact.map.open")}
        </HomeLinkButton>
      </div>
    </div>
  );
}
