"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Star, 
  Users, 
  Award, 
  Clock,
  Phone,
  MessageCircle,
  CheckCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const HeroSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [liveCount, setLiveCount] = useState(147);

  const testimonials = [
    "Meera from Mumbai completed 21-day Panchakarma detox - 3 min ago",
    "Rajesh rated Agnikarma treatment 5 stars for sciatica relief - 7 min ago", 
    "Dr. Sharma referred fertility case for traditional treatment - 10 min ago",
    "Sunita shared Viddha Karma success story on Instagram - 15 min ago",
    "Corporate wellness program booked for 50 employees - 18 min ago"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setLiveCount(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="relative min-h-screen flex items-center">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-orange-100 via-amber-50 to-red-100">
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Government Certified
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Award className="w-3 h-3 mr-1" />
                ISO 9001:2015
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <Star className="w-3 h-3 mr-1" />
                4.9/5 Rating
              </Badge>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-gray-900 mb-6 leading-tight">
              Ancient Wisdom.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                Complete Healing.
              </span>
              <br />
              Transform Your Life
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
              Experience Authentic <strong>Panchakarma</strong>, <strong>Agnikarma</strong>, 
              <strong> Viddha Karma</strong> & Complete Ayurvedic Solutions - Where 5000-Year 
              Healing Wisdom Meets Modern Excellence
            </p>

            {/* Live Social Proof */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-8 border border-orange-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-gray-900">Live Activity</span>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  High Demand
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {testimonials[currentTestimonial]}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>{liveCount} people viewing treatments today</span>
                <span>Bookings increased 400% this month</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                🔥 Book Free Consultation
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-green-500 text-green-600 hover:bg-green-50 text-lg px-8 py-6 rounded-full"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Now: +91-XXXX-XXXX
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-6">
              <Button variant="ghost" className="text-orange-600 hover:text-orange-700">
                <Play className="w-4 h-4 mr-2" />
                Watch Healing Journeys
              </Button>
              <Button variant="ghost" className="text-orange-600 hover:text-orange-700">
                🏥 Virtual Clinic Tour
              </Button>
            </div>

            {/* Urgency Notice */}
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  TODAY ONLY: Free Ayurvedic consultation + dosha assessment
                </span>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative">
            <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                      <span className="text-4xl">🕉️</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Sacred Healing Environment
                    </h3>
                    <p className="text-gray-600 px-4">
                      Experience authentic Ayurvedic treatments in our serene, traditional setting
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">5000+</div>
                    <div className="text-sm text-gray-600">Lives Transformed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">20+</div>
                    <div className="text-sm text-gray-600">Years Legacy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">95%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">4.9★</div>
                    <div className="text-sm text-gray-600">Patient Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-full shadow-lg animate-bounce">
              <MessageCircle className="w-6 h-6" />
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white p-3 rounded-full shadow-lg">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
