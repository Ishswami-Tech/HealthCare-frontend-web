"use client";

import { nowIso } from "@/lib/utils/date-time";
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
import { getIconColorScheme } from "@/lib/config/color-palette";
import { APP_CONFIG } from "@/lib/config/config";
import {
  useSubmitContactForm,
  useSubmitConsultationBooking,
} from "@/hooks/query/useCommunication";
import {
  showSuccessToast,
  showErrorToast,
  TOAST_IDS,
} from "@/hooks/utils/use-toast";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";

export default function ContactPage() {
  const { t } = useTranslation();
  const clinicName = APP_CONFIG.CLINIC.APP_NAME;
  const submitContactFormMutation = useSubmitContactForm();
  const submitConsultationBookingMutation = useSubmitConsultationBooking();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    condition: "",
    message: "",
  });
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showErrorToast(
        t("contact.form.validation.nameRequired") || "Name is required",
        { id: TOAST_IDS.CONTACT.SUBMIT }
      );
      return;
    }

    if (!validateEmail(formData.email)) {
      showErrorToast(
        t("contact.form.validation.emailInvalid") ||
          "Please enter a valid email address",
        { id: TOAST_IDS.CONTACT.SUBMIT }
      );
      return;
    }

    if (!validatePhone(formData.phone)) {
      showErrorToast(
        t("contact.form.validation.phoneInvalid") ||
          "Please enter a valid phone number",
        { id: TOAST_IDS.CONTACT.SUBMIT }
      );
      return;
    }

    submitContactFormMutation.mutate(
      {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        ...(formData.condition && { condition: formData.condition }),
        message: formData.message,
        type: "contact",
      },
      {
        onSuccess: () => {
          setFormData({
            name: "",
            email: "",
            phone: "",
            condition: "",
            message: "",
          });

          showSuccessToast(
            t("contact.form.success.title") || "Message Sent Successfully!",
            {
              id: TOAST_IDS.CONTACT.SUBMIT,
              description:
                t("contact.form.success.description") ||
                "We'll get back to you soon.",
            }
          );
        },
        onError: (error: any) => {
          showErrorToast(
            sanitizeErrorMessage(error) || "Failed to send message",
            {
              id: TOAST_IDS.CONTACT.SUBMIT,
              description:
                t("contact.form.error.title") || "Failed to send message",
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
      showErrorToast(
        t("contact.booking.validation.required") ||
          "Name and phone number are required",
        { id: TOAST_IDS.CONTACT.SUBMIT }
      );
      return;
    }

    if (!validatePhone(bookingData.phone)) {
      showErrorToast(
        t("contact.form.validation.phoneInvalid") ||
          "Please enter a valid phone number",
        { id: TOAST_IDS.CONTACT.SUBMIT }
      );
      return;
    }

    submitConsultationBookingMutation.mutate(
      {
        name: bookingData.name,
        phone: bookingData.phone,
        ...(bookingData.preferredDate && {
          preferredDate: bookingData.preferredDate,
        }),
        ...(bookingData.preferredTime && {
          preferredTime: bookingData.preferredTime,
        }),
        ...(bookingData.reason && { reason: bookingData.reason }),
      },
      {
        onSuccess: () => {
          setBookingData({
            name: "",
            phone: "",
            preferredDate: "",
            preferredTime: "",
            reason: "",
          });
          setIsBookingDialogOpen(false);

          showSuccessToast(
            t("contact.booking.success.title") || "Consultation Requested!",
            {
              id: TOAST_IDS.CONTACT.SUBMIT,
              description:
                t("contact.booking.success.description") ||
                "We'll contact you soon to confirm your appointment.",
            }
          );
        },
        onError: (error: any) => {
          showErrorToast(
            t("contact.booking.error.title") ||
              "Failed to request consultation",
            {
              id: TOAST_IDS.CONTACT.SUBMIT,
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
    const firstPhoneNumber =
      t("contact.contactInfo.phoneNumbers.details.0") || "9860370961";
    const firstPhone = firstPhoneNumber.replace(/\D/g, "") || "9860370961";
    const whatsappNumber = firstPhone.startsWith("91")
      ? firstPhone
      : `91${firstPhone}`;
    window.open(`https://wa.me/${whatsappNumber}`, "_blank");
  };

  const handleEmergencyCall = () => {
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
      <div className="min-h-screen bg-background text-foreground">
        <div className="fixed right-3 top-3 z-50 flex gap-2 sm:right-4 sm:top-4">
          <LanguageSwitcher variant="compact" />
          <CompactThemeSwitcher />
        </div>

        <section className="relative overflow-hidden border-b border-border/70 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.34)_100%)] py-16 sm:py-20 lg:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_34%),radial-gradient(circle_at_bottom_right,hsl(var(--secondary)/0.08),transparent_32%)]" />
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <Badge className="mb-6 border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-none">
                  <Heart className="mr-2 h-4 w-4" />
                  {t("contact.badge")}
                </Badge>
                <h1 className="max-w-5xl font-playfair text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  {t("contact.title")}
                </h1>
                <p className="mt-6 max-w-4xl text-base leading-8 text-muted-foreground sm:text-lg lg:text-xl">
                  {t("contact.subtitle")}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="inline-flex items-center rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    {t("contact.badges.support24x7")}
                  </div>
                  <div className="inline-flex items-center rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm">
                    <Star className="mr-2 h-4 w-4 text-primary" />
                    {t("contact.badges.patientRating")}
                  </div>
                  <div className="inline-flex items-center rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm">
                    <User className="mr-2 h-4 w-4 text-primary" />
                    {t("contact.badges.expertConsultation")}
                  </div>
                </div>
              </div>

              <Card className="border-border/70 bg-card/96 shadow-[0_28px_90px_-56px_rgba(15,23,42,0.45)]">
                <CardContent className="p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {t("contact.quickActions.title")}
                  </p>
                  <div className="mt-5 space-y-3">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.title}
                          type="button"
                          onClick={action.onClick}
                          className="flex w-full items-center gap-4 rounded-2xl border border-border/70 bg-muted/25 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/40"
                        >
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${action.colorScheme.gradient}`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {action.title}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {action.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <LazySection fallback={<SectionSkeleton />}>
          <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_0.92fr]">
                <Card className="border-border/70 bg-card shadow-sm">
                  <CardHeader className="p-6 pb-2 sm:p-8 sm:pb-2">
                    <CardTitle className="font-playfair text-2xl font-bold">
                      {t("contact.form.title")}
                    </CardTitle>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {t("contact.form.subtitle")}
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 pt-4 sm:p-8 sm:pt-5">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-foreground">
                            {t("contact.form.fields.fullName")}
                          </label>
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={t("contact.form.placeholders.fullName")}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-foreground">
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
                          placeholder={t("contact.form.placeholders.message")}
                          rows={5}
                          className="resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={submitContactFormMutation.isPending}
                        className="w-full"
                      >
                        {submitContactFormMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("contact.form.submitting") || "Sending..."}
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            {t("contact.form.submitButton")}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {contactInfo.map((info) => {
                    const Icon = info.icon;

                    return (
                      <Card
                        key={info.title}
                        className="border-border/70 bg-card shadow-sm"
                      >
                        <CardContent className="flex gap-4 p-5">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${info.colorScheme.gradient}`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-foreground">
                              {info.title}
                            </h3>
                            <div className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
                              {info.details.map((detail) => (
                                <p key={detail}>{detail}</p>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  <Card className="border-destructive/25 bg-destructive/[0.06] shadow-sm">
                    <CardContent className="flex gap-4 p-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-destructive">
                          {t("contact.emergency.title")}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-destructive/85">
                          {t("contact.emergency.description")}
                        </p>
                        <Button
                          onClick={handleEmergencyCall}
                          className="mt-4 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          {t("contact.emergency.action")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        <LazySection fallback={<SectionSkeleton />}>
          <section className="border-t border-border/70 bg-muted/25 py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <div className="max-w-3xl">
                  <h2 className="font-playfair text-3xl font-bold sm:text-4xl">
                    {t("contact.visitClinic.title")}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
                    {t("contact.visitClinic.description")}
                  </p>
                </div>

                <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="overflow-hidden rounded-3xl border border-border/70 bg-card p-2 shadow-sm">
                    <Suspense fallback={<SectionSkeleton />}>
                      <GoogleMaps
                        address="Moraya Ganapati Mandir Road, Gandhi Peth, Chinchwad Gaon, Chinchwad, Pimpri-Chinchwad, Maharashtra, India"
                        latitude={18.6298}
                        longitude={73.7997}
                        zoom={15}
                        height="380px"
                        showInfoWindow={true}
                        clinicName={clinicName}
                        clinicPhone="9860370961, 7709399925"
                        clinicHours="Mon-Fri: 11:45 AM - 11:30 PM"
                      />
                    </Suspense>
                  </div>

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
        </LazySection>

        <Dialog
          open={isBookingDialogOpen}
          onOpenChange={setIsBookingDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-playfair text-xl font-bold">
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
                    min={nowIso().split("T")[0]}
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
                  className="resize-none"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBookingDialogOpen(false)}
                >
                  {t("contact.booking.cancel") || "Cancel"}
                </Button>
                <Button type="submit">
                  <Calendar className="mr-2 h-4 w-4" />
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
