"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { MessageCircle, Phone } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { BookVideoCta } from "./BookVideoCta";
import { firstPhone, toTelHref, toWhatsAppHref } from "./home-links";
import { HOME_EASE } from "./home-motion";

const SHOW_AFTER_SCROLL_PX = 480;
const HIDE_NEAR_BOTTOM_PX = 360;

const ICON_LINK_CLASSES =
  "flex size-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30";

/**
 * Sticky booking bar for small screens, shown once the hero scrolls out of view.
 * The public layout hides the floating WhatsApp button while this bar is mounted.
 */
export default function HomeMobileCtaBar() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const { scrollY, innerHeight } = window;
      const distanceToBottom = document.documentElement.scrollHeight - (scrollY + innerHeight);
      setIsVisible(scrollY > SHOW_AFTER_SCROLL_PX && distanceToBottom > HIDE_NEAR_BOTTOM_PX);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const telHref = toTelHref(firstPhone(t("clinic.phone")));
  const whatsAppHref = toWhatsAppHref(t("clinic.whatsapp"));

  return (
    <AnimatePresence>
      {isVisible ? (
        <m.div
          key="home-mobile-cta"
          id="home-mobile-cta-bar"
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ duration: 0.35, ease: HOME_EASE }}
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-border/70 bg-card/92 p-2 shadow-[0_18px_40px_-16px_rgba(10,70,52,0.5)] backdrop-blur-xl">
            <a href={telHref} aria-label={t("common.callNow")} className={ICON_LINK_CLASSES}>
              <Phone className="size-5" aria-hidden="true" />
            </a>
            <a
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("common.whatsappMessage")}
              className={ICON_LINK_CLASSES}
            >
              <MessageCircle className="size-5" aria-hidden="true" />
            </a>
            <BookVideoCta
              size="md"
              showArrow={false}
              label={t("comprehensiveCTA.contactChannels.channels.video.title")}
              className="min-w-0 flex-1"
            />
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
