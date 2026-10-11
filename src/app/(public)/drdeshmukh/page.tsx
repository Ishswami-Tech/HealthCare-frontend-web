"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, MapPin, PlayCircle, ShoppingBag, type LucideIcon } from "lucide-react";
import { DoctorFeaturedCard, DoctorLinkCard, DoctorVideoCard } from "@/components/doctor-profile/DoctorLinkCard";
import { DoctorProfileHero } from "@/components/doctor-profile/DoctorProfileHero";
import { DoctorShareDialog } from "@/components/doctor-profile/DoctorShareDialog";
import {
  DOCTOR,
  buildDoctorServices,
  getShareText,
  resolveHref,
  type ServiceGroup,
  type ServiceItem,
} from "@/components/doctor-profile/doctor-profile-data";
import { useLinkPreviews } from "@/components/doctor-profile/useLinkPreviews";
import { CONTAINER, HOME_TINTS, ICON_PLATE } from "@/components/home/home-theme";
import { HomeMotionProvider, Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import type { AccentName } from "@/lib/design/tokens";

const COPIED_FEEDBACK_MS = 1500;
const PAGE_SHARE_TARGET = "page";

const GROUP_ICONS: Record<ServiceGroup, { icon: LucideIcon; accent: AccentName }> = {
  consult: { icon: CalendarDays, accent: "sky" },
  clinics: { icon: MapPin, accent: "teal" },
  shop: { icon: ShoppingBag, accent: "amber" },
  watch: { icon: PlayCircle, accent: "rose" },
};

function GroupHeading({ group, title }: { group: ServiceGroup; title: string }) {
  const { icon: Icon, accent } = GROUP_ICONS[group];

  return (
    <div className="flex items-center gap-3">
      <span className={cn(ICON_PLATE, "size-10 rounded-xl", HOME_TINTS[accent].plate)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
      <span aria-hidden="true" className="h-px flex-1 bg-border/70" />
    </div>
  );
}

function LinkGroup({ group, title, className, children }: { group: ServiceGroup; title: string; className?: string; children: ReactNode }) {
  return (
    <section aria-label={title} className={className}>
      <Reveal>
        <GroupHeading group={group} title={title} />
      </Reveal>
      {children}
    </section>
  );
}

export default function DrDeshmukhPage() {
  const { t } = useTranslation();
  const doctorName = t("team.teamMembers.drDeshmukh.name");

  const services = useMemo(() => buildDoctorServices(t), [t]);
  const previews = useLinkPreviews(services);

  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

  const activeService = services.find((service) => service.id === activeServiceId) ?? null;
  const featuredService = services.find((service) => service.featured);
  const servicesIn = (group: ServiceGroup) => services.filter((service) => service.group === group && !service.featured);

  const handleCopy = async (text: string, target: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTarget(target);
    window.setTimeout(() => setCopiedTarget(null), COPIED_FEEDBACK_MS);
  };

  const handleShareLink = async (service: ServiceItem) => {
    const url = resolveHref(service.href);

    if (navigator.share) {
      try {
        await navigator.share({ title: service.title, text: getShareText(service, doctorName), url });
        return;
      } catch {
        // Fall back to copying the link below.
      }
    }

    await handleCopy(url, `share:${service.id}`);
  };

  const handleSharePage = async () => {
    const shareUrl = window.location.href;
    const shareText = `${doctorName} - ${t("drDeshmukhPage.footerTagline")}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: doctorName, text: shareText, url: shareUrl });
        return;
      } catch {
        // Fall back to copying the link below.
      }
    }

    await handleCopy(shareUrl, PAGE_SHARE_TARGET);
  };

  const moreLabel = (service: ServiceItem) => `${t("drDeshmukhPage.moreActionsAriaPrefix")} ${service.title}`;

  const cardProps = (service: ServiceItem) => ({
    service,
    preview: previews[service.id],
    moreLabel: moreLabel(service),
    onMore: () => setActiveServiceId(service.id),
  });

  const rowCards = (group: ServiceGroup, gridClassName: string, isLarge = false) => (
    <RevealGroup className={cn("mt-5 grid gap-4", gridClassName)}>
      {servicesIn(group).map((service) => (
        <RevealItem key={service.id} className="h-full">
          <DoctorLinkCard {...cardProps(service)} isLarge={isLarge} />
        </RevealItem>
      ))}
    </RevealGroup>
  );

  return (
    <HomeMotionProvider>
      <div className="relative isolate overflow-x-clip bg-background font-body">
        <DoctorProfileHero
          doctorName={doctorName}
          isPageCopied={copiedTarget === PAGE_SHARE_TARGET}
          onSharePage={handleSharePage}
        />

        <div className={cn(CONTAINER, "pb-14 pt-10 lg:pb-20 lg:pt-14")}>
          {featuredService ? (
            <Reveal>
              <DoctorFeaturedCard {...cardProps(featuredService)} />
            </Reveal>
          ) : null}

          <Reveal className="mt-5">
            <p className="text-center text-sm text-muted-foreground">{t("drDeshmukhPage.linksHint")}</p>
          </Reveal>

          <LinkGroup group="consult" title={t("drDeshmukhPage.groups.consult")} className="mt-10 lg:mt-12">
            {rowCards("consult", "sm:grid-cols-2 lg:grid-cols-3")}
          </LinkGroup>

          <div className="mt-12 grid gap-12 lg:grid-cols-3 lg:gap-8">
            <LinkGroup group="clinics" title={t("drDeshmukhPage.groups.clinics")} className="lg:col-span-2">
              {rowCards("clinics", "sm:grid-cols-2")}
            </LinkGroup>
            <LinkGroup group="shop" title={t("drDeshmukhPage.groups.shop")}>
              {rowCards("shop", "", true)}
            </LinkGroup>
          </div>

          <LinkGroup group="watch" title={t("drDeshmukhPage.groups.watch")} className="mt-12">
            <RevealGroup className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {servicesIn("watch").map((service) => (
                <RevealItem key={service.id} className="h-full">
                  <DoctorVideoCard {...cardProps(service)} />
                </RevealItem>
              ))}
            </RevealGroup>
          </LinkGroup>

          <Reveal className="mt-14">
            <p className="flex flex-col items-center gap-1.5 text-center text-sm text-muted-foreground">
              <span>{t("drDeshmukhPage.footerTagline")}</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                {DOCTOR.location}
              </span>
            </p>
          </Reveal>
        </div>

        <DoctorShareDialog
          service={activeService}
          preview={activeService ? previews[activeService.id] : undefined}
          doctorName={doctorName}
          copiedTarget={copiedTarget}
          onCopy={handleCopy}
          onShareLink={handleShareLink}
          onClose={() => setActiveServiceId(null)}
        />
      </div>
    </HomeMotionProvider>
  );
}
