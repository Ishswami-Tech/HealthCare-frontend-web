"use client";

import { useMemo, useState } from "react";
import { Link2, MapPin } from "lucide-react";
import { DoctorLinkCard } from "@/components/doctor-profile/DoctorLinkCard";
import { DoctorProfileHero } from "@/components/doctor-profile/DoctorProfileHero";
import { DoctorShareDialog } from "@/components/doctor-profile/DoctorShareDialog";
import {
  DOCTOR,
  buildDoctorServices,
  getShareText,
  resolveHref,
  type ServiceItem,
} from "@/components/doctor-profile/doctor-profile-data";
import { useLinkPreviews } from "@/components/doctor-profile/useLinkPreviews";
import { Float, HomeMotionProvider, Reveal, RevealGroup, RevealItem } from "@/components/home/home-motion";
import { useTranslation } from "@/lib/i18n/context";

const COPIED_FEEDBACK_MS = 1500;
const PAGE_SHARE_TARGET = "page";

function PageBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-primary/10 via-background to-background" />
      <Float
        distance={16}
        duration={10}
        className="absolute -top-32 left-1/2 h-[26rem] w-[44rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />
      <Float
        distance={12}
        duration={12}
        delay={1.5}
        className="absolute right-[-8%] top-1/4 size-72 rounded-full bg-teal-400/15 blur-3xl"
      />
    </div>
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
  const otherServices = services.filter((service) => !service.featured);

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

  return (
    <HomeMotionProvider>
      <div className="relative isolate overflow-x-clip font-body">
        <PageBackdrop />

        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-14">
          <DoctorProfileHero
            doctorName={doctorName}
            isPageCopied={copiedTarget === PAGE_SHARE_TARGET}
            onSharePage={handleSharePage}
          />

          <section className="mt-8" aria-labelledby="doctor-links-heading">
            <Reveal>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2
                  id="doctor-links-heading"
                  className="inline-flex items-center gap-3 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Link2 className="size-5" aria-hidden="true" />
                  </span>
                  {t("drDeshmukhPage.linksTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("drDeshmukhPage.linksHint")}</p>
              </div>
            </Reveal>

            {featuredService ? (
              <Reveal delay={0.05} className="mt-4">
                <DoctorLinkCard
                  service={featuredService}
                  preview={previews[featuredService.id]}
                  moreLabel={moreLabel(featuredService)}
                  onMore={() => setActiveServiceId(featuredService.id)}
                />
              </Reveal>
            ) : null}

            <RevealGroup className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {otherServices.map((service) => (
                <RevealItem key={service.id} className="h-full">
                  <DoctorLinkCard
                    service={service}
                    preview={previews[service.id]}
                    moreLabel={moreLabel(service)}
                    onMore={() => setActiveServiceId(service.id)}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          </section>

          <Reveal className="mt-8">
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
