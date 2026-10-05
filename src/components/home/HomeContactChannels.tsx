"use client";

import {
  ArrowRight,
  CalendarDays,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  PhoneCall,
  Siren,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { BookVideoCta } from "./BookVideoCta";
import { HomeLinkButton } from "./HomeLinkButton";
import { SectionHeading } from "./SectionHeading";
import { stripLeadingValue } from "./home-format";
import { HOME_LINKS, toTelHref, toWhatsAppHref } from "./home-links";
import { Reveal, RevealGroup, RevealItem } from "./home-motion";
import {
  CARD,
  CARD_INTERACTIVE,
  CONTAINER,
  HEADING_GAP,
  HOME_TINTS,
  SECTION_Y,
  SURFACE_RAISED,
  type HomeTint,
} from "./home-theme";
import { HOVER_TRANSITION_CHILD } from "@/lib/design/tokens";

type Channel = {
  key: string;
  icon: LucideIcon;
  tint: HomeTint;
  title: string;
  detail: string;
  description: string;
  href: string;
  buttonLabel: string;
  isVideo?: boolean;
};

type ResponseTime = { key: string; icon: LucideIcon; value: string; tint: HomeTint };

const RESPONSE_TIMES: ResponseTime[] = [
  { key: "phone", icon: Clock, value: "2 Rings", tint: "emerald" },
  { key: "chat", icon: MessageCircle, value: "30 Seconds", tint: "emerald" },
  { key: "email", icon: Mail, value: "4 Hours", tint: "emerald" },
  { key: "callback", icon: PhoneCall, value: "10 Minutes", tint: "rose" },
  { key: "confirmation", icon: CalendarDays, value: "30 Minutes", tint: "emerald" },
];

export default function HomeContactChannels() {
  const { t } = useTranslation();
  const base = "comprehensiveCTA.contactChannels";

  const whatsappNumber = t(`${base}.channels.whatsapp.number`);
  const helplineNumber = t(`${base}.channels.helpline.number`);
  const emergencyNumber = t(`${base}.channels.emergency.number`);

  const channels: Channel[] = [
    {
      key: "whatsapp",
      icon: MessageCircle,
      tint: "emerald",
      title: t(`${base}.channels.whatsapp.title`),
      detail: whatsappNumber,
      description: t(`${base}.channels.whatsapp.description`),
      href: toWhatsAppHref(whatsappNumber),
      buttonLabel: t(`${base}.channels.whatsapp.button`),
    },
    {
      key: "helpline",
      icon: Phone,
      tint: "sky",
      title: t(`${base}.channels.helpline.title`),
      detail: helplineNumber,
      description: t(`${base}.channels.helpline.description`),
      href: toTelHref(helplineNumber),
      buttonLabel: t(`${base}.channels.helpline.button`),
    },
    {
      key: "emergency",
      icon: Siren,
      tint: "rose",
      title: t(`${base}.channels.emergency.title`),
      detail: emergencyNumber,
      description: t(`${base}.channels.emergency.description`),
      href: toTelHref(emergencyNumber),
      buttonLabel: t(`${base}.channels.emergency.button`),
    },
    {
      key: "video",
      icon: Video,
      tint: "violet",
      title: t(`${base}.channels.video.title`),
      detail: t(`${base}.channels.video.action`),
      description: t(`${base}.channels.video.description`),
      href: HOME_LINKS.videoBooking,
      buttonLabel: t(`${base}.channels.video.action`),
      isVideo: true,
    },
  ];

  const responseTimes = RESPONSE_TIMES.map((item) => ({
    ...item,
    label: stripLeadingValue(t(`${base}.responseTimes.${item.key}`), item.value),
  }));

  return (
    <section className={cn(SURFACE_RAISED, SECTION_Y)}>
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeading
            align="split"
            index="12"
            eyebrow={t(`${base}.title`)}
            icon={Phone}
            title={t(`${base}.subtitle`)}
            description={t(`${base}.description`)}
          />
        </Reveal>

        <RevealGroup className={cn(HEADING_GAP, "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4")}>
          {channels.map((channel) => {
            const tint = HOME_TINTS[channel.tint];
            const Icon = channel.icon;

            return (
              <RevealItem key={channel.key} className="h-full">
                <article
                  className={cn(
                    CARD,
                    CARD_INTERACTIVE,
                    "group flex h-full flex-col bg-background p-5 sm:p-6",
                    /* The video channel is the conversion channel — give it the ring. */
                    channel.isVideo && "border-primary/35 bg-primary/4 ring-1 ring-primary/15"
                  )}
                >
                  {channel.isVideo ? (
                    <span aria-hidden="true" className="absolute right-5 top-5 flex size-2.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                    </span>
                  ) : null}

                  <span
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white group-hover:scale-105",
                      HOVER_TRANSITION_CHILD,
                      tint.gradient,
                      tint.glow
                    )}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </span>

                  <h3 className="home-display mt-4 font-heading text-base font-semibold text-foreground">
                    {channel.title}
                  </h3>
                  <p className={cn("mt-1 font-heading text-[13px] font-semibold", tint.text)}>{channel.detail}</p>
                  <p className="mt-3 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                    {channel.description}
                  </p>

                  <div className="mt-5">
                    {channel.isVideo ? (
                      /* Uses the channel's own short action label so it fits the narrow card. */
                      <BookVideoCta size="md" showArrow={false} label={channel.buttonLabel} className="w-full" />
                    ) : (
                      <HomeLinkButton
                        href={channel.href}
                        variant="outline"
                        size="md"
                        trailingIcon={ArrowRight}
                        className="w-full"
                      >
                        {channel.buttonLabel}
                      </HomeLinkButton>
                    )}
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {/* Response-time board */}
        <RevealGroup className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border border-border/70 bg-border/70 sm:grid-cols-3 lg:grid-cols-5">
          {responseTimes.map((item) => {
            const tint = HOME_TINTS[item.tint];
            const Icon = item.icon;
            return (
              <RevealItem key={item.key} className="h-full">
                <div className="flex h-full flex-col items-center gap-2 bg-background px-4 py-5 text-center">
                  <Icon className={cn("size-5", tint.text)} aria-hidden="true" />
                  <p className={cn("home-display font-heading text-base font-semibold", tint.text)}>{item.value}</p>
                  <p className="text-[11px] leading-snug text-muted-foreground">{item.label}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
