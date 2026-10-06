"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Mail,
  Phone,
  Shield,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { BookVideoCta } from "./BookVideoCta";
import { HomeLinkButton } from "./HomeLinkButton";
import { SectionHeading } from "./SectionHeading";
import { HOME_LINKS, firstPhone, toTelHref } from "./home-links";
import { Reveal, RevealGroup, RevealItem } from "./home-motion";
import { CARD, CONTAINER, SECTION_Y, SURFACE_INK } from "./home-theme";
import { HOVER_TRANSITION_CHILD } from "@/lib/design/tokens";

type Guarantee = { icon: LucideIcon; label: string };

function NewsletterSection() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");

  return (
    <section className="py-12 sm:py-14">
      <div className={CONTAINER}>
        <Reveal>
          <div className={cn(CARD, "home-topline mx-auto max-w-3xl p-6 text-center sm:p-9")}>
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
              <Mail className="size-6" aria-hidden="true" />
            </span>
            <h3 className="home-display mt-5 font-heading text-[clamp(1.4rem,1.1rem+1.2vw,2rem)] font-semibold text-foreground">
              {t("comprehensiveCTA.newsletter.title")}
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              {t("comprehensiveCTA.newsletter.description")}
            </p>

            <form
              onSubmit={(event) => event.preventDefault()}
              className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row"
            >
              <Input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("comprehensiveCTA.newsletter.placeholder")}
                aria-label={t("comprehensiveCTA.newsletter.placeholder")}
                className="h-12 flex-1 rounded-full bg-background px-5"
              />
              <Button
                type="submit"
                className="h-12 rounded-full px-6 font-heading shadow-[0_10px_28px_-10px_oklch(0.62_0.16_150_/_0.7)]"
              >
                {t("comprehensiveCTA.newsletter.button")}
              </Button>
            </form>

            <p className="mt-4 text-[11px] text-muted-foreground">
              {t("comprehensiveCTA.newsletter.privacy")}{" "}
              <Link
                href={HOME_LINKS.privacyPolicy}
                prefetch={false}
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                {t("footer.privacyPolicy")}
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function HomeFinalCta() {
  const { t, tArray } = useTranslation();
  const telHref = toTelHref(firstPhone(t("clinic.phone")));
  const lifeBenefits = tArray("comprehensiveCTA.transformLife.benefits");

  const guarantees: Guarantee[] = [
    { icon: Shield, label: t("comprehensiveCTA.benefits.satisfaction") },
    { icon: Award, label: t("comprehensiveCTA.benefits.expertCare") },
    { icon: CheckCircle2, label: t("comprehensiveCTA.benefits.safety") },
    { icon: Users, label: t("comprehensiveCTA.benefits.partnership") },
    { icon: Star, label: t("comprehensiveCTA.benefits.results") },
  ];

  return (
    <>
      <section className={cn(SURFACE_INK, SECTION_Y, "home-grain")}>
        <div aria-hidden="true" className="home-aurora absolute inset-0 -z-10 opacity-60" />
        <div
          aria-hidden="true"
          className="home-dotgrid absolute inset-0 -z-10 text-white [mask-image:radial-gradient(ellipse_70%_60%_at_50%_100%,black,transparent)]"
        />

        <div className={cn(CONTAINER, "relative max-w-5xl")}>
          <Reveal>
            <SectionHeading
              align="center"
              tone="inverse"
              index="13"
              eyebrow={t("comprehensiveCTA.startJourney.title")}
              icon={Sparkles}
              title={t("comprehensiveCTA.guarantees.title")}
              description={t("comprehensiveCTA.guarantees.subtitle")}
            />
          </Reveal>

          <Reveal delay={0.08} className="mt-9">
            <div className="rounded-[2rem] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xl sm:p-7">
              <h3 className="home-display text-center font-heading text-xl font-semibold sm:text-2xl">
                {t("comprehensiveCTA.transformLife.title")}
              </h3>
              <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {lifeBenefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[13px] font-medium"
                  >
                    <CheckCircle2 className="size-4.5 shrink-0 text-emerald-300" aria-hidden="true" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <RevealGroup className="mt-9 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {guarantees.map(({ icon: Icon, label }) => (
              <RevealItem key={label}>
                <div className="group flex h-full flex-col items-center gap-2.5 text-center">
                  <span className={cn("flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] transition-colors group-hover:bg-white/15", HOVER_TRANSITION_CHILD)}>
                    <Icon className="size-5.5" aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-medium leading-snug text-white/80">{label}</span>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-10 text-center">
            <p className="text-base text-white/80 sm:text-lg">{t("comprehensiveCTA.guarantees.description")}</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <BookVideoCta variant="inverse" />
              <HomeLinkButton href={telHref} variant="inverseOutline" size="lg" icon={Phone}>
                {t("common.callNow")}
              </HomeLinkButton>
            </div>
            <p className="mt-6 text-[13px] text-white/60">{t("comprehensiveCTA.joinThousands.title")}</p>
          </Reveal>
        </div>
      </section>

      <NewsletterSection />
    </>
  );
}
