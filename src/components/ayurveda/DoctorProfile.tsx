"use client";

import React from "react";
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
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 mb-4">
            <User className="w-4 h-4 mr-2" />
            Expert Physician
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
            {t("doctor.name")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t("doctor.title")}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Doctor Info Card */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-start space-x-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-playfair font-bold text-gray-900 dark:text-white mb-2">
                      {t("doctor.name")}
                    </CardTitle>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold mb-2">
                      {t("doctor.specialization")}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4" />
                        <span>{t("doctor.experience")}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>4.9/5 Rating</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    About Dr. Deshmukh
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {t("doctor.about")}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Specializations
                    </h4>
                    <div className="space-y-2">
                      {specializations.map((spec, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {spec}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Achievements
                    </h4>
                    <div className="space-y-2">
                      {achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
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
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-orange-500 dark:text-orange-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Clinic Location
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {t("clinic.address")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Phone Numbers
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t("clinic.phone")}
                    </p>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    onClick={() => window.open("tel:+919860370961", "_self")}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* OPD Schedule */}
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  OPD Timing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opdSchedule.map((schedule, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {schedule.day}
                      </span>
                      <span
                        className={`text-sm ${
                          schedule.isOpen
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {schedule.time}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
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
