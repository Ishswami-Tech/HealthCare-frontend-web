"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Instagram, 
  Youtube, 
  ExternalLink,
  Heart,
  MessageCircle,
  Share,
  Eye,
  Calendar
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const MediaShowcase = () => {
  const { t } = useLanguage();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // YouTube videos showcasing treatments
  const youtubeVideos = [
    {
      id: "viddhakarma-autism",
      title: "Viddhakarma Treatment for Autism",
      description: "Dr. Chandrakumar Deshmukh demonstrates specialized Viddhakarma technique for autism treatment",
      thumbnail: "/api/placeholder/400/225",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "12:45",
      views: "15K",
      category: "Viddhakarma"
    },
    {
      id: "viddhakarma-cp",
      title: "Viddhakarma for Cerebral Palsy",
      description: "Revolutionary treatment approach for cerebral palsy using traditional Viddhakarma methods",
      thumbnail: "/api/placeholder/400/225",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "18:30",
      views: "22K",
      category: "Viddhakarma"
    },
    {
      id: "panchakarma-demo",
      title: "Panchakarma Detoxification Process",
      description: "Complete Panchakarma therapy demonstration including Vaman, Virechan, and Basti",
      thumbnail: "/api/placeholder/400/225",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "25:15",
      views: "35K",
      category: "Panchakarma"
    },
    {
      id: "agnikarma-treatment",
      title: "Agnikarma Pain Relief Therapy",
      description: "Instant pain relief through traditional Agnikarma technique for joint and muscle pain",
      thumbnail: "/api/placeholder/400/225",
      videoId: "dQw4w9WgXcQ", // Replace with actual video ID
      duration: "8:20",
      views: "28K",
      category: "Agnikarma"
    }
  ];

  // Instagram posts showcasing results and testimonials
  const instagramPosts = [
    {
      id: "post-1",
      image: "/api/placeholder/300/300",
      caption: "Amazing recovery story: 8-year-old with autism showing remarkable improvement after Viddhakarma treatment",
      likes: 245,
      comments: 18,
      date: "2 days ago",
      hashtags: ["#Viddhakarma", "#Autism", "#AyurvedicHealing"]
    },
    {
      id: "post-2", 
      image: "/api/placeholder/300/300",
      caption: "Patient testimonial: Complete relief from chronic knee pain through Agnikarma therapy",
      likes: 189,
      comments: 12,
      date: "5 days ago",
      hashtags: ["#Agnikarma", "#PainRelief", "#KneePain"]
    },
    {
      id: "post-3",
      image: "/api/placeholder/300/300",
      caption: "Wellness retreat participants enjoying morning yoga and meditation session",
      likes: 156,
      comments: 8,
      date: "1 week ago",
      hashtags: ["#WellnessRetreat", "#Yoga", "#Meditation"]
    },
    {
      id: "post-4",
      image: "/api/placeholder/300/300",
      caption: "Dr. Chandrakumar Deshmukh explaining the benefits of Panchakarma detoxification",
      likes: 312,
      comments: 25,
      date: "1 week ago",
      hashtags: ["#Panchakarma", "#Detox", "#DrDeshmukh"]
    }
  ];

  const handleVideoPlay = (videoId: string) => {
    setActiveVideo(videoId);
  };

  const handleInstagramClick = (postId: string) => {
    // Open Instagram post in new tab
    window.open(`https://instagram.com/p/${postId}`, '_blank');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800 mb-4">
            <Play className="w-4 h-4 mr-2" />
            Media Showcase
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
            See Our Treatments in Action
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Watch real treatment demonstrations and patient success stories from our clinic
          </p>
        </div>

        {/* YouTube Videos Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Youtube className="w-6 h-6 mr-2 text-red-600" />
              Treatment Demonstrations
            </h3>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://youtube.com/@shrivishwamurthiayurveda', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Channel
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {youtubeVideos.map((video) => (
              <Card key={video.id} className="group hover:shadow-xl transition-all duration-300 border-0 overflow-hidden bg-white dark:bg-gray-800">
                <div className="relative">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                    {activeVideo === video.videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                        title={video.title}
                        className="w-full h-full"
                        frameBorder="0"
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
                          onClick={() => handleVideoPlay(video.videoId)}
                          className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                        >
                          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 text-white ml-1" />
                          </div>
                        </button>
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-red-600 text-white border-0">
                            {video.category}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {video.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {video.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Instagram className="w-6 h-6 mr-2 text-pink-600" />
              Patient Stories & Updates
            </h3>
            <Button 
              variant="outline"
              onClick={() => window.open('https://instagram.com/shrivishwamurthiayurveda', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Follow Us
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {instagramPosts.map((post) => (
              <Card 
                key={post.id} 
                className="group hover:shadow-xl transition-all duration-300 border-0 overflow-hidden bg-white dark:bg-gray-800 cursor-pointer"
                onClick={() => handleInstagramClick(post.id)}
              >
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                  <img 
                    src={post.image} 
                    alt="Instagram post"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="absolute top-2 right-2">
                    <Instagram className="w-5 h-5 text-white drop-shadow-lg" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
                    {post.caption}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
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
                      <span key={index} className="text-xs text-blue-600 dark:text-blue-400">
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
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Experience These Results?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Join thousands who have transformed their lives through our authentic Ayurvedic treatments
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  onClick={() => window.open('tel:+919860370961', '_self')}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t.common.freeConsultation}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.open('https://instagram.com/shrivishwamurthiayurveda', '_blank')}
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Follow Our Journey
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
