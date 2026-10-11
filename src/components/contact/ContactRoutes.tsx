"use client";

import { ArrowRight, CalendarCheck, Mail, MessageCircle, PhoneCall, Zap, type LucideIcon } from "lucide-react";
import { HomeLinkButton } from "@/components/home/HomeLinkButton";
import { SectionHeading } from "@/components/home/SectionHeading";
import { HOME_LINKS, toTelHref } from "@/components/home/home-links";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import {
  ACCENTS,
  CARD,
  CARD_INTERACTIVE,
  CONTAINER,
  HEADING_GAP,
  ICON_PLATE_SOLID,
  SECTION_Y,
  SURFACE,
  type AccentName,
} from "@/lib/design/tokens";
import { CLINIC_CONTACT } from "./contact-data";

interface Route {
  key: "bookConsultation" | "whatsappSupport" | "emergencyCare" | "email";
  icon: LucideIcon;
  tint: AccentName;
  href: string;
  /** The number or address the route lands on, when there is one to show. */
  detail?: string;
}

/** Four ways in, ordered by how most patients reach the clinic. */
export function ContactRoutes({ whatsappHref }: { whatsappHref: string }) {
  const { t } = useTranslation();
  const [firstPhone] = CLINIC_CONTACT.phones;

  const routes: Route[] = [
    { key: "bookConsultation", icon: CalendarCheck, tint: "emerald", href: HOME_LINKS.booking },
    { key: "whatsappSupport", icon: MessageCircle, tint: "teal", href: whatsappHref, detail: CLINIC_CONTACT.whatsapp },
    { key: "emergencyCare", icon: PhoneCall, tint: "rose", href: toTelHref(firstPhone), detail: firstPhone },
    { key: "email", icon: Mail, tint: "sky", href: `mailto:${CLINIC_CONTACT.email}`, detail: CLINIC_CONTACT.email },
  ];

  return (
    <section className={cn(SURFACE.raised, SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            align="left"
            index="01"
            eyebrow={t("contact.quickActions.title")}
            icon={Zap}
            title={t("contact.quickActions.subtitle")}
          />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4")}>
          {routes.map(({ key, icon: Icon, tint, href, detail }, index) => {
            const tone = ACCENTS[tint];
            const base = `contact.quickActions.${key}`;

            return (
              <RevealItem key={key} className="h-full">
                <article className={cn(CARD, CARD_INTERACTIVE, "group flex h-full flex-col bg-background p-5 sm:p-6")}>
                  <span aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 top-0 h-32 [mask-image:linear-gradient(to_bottom,black,transparent)]", tone.soft)} />

                  <div className="relative flex items-start justify-between gap-3">
                    <span className={cn(ICON_PLATE_SOLID, tone.gradient, tone.glow)}>
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <span className={cn("home-display font-heading text-lg font-semibold tabular-nums opacity-50", tone.text)}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="home-display relative mt-5 font-heading text-lg font-semibold text-foreground">
                    {t(`${base}.title`)}
                  </h3>
                  {detail ? (
                    <p className={cn("relative mt-1 break-all font-heading text-[13px] font-semibold tabular-nums", tone.text)}>
                      {detail}
                    </p>
                  ) : null}
                  <p className="relative mt-3 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                    {t(`${base}.description`)}
                  </p>

                  <HomeLinkButton
                    href={href}
                    variant={key === "bookConsultation" ? "solid" : "outline"}
                    size="md"
                    trailingIcon={ArrowRight}
                    className="relative mt-5 w-full"
                  >
                    {t(`${base}.action`)}
                  </HomeLinkButton>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
