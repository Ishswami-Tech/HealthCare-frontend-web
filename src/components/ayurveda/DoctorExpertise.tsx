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
      description:
        "Specialized Viddhakarma treatment for autism spectrum disorders with proven results in improving communication and social skills.",
      highlight:
        "Unique energy restoration technique that shows remarkable improvement in 2-4 weeks",
      color: "from-purple-500 to-indigo-600",
      bgColor:
        "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20",
    },
    {
      icon: Heart,
      title: "Cerebral Palsy Care",
      description:
        "Comprehensive treatment approach for cerebral palsy using Viddhakarma techniques to improve mobility and quality of life.",
      highlight:
        "Significant improvement in motor skills and coordination within 6-8 weeks",
      color: "from-red-500 to-pink-600",
      bgColor:
        "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
    },
    {
      icon: Stethoscope,
      title: "Mental Health Disorders",
      description:
        "Holistic treatment for various mental health conditions including anxiety, depression, and stress-related disorders.",
      highlight:
        "Natural healing approach that addresses root causes without side effects",
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
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Doctor Introduction */}
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              <Award className="w-4 h-4 mr-2" />
              {t("doctor.title")}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4">
              {t("doctor.name")}
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              {t("doctor.specialization")}
            </p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <Star className="w-5 h-5 text-primary fill-current" />
              <span className="text-lg font-semibold text-foreground">
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
                  className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden bg-card"
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
                      <CardTitle className="text-xl font-playfair font-bold text-card-foreground mb-2">
                        {spec.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {spec.description}
                    </p>
                    <div className="p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                      <p className="text-sm font-medium text-primary">
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
            <Card className="bg-card shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-card-foreground">
                  <Phone className="w-6 h-6 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-card-foreground">
                      {t("clinic.phone")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Primary Contact
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-card-foreground">
                      {t("clinic.phone")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Secondary Contact
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-destructive mt-1" />
                  <div>
                    <p className="font-semibold text-card-foreground">
                      Clinic Location
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("clinic.address")}
                    </p>
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
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
            <Card className="bg-card shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-card-foreground">
                  <Clock className="w-6 h-6 text-primary" />
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
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted border border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {schedule.available ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-muted-foreground" />
                        )}
                        <span
                          className={cn(
                            "font-medium",
                            schedule.available
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {schedule.day}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          schedule.available
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {schedule.hours}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Affordability & Wellness Features */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Affordable Care
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  We believe in making authentic Ayurvedic treatments accessible
                  to everyone. Our pricing is transparent and affordable without
                  compromising on quality.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Wellness Retreats
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Experience comprehensive wellness programs that combine
                  traditional treatments with modern comfort for complete health
                  rejuvenation.
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
