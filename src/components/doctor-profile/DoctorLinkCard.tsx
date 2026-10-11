"use client";

import Image from "next/image";
import { ArrowUpRight, MoreVertical, Play } from "lucide-react";
import { BookVideoCta } from "@/components/home/BookVideoCta";
import { SmartLink } from "@/components/home/HomeLinkButton";
import { CARD, CARD_INTERACTIVE, HOME_TINTS, SURFACE_INK } from "@/components/home/home-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HOVER_TRANSITION_CHILD } from "@/lib/design/tokens";
import { resolvePreview, type LinkPreview, type ServiceItem } from "./doctor-profile-data";

interface LinkCardProps {
  service: ServiceItem;
  preview?: LinkPreview;
  moreLabel: string;
  onMore: () => void;
}

/** Opens the share sheet for a link. Sits above the card's stretched link. */
function MoreButton({ label, onClick, isInverse = false }: { label: string; onClick: () => void; isInverse?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "relative z-10 shrink-0 rounded-full",
        isInverse
          ? "text-white/80 hover:bg-white/15 hover:text-white"
          : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
      )}
      aria-label={label}
      onClick={onClick}
    >
      <MoreVertical className="size-5" aria-hidden="true" />
    </Button>
  );
}

function ActionChip({ service }: { service: ServiceItem }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", HOME_TINTS[service.tint].plate)}>
      {service.badge}
      <ArrowUpRight className="size-3" aria-hidden="true" />
    </span>
  );
}

/** Preview image when one was fetched, otherwise the service icon on its accent gradient. */
function Thumbnail({ service, image, className }: { service: ServiceItem; image?: string; className?: string }) {
  const Icon = service.icon;

  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-border/70", className)}>
      {image ? (
        <Image src={image} alt="" fill sizes="80px" className="object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className={cn("flex size-full items-center justify-center bg-linear-to-br text-white", HOME_TINTS[service.tint].gradient)}
        >
          <Icon className="size-6" />
        </span>
      )}
    </span>
  );
}

/** The primary conversion: video consultation, on the deep emerald band. */
export function DoctorFeaturedCard({ service, moreLabel, onMore }: Omit<LinkCardProps, "preview">) {
  const Icon = service.icon;

  return (
    <article className={cn(SURFACE_INK, "home-grain rounded-[1.75rem] p-6 sm:p-8")}>
      <div aria-hidden="true" className="home-aurora absolute inset-0 -z-10 opacity-60" />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
            {service.badge}
          </span>
          <h2 className="mt-3 font-heading text-2xl font-bold leading-tight sm:text-3xl">{service.title}</h2>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/75">{service.description}</p>
        </div>
        <BookVideoCta variant="inverse" className="w-full sm:w-auto lg:mr-8" />
      </div>
      <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
        <MoreButton label={moreLabel} onClick={onMore} isInverse />
      </div>
    </article>
  );
}

/** A row-style link: app listings, clinics, the help line and the product. */
export function DoctorLinkCard({ service, preview, moreLabel, onMore, isLarge = false }: LinkCardProps & { isLarge?: boolean }) {
  const resolved = resolvePreview(service, preview);

  return (
    <article className={cn(CARD, CARD_INTERACTIVE, "group flex h-full items-center gap-3 p-4")}>
      {/* Stretched link: the whole card opens the destination; the share button sits above it. */}
      <SmartLink
        href={service.href}
        className="flex min-w-0 flex-1 items-center gap-4 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-[1.75rem] focus-visible:after:ring-4 focus-visible:after:ring-primary/30"
      >
        <Thumbnail service={service} image={resolved.image} className={isLarge ? "size-20" : "size-14"} />
        <span className="min-w-0 flex-1">
          <h3 className="font-heading text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base">
            {resolved.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{resolved.description}</p>
          <span className="mt-2.5 block">
            <ActionChip service={service} />
          </span>
        </span>
      </SmartLink>
      <MoreButton label={moreLabel} onClick={onMore} />
    </article>
  );
}

/** A video link with its thumbnail up top. */
export function DoctorVideoCard({ service, preview, moreLabel, onMore }: LinkCardProps) {
  const resolved = resolvePreview(service, preview);
  const Icon = service.icon;

  return (
    <article className={cn(CARD, CARD_INTERACTIVE, "group flex h-full flex-col")}>
      <SmartLink
        href={service.href}
        className="flex flex-1 flex-col after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-[1.75rem] focus-visible:after:ring-4 focus-visible:after:ring-primary/30"
      >
        <span className="relative block aspect-video overflow-hidden bg-muted">
          {resolved.image ? (
            <Image
              src={resolved.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 26rem, (min-width: 640px) 50vw, 100vw"
              className={cn("object-cover group-hover:scale-105", HOVER_TRANSITION_CHILD)}
            />
          ) : (
            <span
              aria-hidden="true"
              className={cn("flex size-full items-center justify-center bg-linear-to-br text-white", HOME_TINTS[service.tint].gradient)}
            >
              <Icon className="size-10 opacity-80" />
            </span>
          )}
          <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#FF0000] shadow-xl group-hover:scale-110",
              HOVER_TRANSITION_CHILD
            )}
          >
            <Play className="ml-0.5 size-6 fill-current" />
          </span>
        </span>
        <span className="flex flex-1 flex-col p-4 pb-2">
          <h3 className="font-heading text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {resolved.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{resolved.description}</p>
        </span>
      </SmartLink>
      <div className="flex items-center justify-between gap-2 px-4 pb-3">
        <ActionChip service={service} />
        <MoreButton label={moreLabel} onClick={onMore} />
      </div>
    </article>
  );
}
