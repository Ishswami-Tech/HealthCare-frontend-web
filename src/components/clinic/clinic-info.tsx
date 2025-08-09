"use client";

import React from "react";
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  User,
  Award,
  GraduationCap,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface ClinicInfoProps {
  className?: string;
  variant?: "full" | "compact" | "card";
  showDoctor?: boolean;
  showTimings?: boolean;
  showContact?: boolean;
}

export function ClinicInfo({
  className,
  variant = "full",
  showDoctor = true,
  showTimings = true,
  showContact = true,
}: ClinicInfoProps) {
  const { t } = useTranslation();

  const clinicData = {
    name: t("clinic.name"),
    address: t("clinic.address"),
    phone: t("clinic.phone"),
    whatsapp: t("clinic.whatsapp"),
    email: t("clinic.email"),
    timings: {
      weekdays: t("clinic.mondayToFriday"),
      weekends: `${t("clinic.weekends")}: ${t("clinic.closed")}`,
    },
    doctor: {
      name: t("doctor.name"),
      title: t("doctor.title"),
      specialization: t("doctor.specialization"),
      experience: t("doctor.experience"),
      education: t("doctor.education"),
      expertise: t("doctor.expertise"),
      about: t("doctor.about"),
    },
  };

  if (variant === "compact") {
    return (
      <div className={cn("space-y-4", className)}>
        {showContact && (
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{clinicData.phone}</p>
              <p className="text-sm text-gray-600">Call for appointment</p>
            </div>
          </div>
        )}

        {showTimings && (
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">
                {clinicData.timings.weekdays}
              </p>
              <p className="text-sm text-gray-600">
                {clinicData.timings.weekends}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{clinicData.name}</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {clinicData.address}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden",
          className
        )}
      >
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <h2 className="text-xl font-bold mb-2">{clinicData.name}</h2>
          <p className="text-green-100 text-sm">
            {clinicData.doctor.specialization}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {showDoctor && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                {t("doctor.title")}
              </h3>
              <div className="space-y-2">
                <p className="font-medium text-lg text-gray-900">
                  {clinicData.doctor.name}
                </p>
                <p className="text-green-600 font-medium">
                  {clinicData.doctor.specialization}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Award className="w-4 h-4" />
                  <span>{clinicData.doctor.experience}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  <span>{clinicData.doctor.education}</span>
                </div>
              </div>
            </div>
          )}

          {showTimings && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                {t("clinic.timings")}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium text-gray-900">
                    11:45 AM - 11:30 PM
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Saturday & Sunday</span>
                  <span className="font-medium text-red-600">
                    {t("clinic.closed")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {showContact && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">{clinicData.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">{clinicData.email}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-gray-700 text-sm leading-relaxed">
                    {clinicData.address}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn("space-y-8", className)}>
      {/* Clinic Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {clinicData.name}
        </h1>
        <p className="text-lg text-green-600 font-medium">
          {clinicData.doctor.specialization}
        </p>
      </div>

      {/* Doctor Information */}
      {showDoctor && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-green-600" />
            Meet Our Doctor
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {clinicData.doctor.name}
              </h3>
              <p className="text-green-600 font-medium mb-3">
                {clinicData.doctor.title}
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">
                    {clinicData.doctor.experience}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">
                    {clinicData.doctor.education}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Specialization
              </h4>
              <p className="text-gray-700 mb-3">
                {clinicData.doctor.expertise}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                {clinicData.doctor.about}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contact & Timings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        {showContact && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-6 h-6 text-green-600" />
              Contact Information
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {clinicData.phone}
                  </p>
                  <p className="text-sm text-gray-600">Call for appointment</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {clinicData.email}
                  </p>
                  <p className="text-sm text-gray-600">Email us your queries</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">Visit Us</p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {clinicData.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clinic Timings */}
        {showTimings && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-green-600" />
              {t("clinic.timings")}
            </h2>

            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">
                    Monday - Friday
                  </span>
                  <span className="text-green-600 font-semibold">Open</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  11:45 AM - 11:30 PM
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">
                    Saturday & Sunday
                  </span>
                  <span className="text-red-600 font-semibold">
                    {t("clinic.closed")}
                  </span>
                </div>
                <p className="text-gray-600">{t("clinic.emergency")}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              Emergency Contact
            </h3>
            <p className="text-blue-800 text-sm">
              For urgent medical consultations outside clinic hours, please call
              directly at{" "}
              <span className="font-medium">
                {clinicData.phone.split(",")[0].trim()}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
