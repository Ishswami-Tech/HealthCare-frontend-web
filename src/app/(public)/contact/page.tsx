"use client";

import { ContactForm } from "@/components/contact/ContactForm";
import { ContactHero } from "@/components/contact/ContactHero";
import { ContactLocations } from "@/components/contact/ContactLocations";
import { ContactMap } from "@/components/contact/ContactMap";
import { ContactRoutes } from "@/components/contact/ContactRoutes";
import { buildWhatsAppHref } from "@/components/contact/contact-data";
import { HomeMotionProvider } from "@/components/home/home-motion";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { CONTAINER, SECTION_Y, SURFACE } from "@/lib/design/tokens";

export default function ContactPage() {
  const { t, language } = useTranslation();
  const whatsappHref = buildWhatsAppHref(language, t("clinic.name"));

  /* No PageTransition wrapper: it server-renders the whole page at opacity 0
     and fades it in only after hydration, so every refresh blinked. The hero
     animates itself from CSS and the sections reveal on scroll. */
  return (
    <HomeMotionProvider>
      <div className="overflow-x-clip font-body">
        <ContactHero whatsappHref={whatsappHref} />
        <ContactRoutes whatsappHref={whatsappHref} />

        <section className={cn(SURFACE.canvas, SECTION_Y)}>
          <div className={cn(CONTAINER, "grid items-stretch gap-6 lg:grid-cols-12")}>
            <ContactForm className="lg:col-span-7" />
            <ContactMap className="lg:col-span-5" />
          </div>
        </section>

        <ContactLocations />
      </div>
    </HomeMotionProvider>
  );
}
