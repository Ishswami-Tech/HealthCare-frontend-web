"use client";


import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen">
      {/* Language Switcher */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 glass animate-fade-in-down">
              <Instagram className="w-4 h-4 mr-2" />
              {t("gallery.badge")}
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-foreground mb-6 gradient-text">
              {t("gallery.hero.title1")}{" "}
              <span className="text-primary">{t("gallery.hero.title2")}</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {t("gallery.hero.description")}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://instagram.com/Vishwamurtiayurveda"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 interactive"
              >
                <Instagram className="w-5 h-5" />
                {t("gallery.followInstagram")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {galleryStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-card to-muted/50 glass card-hover"
                >
                  <CardContent className="p-6">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${stat.colorScheme.gradient} rounded-full flex items-center justify-center mx-auto mb-4 interactive hover:${stat.colorScheme.hover} transition-all duration-300`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-2 gradient-text">
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
      <section className="py-12 sm:py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4 gradient-text">
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
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 interactive"
            >
              <Instagram className="w-5 h-5" />
              {t("gallery.viewMoreInstagram")}
            </a>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("gallery.cta.title")}
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/80 max-w-3xl mx-auto">
            {t("gallery.cta.description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-background text-primary hover:bg-primary/10 px-8 py-4 rounded-lg font-semibold text-lg transition-colors interactive"
            >
              {t("gallery.cta.shareStory")}
            </a>
            <a
              href="https://wa.me/9860370961?text=I would like to share my healing story"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-4 rounded-lg font-semibold text-lg transition-colors interactive"
            >
              {t("gallery.cta.whatsappUs")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
