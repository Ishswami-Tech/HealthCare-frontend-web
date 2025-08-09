"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Camera, Heart, Users, Star } from "lucide-react";
import { LanguageProvider } from "@/lib/i18n/context";
import { InstagramGrid } from "@/components/media/instagram-post";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function GalleryPage() {
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
      label: "Instagram Followers",
      color: "from-pink-500 to-purple-600",
    },
    {
      icon: Camera,
      number: "500+",
      label: "Treatment Photos",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: Heart,
      number: "1000+",
      label: "Patient Stories",
      color: "from-red-500 to-pink-600",
    },
    {
      icon: Star,
      number: "4.9★",
      label: "Average Rating",
      color: "from-yellow-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-pink-100 text-pink-800 border-pink-200 mb-6">
              <Instagram className="w-4 h-4 mr-2" />
              Gallery & Social Media
            </Badge>

            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-6">
              Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                Healing Journey
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Follow our daily activities, patient success stories, and
              treatment demonstrations through our social media presence.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://instagram.com/vishwamurthiayurveda"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Instagram className="w-5 h-5" />
                Follow on Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {galleryStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-white to-gray-50"
                >
                  <CardContent className="p-6">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 text-sm">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Patient Stories & Updates
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Follow our journey and see real patient testimonials, treatment
              updates, and wellness tips from our Instagram feed.
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
              href="https://instagram.com/vishwamurthiayurveda"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              <Instagram className="w-5 h-5" />
              View More on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Share Your Healing Story
          </h2>
          <p className="text-xl mb-8 text-green-100 max-w-3xl mx-auto">
            Have you experienced the benefits of our Ayurvedic treatments? We'd
            love to feature your success story and inspire others on their
            wellness journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/ayurveda/contact"
              className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Share Your Story
            </a>
            <a
              href="https://wa.me/9860370961?text=I would like to share my healing story"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
