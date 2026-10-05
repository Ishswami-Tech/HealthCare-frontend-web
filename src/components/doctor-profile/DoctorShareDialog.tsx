"use client";

import Image from "next/image";
import { Check, Copy, ExternalLink, Share2, X } from "lucide-react";
import { SmartLink } from "@/components/home/HomeLinkButton";
import { HOME_TINTS } from "@/components/home/home-theme";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { CONTROL_LIFT, CONTROL_TRANSITION } from "@/lib/design/tokens";
import {
  DOCTOR,
  getShareText,
  resolveHref,
  resolvePreview,
  type LinkPreview,
  type ServiceItem,
} from "./doctor-profile-data";
import { FacebookIcon, InstagramIcon, LinkedInIcon, WhatsAppIcon } from "./social-icons";

const ROUND_ACTION_CLASSES = cn(
  "flex size-10 flex-none items-center justify-center rounded-full text-white shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
  CONTROL_TRANSITION,
  CONTROL_LIFT
);

interface DoctorShareDialogProps {
  service: ServiceItem | null;
  preview?: LinkPreview;
  doctorName: string;
  copiedTarget: string | null;
  onCopy: (text: string, target: string) => void;
  onShareLink: (service: ServiceItem) => void;
  onClose: () => void;
}

export function DoctorShareDialog({
  service,
  preview,
  doctorName,
  copiedTarget,
  onCopy,
  onShareLink,
  onClose,
}: DoctorShareDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={Boolean(service)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl sm:max-w-lg"
      >
        {service ? <ShareDialogBody
          service={service}
          preview={preview}
          doctorName={doctorName}
          copiedTarget={copiedTarget}
          onCopy={onCopy}
          onShareLink={onShareLink}
          t={t}
        /> : null}
      </DialogContent>
    </Dialog>
  );
}

type ShareDialogBodyProps = Omit<DoctorShareDialogProps, "onClose" | "service"> & {
  service: ServiceItem;
  t: (path: string) => string;
};

function ShareDialogBody({ service, preview, doctorName, copiedTarget, onCopy, onShareLink, t }: ShareDialogBodyProps) {
  const resolved = resolvePreview(service, preview);
  const href = resolveHref(service.href);
  const copyTarget = `service:${service.id}`;
  const shareTarget = `share:${service.id}`;
  const Icon = service.icon;

  return (
    <>
      <DialogTitle className="sr-only">
        {t("drDeshmukhPage.shareDialogTitlePrefix")} - {service.title}
      </DialogTitle>

      <div className="relative border-b border-border bg-background/60 p-5 pr-16">
        <DialogClose asChild>
          <button
            type="button"
            className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            aria-label={t("drDeshmukhPage.closeDialog")}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </DialogClose>

        <div className="flex items-center gap-4">
          <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-border">
            {resolved.image ? (
              <Image src={resolved.image} alt={resolved.title} fill sizes="64px" className="object-cover" />
            ) : (
              <span
                className={cn("flex size-full items-center justify-center bg-linear-to-br text-white", HOME_TINTS[service.tint].gradient)}
                aria-hidden="true"
              >
                <Icon className="size-6" />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-base font-semibold leading-snug text-foreground">{resolved.title}</p>
            {resolved.siteName ? (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {resolved.siteName}
              </p>
            ) : null}
            <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{resolved.description}</p>
          </div>
        </div>
      </div>

      <div className="flex max-h-[calc(100vh-14rem)] flex-col gap-4 overflow-y-auto p-5">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-3">
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{href}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
            onClick={() => onCopy(href, copyTarget)}
            aria-label={t("drDeshmukhPage.copyLink")}
          >
            {copiedTarget === copyTarget ? (
              <Check className="size-4 text-primary" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onShareLink(service)}
            className={cn(ROUND_ACTION_CLASSES, "bg-foreground text-background")}
            aria-label={t("drDeshmukhPage.shareLink")}
            title={t("drDeshmukhPage.shareLink")}
          >
            {copiedTarget === shareTarget ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={() => onCopy(href, copyTarget)}
            className={cn(ROUND_ACTION_CLASSES, "bg-sky-500")}
            aria-label={t("drDeshmukhPage.copyLink")}
            title={t("drDeshmukhPage.copyLink")}
          >
            {copiedTarget === copyTarget ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={() =>
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(href)}`,
                "_blank",
                "noreferrer"
              )
            }
            className={cn(ROUND_ACTION_CLASSES, "bg-[#1877F2]")}
            aria-label={t("drDeshmukhPage.shareOnFacebook")}
            title={t("drDeshmukhPage.shareOnFacebook")}
          >
            <FacebookIcon className="size-4" />
          </button>

          <SmartLink
            href={DOCTOR.socialLinks.instagram}
            className={cn(ROUND_ACTION_CLASSES, "bg-linear-to-br from-fuchsia-500 via-pink-500 to-rose-500")}
            aria-label={t("drDeshmukhPage.socialLinks.instagram")}
            title={t("drDeshmukhPage.socialLinks.instagram")}
          >
            <InstagramIcon className="size-4" />
          </SmartLink>

          <SmartLink
            href={`https://wa.me/?text=${encodeURIComponent(getShareText(service, doctorName))}`}
            className={cn(ROUND_ACTION_CLASSES, "bg-[#25D366]")}
            aria-label={t("drDeshmukhPage.shareOnWhatsApp")}
            title={t("drDeshmukhPage.shareOnWhatsApp")}
          >
            <WhatsAppIcon className="size-4" />
          </SmartLink>

          <SmartLink
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(href)}`}
            className={cn(ROUND_ACTION_CLASSES, "bg-[#0A66C2]")}
            aria-label={t("drDeshmukhPage.shareOnLinkedIn")}
            title={t("drDeshmukhPage.shareOnLinkedIn")}
          >
            <LinkedInIcon className="size-4" />
          </SmartLink>

          <SmartLink
            href={service.href}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            aria-label={t("drDeshmukhPage.openHere")}
            title={t("drDeshmukhPage.openHere")}
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            {t("drDeshmukhPage.openHere")}
          </SmartLink>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("drDeshmukhPage.sharePreview")}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
            {getShareText(service, doctorName)}
          </p>
        </div>
      </div>
    </>
  );
}
