"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  ExternalLink,
  Car,
  Train,
  Bus,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

const GoogleMap = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  // Clinic coordinates for Chinchwad location
  const clinicLocation = {
    lat: 18.6298,
    lng: 73.7997,
    address: t("clinic.address"),
  };

  const handleGetDirections = () => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      clinicLocation.address
    )}`;
    window.open(googleMapsUrl, "_blank");
  };

  const handleCallClinic = () => {
    window.open("tel:+919860370961", "_self");
  };

  const transportOptions = [
    {
      icon: Car,
      title: "By Car",
      description: "Direct route via Pune-Mumbai Highway",
      time: "15-20 minutes",
    },
    {
      icon: Bus,
      title: "By Bus",
      description: "Regular bus service from Pune city",
      time: "30-45 minutes",
    },
    {
      icon: Train,
      title: "By Train",
      description: "Nearest station: Chinchwad Railway Station",
      time: "10-15 minutes",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            {" "}
            <MapPin className="w-4 h-4 mr-2" /> Find Us{" "}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            {" "}
            Our Location{" "}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {" "}
            Visit our clinic for personalized Ayurvedic care and treatments{" "}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="bg-card shadow-xl border-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-card-foreground flex items-center">
                  {" "}
                  <MapPin className="w-5 h-5 mr-2" /> Clinic Location{" "}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative h-96 bg-muted">
                  {/* Google Maps Embed */}
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3781.8234567890123!2d73.7997!3d18.6298!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDM3JzQ3LjMiTiA3M8KwNDcnNTguOSJF!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin&q=${encodeURIComponent(
                      clinicLocation.address
                    )}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-b-lg"
                    onLoad={() => setIsLoading(false)}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-muted-foreground">
                          {" "}
                          Loading map...{" "}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleGetDirections}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://maps.google.com/?q=${encodeURIComponent(
                            clinicLocation.address
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="w-4 h-4 mr-2" /> Open in Maps
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Transport Info */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-card-foreground flex items-center">
                  {" "}
                  <Phone className="w-5 h-5 mr-2" /> Contact Information{" "}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-card-foreground">Address</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("clinic.address")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-card-foreground">
                      {" "}
                      Phone Numbers{" "}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("clinic.phone")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-card-foreground">
                      OPD Timing
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {" "}
                      {t("clinic.mondayToFriday")}{" "}
                    </p>
                    <p className="text-sm text-destructive">
                      {t("clinic.weekends")}: {t("clinic.closed")}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleCallClinic}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transport Options */}
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-card-foreground flex items-center">
                  {" "}
                  <Car className="w-5 h-5 mr-2" /> How to Reach{" "}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transportOptions.map((option, index) => {
                    const IconComponent = option.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-muted rounded-lg"
                      >
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-card-foreground">
                            {option.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                          <p className="text-xs text-primary mt-1">
                            {option.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary flex items-center">
                    {" "}
                    <MapPin className="w-4 h-4 mr-2" /> Free parking available{" "}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoogleMap;
