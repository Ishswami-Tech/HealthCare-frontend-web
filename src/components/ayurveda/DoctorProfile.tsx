"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Award,
  Clock,
  MapPin,
  Phone,
  Calendar,
  Star,
  GraduationCap,
  Stethoscope,
  Heart,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

const DoctorProfile = () => {
  const { t } = useTranslation();

  const opdSchedule = [
    { day: "Monday", time: "11:45 AM – 11:30 PM", isOpen: true },
    { day: "Tuesday", time: "11:45 AM – 11:30 PM", isOpen: true },
    {
      day: "Wednesday",
      time: "11:45 AM – 11:30 PM",
      isOpen: true,
    },
    { day: "Thursday", time: "11:45 AM – 11:30 PM", isOpen: true },
    { day: "Friday", time: "11:45 AM – 11:30 PM", isOpen: true },
    { day: "Saturday", time: "Closed", isOpen: false },
    { day: "Sunday", time: "Closed", isOpen: false },
  ];

  const specializations = [
    "Viddhakarma Specialist",
    "Agnikarma Expert",
    "Panchakarma Practitioner",
    "Neurological Disorders",
    "Autism Treatment",
    "Cerebral Palsy Care",
    "Mental Health Disorders",
  ];

  const achievements = [
    "Student of Dr. R.B. Gogate",
    "15+ Years Experience",
    "5000+ Patients Treated",
    "Government Certified",
    "Research Contributor",
    "Pediatric Specialist",
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            <User className="size-4 mr-2" />
            Expert Physician
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-semibold text-foreground mb-4">
            {t("doctor.name")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t("doctor.title")}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Doctor Info Card */}
          <div className="lg:col-span-2">
            <Card className="bg-card shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-start gap-x-6">
                  <div className="size-24 bg-primary rounded-full flex items-center justify-center">
                    <Stethoscope className="size-12 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-playfair font-bold text-card-foreground mb-2">
                      {t("doctor.name")}
                    </CardTitle>
                    <p className="text-primary font-semibold mb-2">
                      {t("doctor.specialization")}
                    </p>
                    <div className="flex items-center gap-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-x-1">
                        <Award className="size-4" />
                        <span>{t("doctor.experience")}</span>
                      </div>
                      <div className="flex items-center gap-x-1">
                        <Star className="size-4 text-primary" />
                        <span>4.9/5 Rating</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-3">
                    About Dr. Deshmukh
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t("doctor.about")}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-card-foreground mb-3 flex items-center">
                      <GraduationCap className="size-4 mr-2" />
                      Specializations
                    </h4>
                    <div className="gap-y-2">
                      {specializations.map((spec) => (
                        <div
                          key={spec}
                          className="flex items-center gap-x-2"
                        >
                          <CheckCircle className="size-4 text-primary flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {spec}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-card-foreground mb-3 flex items-center">
                      <Award className="size-4 mr-2" />
                      Achievements
                    </h4>
                    <div className="gap-y-2">
                      {achievements.map((achievement) => (
                        <div
                          key={achievement}
                          className="flex items-center gap-x-2"
                        >
                          <Star className="size-4 text-primary flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {achievement}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Schedule Card */}
          <div className="gap-y-6">
            {/* Contact Info */}
            <Card className="bg-card shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-card-foreground flex items-center">
                  <Phone className="size-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="gap-y-4">
                <div className="flex items-start gap-x-3">
                  <MapPin className="size-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-card-foreground">
                      Clinic Location
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("clinic.address")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-x-3">
                  <Phone className="size-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-card-foreground">
                      Phone Numbers
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("clinic.phone")}
                    </p>
                  </div>
                </div>

                <div className="pt-4 gap-y-2">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => window.open("tel:+919860370961", "_self")}
                  >
                    <Phone className="size-4 mr-2" />
                    Call Now
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      window.location.href = "/patient/appointments";
                    }}
                  >
                    <Calendar className="size-4 mr-2" />
                    Book Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* OPD Schedule */}
            <Card className="bg-card shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-card-foreground flex items-center">
                  <Clock className="size-5 mr-2" />
                  OPD Timing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="gap-y-3">
                  {opdSchedule.map((schedule) => (
                    <div
                      key={`${schedule.day}-${schedule.time}`}
                      className="flex justify-between items-center py-2 border-b border-border last:border-b-0"
                    >
                      <span className="font-medium text-card-foreground">
                        {schedule.day}
                      </span>
                      <span
                        className={`text-sm ${
                          schedule.isOpen ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {schedule.time}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary flex items-center">
                    <Heart className="size-4 mr-2" />
                    Emergency consultations available 24/7
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

export default DoctorProfile;

