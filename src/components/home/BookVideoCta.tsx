"use client";

import { ArrowRight, Video, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { HomeLinkButton, type HomeButtonSize, type HomeButtonVariant } from "./HomeLinkButton";
import { HOME_LINKS } from "./home-links";

interface BookVideoCtaProps {
  label?: string;
  variant?: HomeButtonVariant;
  size?: HomeButtonSize;
  showArrow?: boolean;
  /**
   * Leading glyph. Defaults to the camera, which is what the label promises
   * everywhere the button says "video consultation"; callers whose own label
   * is about booking a slot rather than the medium can pass a calendar.
   */
  icon?: LucideIcon;
  className?: string;
}

/** Primary conversion CTA: opens the video-consultation booking flow. */
export function BookVideoCta({
  label,
  variant = "solid",
  size = "lg",
  showArrow = true,
  icon = Video,
  className,
}: BookVideoCtaProps) {
  const { t } = useTranslation();

  return (
    <HomeLinkButton
      href={HOME_LINKS.videoBooking}
      variant={variant}
      size={size}
      icon={icon}
      trailingIcon={showArrow ? ArrowRight : undefined}
      className={className}
    >
      {label ?? t("drDeshmukhPage.services.videoAppointments.title")}
    </HomeLinkButton>
  );
}
