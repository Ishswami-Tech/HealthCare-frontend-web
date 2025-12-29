"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  ExternalLink,
  Heart,
  MessageCircle,
  Eye,
  Calendar,
  Video,
  Camera,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

const MediaShowcase = () => {
  const { t } = useTranslation();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // YouTube videos showcasing treatments
  const youtubeVideos = [
    {
      id: "viddhakarma-autism",
      title: t("mediaShowcase.youtube.videos.viddhakarmaAutism.title"),
      description: t(
        "mediaShowcase.youtube.videos.viddhakarmaAutism.description"
      ),
      thumbnail: "/api/placeholder/400/225",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "12:45",
      views: "15K",
      category: t("treatments.viddhakarma.name"),
    },
    {
      id: "viddhakarma-cp",
      title: t("mediaShowcase.youtube.videos.viddhakarmaCP.title"),
      description: t("mediaShowcase.youtube.videos.viddhakarmaCP.description"),
      thumbnail: "/api/placeholder/400/225",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "18:30",
      views: "22K",
      category: t("treatments.viddhakarma.name"),
    },
    {
      id: "panchakarma-demo",
      title: t("mediaShowcase.youtube.videos.panchakarmaDemo.title"),
      description: t(
        "mediaShowcase.youtube.videos.panchakarmaDemo.description"
      ),
      thumbnail: "/api/placeholder/400/225",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "25:15",
      views: "35K",
      category: t("treatments.panchakarma.name"),
    },
    {
      id: "agnikarma-treatment",
      title: t("mediaShowcase.youtube.videos.agnikarmaTreatment.title"),
      description: t(
        "mediaShowcase.youtube.videos.agnikarmaTreatment.description"
      ),
      thumbnail: "/api/placeholder/400/225",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "8:20",
      views: "28K",
      category: t("treatments.agnikarma.name"),
    },
  ];

  // Instagram posts showcasing results and testimonials
  const instagramPosts = [
    {
      id: "post-1",
      image: "/api/placeholder/300/300",
      caption: t("mediaShowcase.instagram.posts.post1"),
      likes: 245,
      comments: 18,
      date: "2 days ago",
      hashtags: [
        `#${t("treatments.viddhakarma.name")}`,
        "#Autism",
        "#AyurvedicHealing",
      ],
    },
    {
      id: "post-2",
      image: "/api/placeholder/300/300",
      caption: t("mediaShowcase.instagram.posts.post2"),
      likes: 189,
      comments: 12,
      date: "5 days ago",
      hashtags: [
        `#${t("treatments.agnikarma.name")}`,
        "#PainRelief",
        "#KneePain",
      ],
    },
    {
      id: "post-3",
      image: "/api/placeholder/300/300",
      caption: t("mediaShowcase.instagram.posts.post3"),
      likes: 156,
      comments: 8,
      date: "1 week ago",
      hashtags: ["#WellnessRetreat", "#Yoga", "#Meditation"],
    },
    {
      id: "post-4",
      image: "/api/placeholder/300/300",
      caption: t("mediaShowcase.instagram.posts.post4"),
      likes: 312,
      comments: 25,
      date: "1 week ago",
      hashtags: [
        `#${t("treatments.panchakarma.name")}`,
        "#Detox",
        "#DrDeshmukh",
      ],
    },
  ];

  const handleVideoPlay = (videoId: string) => {
    setActiveVideo(videoId);
  };

  const handleInstagramClick = (postId: string) => {
    // Open Instagram post in new tab
    window.open(`https://instagram.com/p/${postId}`, "_blank");
  };

  return (
    <section className="py-20 bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            <Play className="w-4 h-4 mr-2" />
            {t("mediaShowcase.title")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            {t("mediaShowcase.subtitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t("mediaShowcase.description")}
          </p>
        </div>

        {/* YouTube Videos Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-foreground flex items-center">
              <Video className="w-6 h-6 mr-2 text-primary" />
              {t("mediaShowcase.youtube.title")}
            </h3>
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  "https://youtube.com/@shriVishwamurtiayurveda",
                  "_blank"
                )
              }
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("mediaShowcase.youtube.viewChannel")}
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {youtubeVideos.map((video) => (
              <Card
                key={video.id}
                className="group hover:shadow-xl transition-all duration-300 border-0 overflow-hidden bg-card"
              >
                <div className="relative">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {activeVideo === video.videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                        title={video.title}
                        className="w-full h-full"
                        style={{ border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                        <button
                          type="button"
                          onClick={() => handleVideoPlay(video.videoId)}
                          className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                          aria-label={`Play video: ${video.title}`}
                        >
                          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 text-white ml-1" />
                          </div>
                        </button>
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-primary text-primary-foreground border-0">
                            {video.category}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                    {video.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {video.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{video.views} views</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 px-2">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Instagram Posts Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-foreground flex items-center">
              <Camera className="w-6 h-6 mr-2 text-primary" />
              {t("mediaShowcase.instagram.title")}
            </h3>
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  "https://instagram.com/shriVishwamurtiayurveda",
                  "_blank"
                )
              }
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("mediaShowcase.instagram.followUs")}
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {instagramPosts.map((post) => (
              <Card
                key={post.id}
                className="group hover:shadow-xl transition-all duration-300 border-0 overflow-hidden bg-card cursor-pointer"
                onClick={() => handleInstagramClick(post.id)}
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img
                    src={post.image}
                    alt={t("mediaShowcase.instagram.altText")}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="absolute top-2 right-2">
                    <Camera className="w-5 h-5 text-white drop-shadow-lg" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-card-foreground mb-3 line-clamp-3">
                    {post.caption}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.slice(0, 2).map((tag, index) => (
                      <span key={index} className="text-xs text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {t("mediaShowcase.cta.title")}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t("mediaShowcase.cta.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => window.open("tel:+919860370961", "_self")}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t("common.freeConsultation")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      "https://instagram.com/shriVishwamurtiayurveda",
                      "_blank"
                    )
                  }
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {t("mediaShowcase.cta.followJourney")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MediaShowcase;
