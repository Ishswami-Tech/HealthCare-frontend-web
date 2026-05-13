"use client";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, Camera, Heart, Star } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

import { InstagramGrid } from "@/components/media/instagram-post";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { getIconColorScheme } from "@/lib/config/color-palette";

export default function GalleryPage() {
  const { t } = useTranslation();
  // Sample Instagram posts for demonstration
  const sampleInstagramPosts = [
    {
      id: "1",
      postUrl: "https://www.instagram.com/p/sample1/",
      caption:
        "Patient testimonial: Amazing results with Panchakarma therapy! 🌿 #Ayurveda #NaturalHealing",
    },
    {
      id: "2",
      postUrl: "https://www.instagram.com/p/sample2/",
      caption:
        "Dr. Deshmukh performing traditional Agnikarma treatment for joint pain relief. 🔥 #Agnikarma #JointPain",
    },
    {
      id: "3",
      postUrl: "https://www.instagram.com/p/sample3/",
      caption:
        "Wellness retreat participants enjoying morning yoga session. 🧘‍♀️ #WellnessRetreat #Yoga",
    },
    {
      id: "4",
      postUrl: "https://www.instagram.com/p/sample4/",
      caption:
        "Traditional Viddhakarma therapy session for neurological wellness. 🧠 #Viddhakarma #NeuroWellness",
    },
    {
      id: "5",
      postUrl: "https://www.instagram.com/p/sample5/",
      caption:
        "Herbal medicine preparation in our traditional pharmacy. 🌱 #HerbalMedicine #Ayurveda",
    },
    {
      id: "6",
      postUrl: "https://www.instagram.com/p/sample6/",
      caption:
        "Patient success story: Complete recovery from chronic arthritis! 💪 #SuccessStory #Arthritis",
    },
  ];

  const galleryStats = [
    {
      icon: Instagram,
      number: "10K+",
      label: t("gallery.stats.instagramFollowers"),
      colorScheme: getIconColorScheme("Instagram"),
    },
    {
      icon: Camera,
      number: "500+",
      label: t("gallery.stats.treatmentPhotos"),
      colorScheme: getIconColorScheme("Camera"),
    },
    {
      icon: Heart,
      number: "1000+",
      label: t("gallery.stats.patientStories"),
      colorScheme: getIconColorScheme("Heart"),
    },
    {
      icon: Star,
      number: "4.9★",
      label: t("gallery.stats.averageRating"),
      colorScheme: getIconColorScheme("Star"),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Language Switcher */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/70 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.34)_100%)] py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_34%),radial-gradient(circle_at_bottom_right,hsl(var(--secondary)/0.08),transparent_32%)]" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <Badge className="mb-6 border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-none">
              <Instagram className="w-4 h-4 mr-2" />
              {t("gallery.badge")}
              </Badge>

              <h1 className="max-w-5xl font-playfair text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("gallery.hero.title1")}{" "}
              <span className="text-primary">{t("gallery.hero.title2")}</span>
              </h1>

              <p className="mt-6 max-w-4xl text-base leading-8 text-muted-foreground sm:text-lg lg:text-xl">
              {t("gallery.hero.description")}
              </p>

              <div className="mt-8">
                <a
                  href="https://instagram.com/Vishwamurtiayurveda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <Instagram className="w-5 h-5" />
                  {t("gallery.followInstagram")}
                </a>
              </div>
            </div>

            <Card className="border-border/70 bg-card/96 shadow-[0_28px_90px_-56px_rgba(15,23,42,0.45)]">
              <CardContent className="p-6 sm:p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Visual proof
                </p>
                <div className="mt-5 grid gap-3">
                  {galleryStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3"
                    >
                      <span className="text-sm text-muted-foreground">
                        {stat.label}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {stat.number}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {galleryStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card
                  key={index}
                  className="border-border/70 bg-card text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div
                      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="mb-2 text-3xl font-bold text-foreground">
                      {stat.number}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="border-y border-border/70 bg-muted/25 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4 font-playfair text-3xl font-bold text-foreground sm:text-4xl">
              {t("gallery.instagram.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t("gallery.instagram.description")}
            </p>
          </div>

          <InstagramGrid
            posts={sampleInstagramPosts}
            columns={3}
            aspectRatio="square"
            showCaptions={true}
          />

          <div className="text-center mt-12">
            <a
              href="https://instagram.com/Vishwamurtiayurveda"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Instagram className="w-5 h-5" />
              {t("gallery.viewMoreInstagram")}
            </a>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="border-y border-primary/20 bg-primary/[0.96] py-16 text-primary-foreground sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("gallery.cta.title")}
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/80 max-w-3xl mx-auto">
            {t("gallery.cta.description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-background text-primary hover:bg-muted">
              <a href="/contact">{t("gallery.cta.shareStory")}</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <a
                href="https://wa.me/9860370961?text=I would like to share my healing story"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("gallery.cta.whatsappUs")}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
