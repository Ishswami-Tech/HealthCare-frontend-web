"use client";

import { AboutCta } from "@/components/about/AboutCta";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutStory } from "@/components/about/AboutStory";
import { AboutTimeline } from "@/components/about/AboutTimeline";
import { AboutValues } from "@/components/about/AboutValues";
import HomeGuruParampara from "@/components/home/HomeGuruParampara";
import { HomeMotionProvider } from "@/components/home/home-motion";

export default function AboutPage() {
  /* No PageTransition wrapper: it server-renders the whole page at opacity 0
     and fades it in only after hydration, so every refresh blinked. The hero
     animates itself from CSS and the sections reveal on scroll. */
  return (
    <HomeMotionProvider>
      <div className="overflow-x-clip font-body">
        <AboutHero />
        <AboutStory />
        <AboutValues />
        {/* The lineage the doctor trained in — the same section the homepage carries. */}
        <HomeGuruParampara />
        <AboutTimeline />
        <AboutCta />
      </div>
    </HomeMotionProvider>
  );
}
