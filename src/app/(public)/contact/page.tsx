"use client";

import React, { useState, Suspense } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Loader2,
} from "lucide-react";
import { ClinicInfo } from "@/components/clinic/clinic-info";
import { GoogleMaps } from "@/components/maps/google-maps";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { CompactThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { PageTransition } from "@/components/ui/animated-wrapper";
import { LazySection } from "@/components/ui/lazy-section";
import { SectionSkeleton } from "@/lib/dynamic-imports";
import { getIconColorScheme } from "@/lib/color-palette";
import { toast } from "sonner";
import {
  useSubmitContactForm,
  useSubmitConsultationBooking,
} from "@/hooks/useNotifications";

export default function ContactPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    condition: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    reason: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleBookingInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBookingData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone number (basic validation)
  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error(
        t("contact.form.validation.nameRequired") || "Name is required"
      );
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error(
        t("contact.form.validation.emailInvalid") ||
          "Please enter a valid email address"
      );
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast.error(
        t("contact.form.validation.phoneInvalid") ||
          "Please enter a valid phone number"
      );
      return;
    }

    // Submit using React Query mutation
    submitContactFormMutation.mutate(
      {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        condition: formData.condition || undefined,
        message: formData.message,
        type: "contact",
      },
      {
        onSuccess: () => {
          // Reset form
          setFormData({
            name: "",
            email: "",
            phone: "",
            condition: "",
            message: "",
          });

          toast.success(
            t("contact.form.success.title") || "Message Sent Successfully!",
            {
              description:
                t("contact.form.success.description") ||
                "We'll get back to you soon.",
            }
          );
        },
        onError: (error: any) => {
          toast.error(
            t("contact.form.error.title") || "Failed to send message",
            {
              description:
                error?.message ||
                t("contact.form.error.description") ||
                "Please try again later.",
            }
          );
        },
      }
    );
  };

  const handleBookConsultation = () => {
    setIsBookingDialogOpen(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingData.name.trim() || !bookingData.phone.trim()) {
      toast.error(
        t("contact.booking.validation.required") ||
          "Name and phone number are required"
      );
      return;
    }

    if (!validatePhone(bookingData.phone)) {
      toast.error(
        t("contact.form.validation.phoneInvalid") ||
          "Please enter a valid phone number"
      );
      return;
    }

    // Submit using React Query mutation
    submitConsultationBookingMutation.mutate(
      {
        name: bookingData.name,
        phone: bookingData.phone,
        preferredDate: bookingData.preferredDate || undefined,
        preferredTime: bookingData.preferredTime || undefined,
        reason: bookingData.reason || undefined,
      },
      {
        onSuccess: () => {
          // Reset booking form
          setBookingData({
            name: "",
            phone: "",
            preferredDate: "",
            preferredTime: "",
            reason: "",
          });

          setIsBookingDialogOpen(false);

          toast.success(
            t("contact.booking.success.title") || "Consultation Requested!",
            {
              description:
                t("contact.booking.success.description") ||
                "We'll contact you soon to confirm your appointment.",
            }
          );
        },
        onError: (error: any) => {
          toast.error(
            t("contact.booking.error.title") ||
              "Failed to request consultation",
            {
              description:
                error?.message ||
                t("contact.booking.error.description") ||
                "Please try again later.",
            }
          );
        },
      }
    );
  };

  const handleWhatsAppSupport = () => {
    // Extract phone number from translation (first phone number)
    const firstPhoneNumber =
      t("contact.contactInfo.phoneNumbers.details.0") || "9860370961";
    const firstPhone = firstPhoneNumber.replace(/\D/g, "") || "9860370961";
    const whatsappNumber = firstPhone.startsWith("91")
      ? firstPhone
      : `91${firstPhone}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEmergencyCall = () => {
    // Extract phone number from translation (first phone number)
    const firstPhoneNumber =
      t("contact.contactInfo.phoneNumbers.details.0") || "9860370961";
    const firstPhone = firstPhoneNumber.replace(/\D/g, "") || "9860370961";
    window.location.href = `tel:+${firstPhone}`;
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
      colorScheme: getIconColorScheme("Phone"),
    },
    {
      icon: Mail,
      title: t("contact.contactInfo.emailAddresses.title"),
      details: [
        t("contact.contactInfo.emailAddresses.details.0"),
        t("contact.contactInfo.emailAddresses.details.1"),
        t("contact.contactInfo.emailAddresses.details.2"),
      ],
      colorScheme: getIconColorScheme("Mail"),
    },
    {
      icon: MapPin,
      title: t("contact.contactInfo.location.title"),
      details: [
        t("contact.contactInfo.location.details.0"),
        t("contact.contactInfo.location.details.1"),
        t("contact.contactInfo.location.details.2"),
      ],
      colorScheme: getIconColorScheme("MapPin"),
    },
    {
      icon: Clock,
      title: t("contact.contactInfo.workingHours.title"),
      details: [
        t("contact.contactInfo.workingHours.details.0"),
        t("contact.contactInfo.workingHours.details.1"),
        t("contact.contactInfo.workingHours.details.2"),
      ],
      colorScheme: getIconColorScheme("Clock"),
    },
  ];

  const quickActions = [
    {
      title: t("contact.quickActions.bookConsultation.title"),
      description: t("contact.quickActions.bookConsultation.description"),
      icon: Calendar,
      action: t("contact.quickActions.bookConsultation.action"),
      colorScheme: getIconColorScheme("Calendar"),
      onClick: handleBookConsultation,
    },
    {
      title: t("contact.quickActions.whatsappSupport.title"),
      description: t("contact.quickActions.whatsappSupport.description"),
      icon: MessageCircle,
      action: t("contact.quickActions.whatsappSupport.action"),
      colorScheme: getIconColorScheme("MessageCircle"),
      onClick: handleWhatsAppSupport,
    },
    {
      title: t("contact.quickActions.emergencyCare.title"),
      description: t("contact.quickActions.emergencyCare.description"),
      icon: Phone,
      action: t("contact.quickActions.emergencyCare.action"),
      colorScheme: getIconColorScheme("Phone"),
      onClick: handleEmergencyCall,
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/30 relative overflow-hidden">
        {/* Advanced Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Primary floating orbs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-secondary/10 to-secondary/5 dark:from-secondary/20 dark:to-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-gradient-to-r from-accent/5 to-accent/3 dark:from-accent/10 dark:to-accent/8 rounded-full blur-3xl animate-pulse delay-500"></div>

          {/* Secondary floating elements */}
          <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-gradient-to-r from-accent/20 to-accent/10 dark:from-accent/30 dark:to-accent/20 rounded-full animate-bounce-slow"></div>
          <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-gradient-to-r from-primary/15 to-primary/10 dark:from-primary/25 dark:to-primary/15 rounded-full animate-bounce-slow delay-700"></div>

          {/* Geometric patterns */}
          <div className="absolute top-20 left-20 w-32 h-32 border border-primary/10 dark:border-primary/20 rounded-full animate-spin-slow"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 border border-secondary/10 dark:border-secondary/20 rounded-full animate-spin-slow delay-1000"></div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]"></div>
        </div>

        {/* Language Switcher & Theme Switcher */}
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex gap-2">
          <LanguageSwitcher variant="compact" />
          <CompactThemeSwitcher />
        </div>

        {/* Hero Section */}
        <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden">
          {/* Section-specific background overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-6xl mx-auto text-center">
              <div className="animate-fade-in-down">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse"></div>
                  <Badge className="relative bg-gradient-to-r from-primary/20 to-primary/15 dark:from-primary/30 dark:to-primary/20 text-primary dark:text-primary-foreground border-primary/40 dark:border-primary/50 glass shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 text-sm font-semibold hover:scale-105 hover:-translate-y-1">
                    <Heart className="w-5 h-5 mr-2 animate-pulse" />
                    {t("contact.badge")}
                  </Badge>
                </div>
              </div>

              <div className="animate-fade-in-up delay-200">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur-2xl animate-pulse"></div>
                  <h1 className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-foreground mb-4 gradient-text leading-tight drop-shadow-lg">
                    {t("contact.title")}
                  </h1>
                </div>
              </div>

              <div className="animate-fade-in-up delay-400">
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 leading-relaxed max-w-3xl mx-auto drop-shadow-sm">
                  {t("contact.subtitle")}
                </p>
              </div>

              <div className="animate-fade-in-up delay-600">
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/40 text-emerald-800 dark:text-emerald-100 border-emerald-200 dark:border-emerald-700/60 glass interactive hover:scale-105 transition-all duration-300 px-3 py-2 shadow-sm hover:shadow-md dark:shadow-emerald-900/20">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t("contact.badges.support24x7")}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/40 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700/60 glass interactive hover:scale-105 transition-all duration-300 px-3 py-2 shadow-sm hover:shadow-md dark:shadow-blue-900/20">
                    <Star className="w-4 h-4 mr-2" />
                    {t("contact.badges.patientRating")}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/50 dark:to-purple-800/40 text-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-700/60 glass interactive hover:scale-105 transition-all duration-300 px-3 py-2 shadow-sm hover:shadow-md dark:shadow-purple-900/20">
                    <User className="w-4 h-4 mr-2" />
                    {t("contact.badges.expertConsultation")}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="relative py-8 sm:py-12 md:py-16 bg-gradient-to-br from-muted/30 via-background to-primary/5 dark:from-muted/40 dark:via-background dark:to-primary/10 overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8 animate-fade-in-up">
                  <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-foreground mb-3 gradient-text">
                    {t("contact.quickActions.title")}
                  </h2>
                  <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {t("contact.quickActions.subtitle")}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
                  {quickActions.map((action, index) => {
                    const IconComponent = action.icon;

                    return (
                      <div
                        key={index}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <Card className="group text-center hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-card/90 to-muted/30 dark:from-card/95 dark:to-muted/40 glass backdrop-blur-sm hover:scale-110 hover:-translate-y-3 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <CardContent className="p-4 lg:p-6">
                            <div className="relative mb-4">
                              <div
                                className={`w-14 h-14 bg-gradient-to-r ${action.colorScheme.gradient} rounded-xl flex items-center justify-center mx-auto shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}
                              >
                                <IconComponent className="w-7 h-7 text-white" />
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-3 gradient-text">
                              {action.title}
                            </h3>
                            <p className="text-muted-foreground mb-4 leading-relaxed">
                              {action.description}
                            </p>
                            <Button
                              onClick={action.onClick}
                              className={`bg-gradient-to-r ${action.colorScheme.gradient} hover:${action.colorScheme.hover} text-white w-full py-2 text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105`}
                            >
                              {action.action}
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Contact Form & Info */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="relative py-8 sm:py-12 md:py-16 bg-gradient-to-br from-background via-muted/20 to-secondary/5 dark:from-background dark:via-muted/30 dark:to-secondary/10 overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
                  {/* Contact Form */}
                  <div className="animate-fade-in-left">
                    <Card className="bg-gradient-to-br from-card/80 to-muted/20 dark:from-card/90 dark:to-muted/30 border-primary/20 dark:border-primary/30 shadow-lg dark:shadow-xl glass backdrop-blur-sm">
                      <CardHeader className="p-4 pb-3">
                        <CardTitle className="text-xl font-playfair font-bold text-foreground gradient-text mb-2">
                          {t("contact.form.title")}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t("contact.form.subtitle")}
                        </p>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <form onSubmit={handleSubmit} className="space-y-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-xs font-semibold text-foreground">
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
                                className="h-9 rounded-lg border-border/50 dark:border-border/60 focus:border-primary transition-colors duration-300"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-semibold text-foreground">
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
                                className="h-9 rounded-lg border-border/50 dark:border-border/60 focus:border-primary transition-colors duration-300"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground">
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
                              className="h-9 rounded-lg border-border/50 dark:border-border/60 focus:border-primary transition-colors duration-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground">
                              {t("contact.form.fields.healthCondition")}
                            </label>
                            <Input
                              name="condition"
                              value={formData.condition}
                              onChange={handleInputChange}
                              placeholder={t(
                                "contact.form.placeholders.healthCondition"
                              )}
                              className="h-9 rounded-lg border-border/50 dark:border-border/60 focus:border-primary transition-colors duration-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground">
                              {t("contact.form.fields.message")}
                            </label>
                            <Textarea
                              name="message"
                              value={formData.message}
                              onChange={handleInputChange}
                              placeholder={t(
                                "contact.form.placeholders.message"
                              )}
                              rows={4}
                              className="rounded-lg border-border/50 dark:border-border/60 focus:border-primary transition-colors duration-300 resize-none"
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={submitContactFormMutation.isPending}
                            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitContactFormMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t("contact.form.submitting") || "Sending..."}
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                {t("contact.form.submitButton")}
                              </>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4 animate-fade-in-right">
                    {contactInfo.map((info, index) => {
                      const IconComponent = info.icon;

                      return (
                        <div
                          key={index}
                          className="animate-fade-in-up"
                          style={{ animationDelay: `${index * 150}ms` }}
                        >
                          <Card className="group bg-gradient-to-br from-card/80 to-muted/20 dark:from-card/90 dark:to-muted/30 border-primary/20 dark:border-primary/30 shadow-md glass backdrop-blur-sm hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-4">
                                <div className="relative">
                                  <div
                                    className={`w-10 h-10 bg-gradient-to-r ${info.colorScheme.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}
                                  >
                                    <IconComponent className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-base font-bold text-foreground mb-2 gradient-text">
                                    {info.title}
                                  </h3>
                                  <div className="space-y-1">
                                    {(Array.isArray(info.details)
                                      ? info.details
                                      : [info.details]
                                    ).map(
                                      (detail: string, detailIndex: number) => (
                                        <p
                                          key={detailIndex}
                                          className="text-muted-foreground leading-relaxed"
                                        >
                                          {detail}
                                        </p>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}

                    {/* Emergency Notice */}
                    <div
                      className="animate-fade-in-up"
                      style={{
                        animationDelay: `${contactInfo.length * 150}ms`,
                      }}
                    >
                      <Card className="group bg-gradient-to-br from-destructive/10 to-destructive/5 dark:from-destructive/20 dark:to-destructive/10 border-destructive/30 dark:border-destructive/40 shadow-md glass backdrop-blur-sm hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-r from-destructive to-destructive/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                                <Phone className="w-5 h-5 text-white" />
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-r from-destructive/30 to-destructive/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-bold text-destructive mb-2 gradient-text">
                                {t("contact.emergency.title")}
                              </h3>
                              <p className="text-destructive/80 mb-3 leading-relaxed">
                                {t("contact.emergency.description")}
                              </p>
                              <Button
                                onClick={handleEmergencyCall}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 px-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 font-semibold text-xs"
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                {t("contact.emergency.action")}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Google Maps Section */}
        <LazySection fallback={<SectionSkeleton />}>
          <section className="relative py-8 sm:py-12 md:py-16 bg-gradient-to-br from-muted/20 via-background to-primary/5 dark:from-muted/30 dark:via-background dark:to-primary/10 overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 animate-fade-in-up">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 gradient-text">
                  {t("contact.visitClinic.title")}
                </h2>
                <p className="text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t("contact.visitClinic.description")}
                </p>
              </div>

              <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
                  {/* Map */}
                  <div className="animate-fade-in-left">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-2xl blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-card/80 to-muted/20 dark:from-card/90 dark:to-muted/30 border-primary/20 dark:border-primary/30 shadow-lg dark:shadow-xl glass backdrop-blur-sm rounded-2xl p-2">
                        <Suspense fallback={<SectionSkeleton />}>
                          <GoogleMaps
                            address="Moraya Ganapati Mandir Road, Gandhi Peth, Chinchwad Gaon, Chinchwad, Pimpri-Chinchwad, Maharashtra, India"
                            latitude={18.6298}
                            longitude={73.7997}
                            zoom={15}
                            height="350px"
                            showInfoWindow={true}
                            clinicName="Shri Vishwamurti Ayurvedalay"
                            clinicPhone="9860370961, 7709399925"
                            clinicHours="Mon-Fri: 11:45 AM – 11:30 PM"
                          />
                        </Suspense>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="animate-fade-in-right">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-2xl blur-xl"></div>
                      <div className="relative">
                        <ClinicInfo
                          variant="card"
                          showDoctor={false}
                          showTimings={true}
                          showContact={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* Booking Consultation Dialog */}
        <Dialog
          open={isBookingDialogOpen}
          onOpenChange={setIsBookingDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-playfair font-bold gradient-text">
                {t("contact.booking.title") || "Book a Consultation"}
              </DialogTitle>
              <DialogDescription>
                {t("contact.booking.description") ||
                  "Fill in your details and we'll contact you to confirm your appointment."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  {t("contact.form.fields.fullName") || "Full Name"} *
                </label>
                <Input
                  name="name"
                  value={bookingData.name}
                  onChange={handleBookingInputChange}
                  placeholder={
                    t("contact.form.placeholders.fullName") ||
                    "Enter your full name"
                  }
                  required
                  className="h-9 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  {t("contact.form.fields.phoneNumber") || "Phone Number"} *
                </label>
                <Input
                  name="phone"
                  type="tel"
                  value={bookingData.phone}
                  onChange={handleBookingInputChange}
                  placeholder={
                    t("contact.form.placeholders.phoneNumber") ||
                    "Enter your phone number"
                  }
                  required
                  className="h-9 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    {t("contact.booking.preferredDate") || "Preferred Date"}
                  </label>
                  <Input
                    name="preferredDate"
                    type="date"
                    value={bookingData.preferredDate}
                    onChange={handleBookingInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-9 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    {t("contact.booking.preferredTime") || "Preferred Time"}
                  </label>
                  <Input
                    name="preferredTime"
                    type="time"
                    value={bookingData.preferredTime}
                    onChange={handleBookingInputChange}
                    className="h-9 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  {t("contact.booking.reason") || "Reason for Consultation"}
                </label>
                <Textarea
                  name="reason"
                  value={bookingData.reason}
                  onChange={handleBookingInputChange}
                  placeholder={
                    t("contact.booking.reasonPlaceholder") ||
                    "Briefly describe your reason for consultation"
                  }
                  rows={3}
                  className="rounded-lg resize-none"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBookingDialogOpen(false)}
                  className="rounded-lg"
                >
                  {t("contact.booking.cancel") || "Cancel"}
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground rounded-lg"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t("contact.booking.submit") || "Request Consultation"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
