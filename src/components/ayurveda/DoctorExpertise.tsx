"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Heart,
  Phone,
  MapPin,
  Clock,
  Award,
  Users,
  Stethoscope,
  Star,
  CheckCircle,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const DoctorExpertise = () => {
  const { t } = useTranslation();

  const specializations = [
    {
      icon: Brain,
      title: "Autism Treatment",
      description: "Specialized Viddhakarma treatment for autism spectrum disorders with proven results in improving communication and social skills.",
      highlight: "Unique energy restoration technique that shows remarkable improvement in 2-4 weeks",
      color: "from-purple-500 to-indigo-600",
      bgColor:
        "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20",
    },
    {
      icon: Heart,
      title: "Cerebral Palsy Care",
      description: "Comprehensive treatment approach for cerebral palsy using Viddhakarma techniques to improve mobility and quality of life.",
      highlight: "Significant improvement in motor skills and coordination within 6-8 weeks",
      color: "from-red-500 to-pink-600",
      bgColor:
        "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
    },
    {
      icon: Stethoscope,
      title: "Mental Health Disorders",
      description: "Holistic treatment for various mental health conditions including anxiety, depression, and stress-related disorders.",
      highlight: "Natural healing approach that addresses root causes without side effects",
      color: "from-green-500 to-emerald-600",
      bgColor:
        "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    },
  ];

  const opdSchedule = [
    { day: "Monday", hours: "11:45 AM – 11:30 PM", available: true },
    { day: "Tuesday", hours: "11:45 AM – 11:30 PM", available: true },
    { day: "Wednesday", hours: "11:45 AM – 11:30 PM", available: true },
    { day: "Thursday", hours: "11:45 AM – 11:30 PM", available: true },
    { day: "Friday", hours: "11:45 AM – 11:30 PM", available: true },
    { day: "Saturday", hours: "Closed", available: false },
    { day: "Sunday", hours: "Closed", available: false },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Doctor Introduction */}
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 mb-4">
              <Award className="w-4 h-4 mr-2" />
              {t("doctor.title")}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
              {t("doctor.name")}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              {t("doctor.specialization")}
            </p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("doctor.experience")}
              </span>
            </div>
          </div>

          {/* Specializations Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {specializations.map((spec, index) => {
              const IconComponent = spec.icon;
              return (
                <Card
                  key={index}
                  className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden bg-white dark:bg-gray-800"
                >
                  <CardHeader
                    className={`bg-gradient-to-br ${spec.bgColor} relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                      <IconComponent className="w-full h-full" />
                    </div>
                    <div className="relative z-10">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${spec.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-playfair font-bold text-gray-900 dark:text-white mb-2">
                        {spec.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      {spec.description}
                    </p>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        {spec.highlight}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Contact & Location Info */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Contact Information */}
            <Card className="bg-white dark:bg-gray-800 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <Phone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {t("clinic.phone")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Primary Contact
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {t("clinic.phone")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Secondary Contact
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-600 dark:text-red-400 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Clinic Location
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {t("clinic.address")}
                    </p>
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now: {t("clinic.phone")}
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Live Chat
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* OPD Timing */}
            <Card className="bg-white dark:bg-gray-800 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  OPD Timing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opdSchedule.map((schedule, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        schedule.available
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                          : "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {schedule.available ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-400 dark:bg-gray-500" />
                        )}
                        <span
                          className={cn(
                            "font-medium",
                            schedule.available
                              ? "text-green-800 dark:text-green-200"
                              : "text-gray-600 dark:text-gray-400"
                          )}
                        >
                          {schedule.day}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          schedule.available
                            ? "text-green-700 dark:text-green-300"
                            : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        {schedule.hours}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Affordability & Wellness Features */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Affordable Care
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We believe in making authentic Ayurvedic treatments accessible to everyone. Our pricing is transparent and affordable without compromising on quality.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Wellness Retreats
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Experience comprehensive wellness programs that combine traditional treatments with modern comfort for complete health rejuvenation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorExpertise;
