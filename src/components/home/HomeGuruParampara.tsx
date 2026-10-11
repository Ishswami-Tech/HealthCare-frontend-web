"use client";

import Image from "next/image";
import { m } from "motion/react";
import { ArrowRight, Award, BookOpen, Flame, GraduationCap, Landmark, type LucideIcon } from "lucide-react";
import { DOCTOR } from "@/components/doctor-profile/doctor-profile-data";
import { cn } from "@/lib/utils";
import { ACCENTS, ICON_PLATE_SOLID, SURFACE, type AccentName } from "@/lib/design/tokens";
import { SmartLink } from "./HomeLinkButton";
import { REVEAL_ITEM_VARIANTS, Reveal, RevealGroup } from "./home-motion";
import { CONTAINER, SECTION_Y } from "./home-theme";
import { useTranslation } from "@/lib/i18n/context";

const HEADING_ID = "guru-parampara-heading";

/** Both photographs are courtesy of the Gogate family's foundation, credited in the section. */
const FOUNDATION_URL = "https://www.vaidyagogate.org";
const GURU_PORTRAIT = { src: "/assets/doctor/vaidya-gogate-portrait.webp", width: 512, height: 758 } as const;
const GURU_AT_WORK = { src: "/assets/doctor/vaidya-gogate-viddhakarma.webp", width: 1115, height: 720 } as const;

type Highlight = { key: string; Icon: LucideIcon; accent: AccentName };

const HIGHLIGHTS: readonly Highlight[] = [
  { key: "education", Icon: GraduationCap, accent: "violet" },
  { key: "principal", Icon: Landmark, accent: "sky" },
  { key: "book", Icon: BookOpen, accent: "amber" },
  { key: "awards", Icon: Award, accent: "rose" },
];

function GuruPhotos({ name, lifespan, caption }: { name: string; lifespan: string; caption: string }) {
  return (
    // Bottom margin leaves room for the treatment photo that hangs below the portrait.
    <div className="relative mx-auto mb-16 w-full max-w-md sm:mb-20 lg:mb-14 lg:max-w-none">
      <figure className="relative w-[78%] rounded-[1.75rem] border border-border/70 bg-card p-2 shadow-[0_28px_56px_-30px_rgba(10,70,52,0.45)]">
        <div className="relative aspect-[512/758] overflow-hidden rounded-[1.35rem] bg-[#e4e2e1]">
          <Image
            src={GURU_PORTRAIT.src}
            alt={name}
            fill
            sizes="(min-width: 1024px) 22rem, 70vw"
            className="object-cover"
          />
        </div>
        <span className="absolute left-5 top-5 rounded-full bg-black/55 px-3 py-1 font-heading text-xs font-semibold text-white backdrop-blur-sm">
          {lifespan}
        </span>
      </figure>

      <figure className="absolute -bottom-14 right-0 w-[60%] rotate-2 rounded-2xl border border-border/70 bg-card p-1.5 shadow-[0_24px_48px_-24px_rgba(10,40,30,0.5)] sm:-bottom-20 lg:-bottom-14">
        <div className="relative aspect-[1115/720] overflow-hidden rounded-xl">
          <Image src={GURU_AT_WORK.src} alt={caption} fill sizes="(min-width: 1024px) 18rem, 55vw" className="object-cover" />
        </div>
        <figcaption className="px-2 pb-1 pt-2 text-xs leading-snug text-muted-foreground">{caption}</figcaption>
      </figure>
    </div>
  );
}

interface LineagePersonProps {
  src: string;
  label: string;
  name: string;
  isMonochrome?: boolean;
}

function LineagePerson({ src, label, name, isMonochrome = false }: LineagePersonProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/20 sm:size-14">
        <Image src={src} alt="" fill sizes="3.5rem" className={cn("object-cover object-top", isMonochrome && "grayscale")} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-primary">{label}</span>
        <span className="block text-sm font-semibold leading-snug text-foreground">{name}</span>
      </span>
    </div>
  );
}

/**
 * Introduces Dr. Deshmukh's guru, Vaidya R.B. Gogate, directly under the
 * doctor's own introduction, and draws the guru → disciple line between them.
 */
export default function HomeGuruParampara() {
  const { t: translate } = useTranslation();
  const t = (key: string) => translate(`drDeshmukhPage.guru.${key}`);
  const name = t("name");
  const caption = t("photoCaption");

  return (
    <section
      aria-labelledby={HEADING_ID}
      className={cn(SURFACE.parchment, "relative isolate overflow-hidden", SECTION_Y)}
    >
      <div className={CONTAINER}>
        <div className="grid items-center gap-x-12 gap-y-10 lg:grid-cols-12 xl:gap-x-16">
          <Reveal className="lg:col-span-5">
            <GuruPhotos name={name} lifespan={t("lifespan")} caption={caption} />
          </Reveal>

          <Reveal delay={0.08} className="flex flex-col items-start lg:col-span-7">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-primary/[0.07] px-4 py-2 text-sm font-semibold text-foreground/85">
              <Flame className="size-4 text-primary" aria-hidden="true" />
              {t("eyebrow")}
            </span>

            <h2
              id={HEADING_ID}
              className="mt-5 font-heading text-[clamp(2rem,1.3rem+2.4vw,3.25rem)] font-bold leading-[1.2] text-balance text-foreground"
            >
              {name}
            </h2>
            <p className="mt-2 font-heading text-lg font-semibold leading-snug text-primary sm:text-xl">{t("role")}</p>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">{t("bio")}</p>

            <RevealGroup className="mt-6 w-full">
              <ul className="grid gap-3 sm:grid-cols-2">
                {HIGHLIGHTS.map(({ key, Icon, accent }) => (
                  <m.li
                    key={key}
                    variants={REVEAL_ITEM_VARIANTS}
                    className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 p-3"
                  >
                    <span className={cn(ICON_PLATE_SOLID, "size-10 rounded-xl", ACCENTS[accent].gradient)}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold leading-snug text-foreground">{t(`highlights.${key}`)}</span>
                  </m.li>
                ))}
              </ul>
            </RevealGroup>

            {/* Guru → disciple: the lineage the clinic's practice comes from. */}
            <div className="mt-6 w-full rounded-[1.5rem] border border-primary/15 bg-card/80 p-4 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <LineagePerson src={GURU_PORTRAIT.src} label={t("guruLabel")} name={t("shortName")} isMonochrome />
                <span aria-hidden="true" className="relative h-px min-w-8 flex-1 border-t border-dashed border-primary/40">
                  <span className="absolute left-1/2 top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ArrowRight className="size-3.5" />
                  </span>
                </span>
                <LineagePerson
                  src={DOCTOR.photo}
                  label={t("discipleLabel")}
                  name={translate("team.teamMembers.drDeshmukh.name")}
                />
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-foreground/80">{t("legacy")}</p>
            </div>

            <SmartLink
              href={FOUNDATION_URL}
              className="mt-5 text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {t("photoCredit")}
            </SmartLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
