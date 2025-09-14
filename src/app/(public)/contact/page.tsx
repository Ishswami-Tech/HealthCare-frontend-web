"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Calendar,
  User,
  Heart,
  CheckCircle,
  Send,
  Star,
} from "lucide-react";
import { ClinicInfo } from "@/components/clinic/clinic-info";
import { GoogleMaps } from "@/components/maps/google-maps";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function ContactPage() {
  const t = useTranslations();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    condition: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    // TODO: Implement form submission logic
  };

  const contactInfo = [
    {
      icon: Phone,
      title: t("contact.contactInfo.phoneNumbers.title"),
      details: [
        t("contact.contactInfo.phoneNumbers.details.0"),
        t("contact.contactInfo.phoneNumbers.details.1"),
        t("contact.contactInfo.phoneNumbers.details.2"),
      ],
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: Mail,
      title: t("contact.contactInfo.emailAddresses.title"),
      details: [
        t("contact.contactInfo.emailAddresses.details.0"),
        t("contact.contactInfo.emailAddresses.details.1"),
        t("contact.contactInfo.emailAddresses.details.2"),
      ],
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: MapPin,
      title: t("contact.contactInfo.location.title"),
      details: [
        t("contact.contactInfo.location.details.0"),
        t("contact.contactInfo.location.details.1"),
        t("contact.contactInfo.location.details.2"),
      ],
      color: "from-orange-500 to-red-600",
    },
    {
      icon: Clock,
      title: t("contact.contactInfo.workingHours.title"),
      details: [
        t("contact.contactInfo.workingHours.details.0"),
        t("contact.contactInfo.workingHours.details.1"),
        t("contact.contactInfo.workingHours.details.2"),
      ],
      color: "from-purple-500 to-indigo-600",
    },
  ];

  const quickActions = [
    {
      title: t("contact.quickActions.bookConsultation.title"),
      description: t("contact.quickActions.bookConsultation.description"),
      icon: Calendar,
      action: t("contact.quickActions.bookConsultation.action"),
      color: "from-orange-500 to-red-600",
    },
    {
      title: t("contact.quickActions.whatsappSupport.title"),
      description: t("contact.quickActions.whatsappSupport.description"),
      icon: MessageCircle,
      action: t("contact.quickActions.whatsappSupport.action"),
      color: "from-green-500 to-emerald-600",
    },
    {
      title: t("contact.quickActions.emergencyCare.title"),
      description: t("contact.quickActions.emergencyCare.description"),
      icon: Phone,
      action: t("contact.quickActions.emergencyCare.action"),
      color: "from-red-500 to-pink-600",
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
              <Heart className="w-4 h-4 mr-2" />
              {t("contact.badge")}
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-foreground mb-6 gradient-text">
              {t("contact.title")}
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {t("contact.subtitle")}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-secondary text-secondary-foreground border-border glass interactive">
                <CheckCircle className="w-4 h-4 mr-2" />
                24/7 Support Available
              </Badge>
              <Badge className="bg-accent text-accent-foreground border-border glass interactive">
                <Star className="w-4 h-4 mr-2" />
                4.9/5 Patient Rating
              </Badge>
              <Badge className="bg-muted text-muted-foreground border-border glass interactive">
                <User className="w-4 h-4 mr-2" />
                Expert Consultation
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-playfair font-bold text-foreground mb-4 gradient-text">
                Quick Actions
              </h2>
              <p className="text-lg text-muted-foreground">
                Choose the fastest way to connect with us
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;

                return (
                  <Card
                    key={index}
                    className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-muted/50 glass card-hover"
                  >
                    <CardContent className="p-8">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${action.color} rounded-full flex items-center justify-center mx-auto mb-6 interactive`}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-4 gradient-text">
                        {action.title}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {action.description}
                      </p>
                      <Button
                        className={`bg-gradient-to-r ${action.color} hover:opacity-90 text-white w-full interactive`}
                      >
                        {action.action}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-muted/50 to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <Card className="bg-card shadow-xl border-0 glass">
                  <CardHeader>
                    <CardTitle className="text-2xl font-playfair font-bold text-foreground gradient-text">
                      {t("contact.form.title")}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {t("contact.form.subtitle")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t("contact.form.fields.fullName")}
                          </label>
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={t(
                              "contact.form.placeholders.fullName"
                            )}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t("contact.form.fields.phoneNumber")}
                          </label>
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder={t(
                              "contact.form.placeholders.phoneNumber"
                            )}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("contact.form.fields.emailAddress")}
                        </label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder={t(
                            "contact.form.placeholders.emailAddress"
                          )}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("contact.form.fields.healthCondition")}
                        </label>
                        <Input
                          name="condition"
                          value={formData.condition}
                          onChange={handleInputChange}
                          placeholder={t(
                            "contact.form.placeholders.healthCondition"
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("contact.form.fields.message")}
                        </label>
                        <Textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder={t("contact.form.placeholders.message")}
                          rows={4}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground text-lg py-6 interactive"
                      >
                        <Send className="w-5 h-5 mr-2" />
                        {t("contact.form.submitButton")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;

                  return (
                    <Card
                      key={index}
                      className="bg-card shadow-lg border-0 glass card-hover"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div
                            className={`w-12 h-12 bg-gradient-to-r ${info.color} rounded-full flex items-center justify-center flex-shrink-0 interactive`}
                          >
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground mb-3 gradient-text">
                              {info.title}
                            </h3>
                            <div className="space-y-1">
                              {(Array.isArray(info.details)
                                ? info.details
                                : [info.details]
                              ).map((detail: string, detailIndex: number) => (
                                <p
                                  key={detailIndex}
                                  className="text-muted-foreground"
                                >
                                  {detail}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Emergency Notice */}
                <Card className="bg-gradient-to-r from-destructive/5 to-destructive/10 border-destructive/20 glass card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-destructive to-destructive/80 rounded-full flex items-center justify-center flex-shrink-0 interactive">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-destructive mb-2 gradient-text">
                          Emergency Consultation
                        </h3>
                        <p className="text-destructive/80 mb-4">
                          For urgent health concerns, our expert doctors are
                          available 24/7 for immediate consultation and
                          guidance.
                        </p>
                        <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground interactive">
                          <Phone className="w-4 h-4 mr-2" />
                          Call Emergency Line
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4 gradient-text">
              Visit Our Clinic
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Located in the heart of Chinchwad, our clinic is easily accessible
              and provides a peaceful environment for healing.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Map */}
            <div>
              <GoogleMaps
                address="Moraya Ganapati Mandir Road, Gandhi Peth, Chinchwad Gaon, Chinchwad, Pimpri-Chinchwad, Maharashtra, India"
                latitude={18.6298}
                longitude={73.7997}
                zoom={15}
                height="400px"
                showInfoWindow={true}
                clinicName="Shri Vishwamurthi Ayurvedalay"
                clinicPhone="9860370961, 7709399925"
                clinicHours="Mon-Fri: 11:45 AM – 11:30 PM"
              />
            </div>

            {/* Contact Info */}
            <div>
              <ClinicInfo
                variant="card"
                showDoctor={false}
                showTimings={true}
                showContact={true}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
