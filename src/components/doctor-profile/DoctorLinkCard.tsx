"use client";

import Image from "next/image";
import { MoreVertical } from "lucide-react";
import { BookVideoCta } from "@/components/home/BookVideoCta";
import { SmartLink } from "@/components/home/HomeLinkButton";
import { HOME_TINTS } from "@/components/home/home-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HOVER_CARD_LIFT, HOVER_TRANSITION } from "@/lib/design/tokens";
import { resolvePreview, type LinkPreview, type ServiceItem } from "./doctor-profile-data";

interface DoctorLinkCardProps {
  service: ServiceItem;
  preview?: LinkPreview;
  moreLabel: string;
  onMore: () => void;
}

function MoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
      aria-label={label}
      onClick={onClick}
    >
      <MoreVertical className="size-5" aria-hidden="true" />
    </Button>
  );
}

function Thumbnail({ service, image, title }: { service: ServiceItem; image?: string; title: string }) {
  const Icon = service.icon;

  return (
    <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-border">
      {image ? (
        <Image src={image} alt={title} fill sizes="48px" className="object-cover" />
      ) : (
        <span
          className={cn("flex size-full items-center justify-center bg-linear-to-br text-white", HOME_TINTS[service.tint].gradient)}
          aria-hidden="true"
        >
          <Icon className="size-6" />
        </span>
      )}
    </span>
  );
}

export function DoctorLinkCard({ service, preview, moreLabel, onMore }: DoctorLinkCardProps) {
  const resolved = resolvePreview(service, preview);
  const tint = HOME_TINTS[service.tint];
  const Icon = service.icon;

  if (service.featured) {
    return (
      <article className="relative overflow-hidden rounded-3xl border border-primary/30 bg-linear-to-br from-emerald-50 via-card to-teal-50 p-4 shadow-lg shadow-emerald-900/5 ring-2 ring-primary/10 dark:from-emerald-950/40 dark:via-card dark:to-teal-950/30 sm:p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <SmartLink href={service.href} className="flex min-w-0 flex-1 items-center gap-4 focus-visible:outline-none">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <h3 className="font-heading text-base font-semibold text-foreground sm:text-lg">{resolved.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{resolved.description}</p>
              <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {service.badge}
              </span>
            </span>
          </SmartLink>
          <div className="flex items-center gap-2 sm:shrink-0">
            <BookVideoCta size="md" showArrow={false} className="flex-1 sm:flex-none" />
            <MoreButton label={moreLabel} onClick={onMore} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group flex h-full items-center gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-sm",
        HOVER_TRANSITION,
        HOVER_CARD_LIFT,
        "hover:border-primary/40 hover:shadow-lg hover:shadow-emerald-900/5"
      )}
    >
      <SmartLink href={service.href} className="flex min-w-0 flex-1 items-center gap-3.5 focus-visible:outline-none">
        <Thumbnail service={service} image={resolved.image} title={resolved.title} />
        <span className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
            {resolved.title}
          </h3>
          {resolved.siteName ? (
            <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {resolved.siteName}
            </p>
          ) : null}
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{resolved.description}</p>
          <span className={cn("mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold", tint.plate)}>
            {service.badge}
          </span>
        </span>
      </SmartLink>
      <MoreButton label={moreLabel} onClick={onMore} />
    </article>
  );
}
