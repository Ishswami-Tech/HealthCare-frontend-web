"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PatientQueueCard } from "@/components/dashboard/PatientQueueCard";
import AppointmentManager from "@/components/appointments/AppointmentManager";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { theme } from "@/lib/utils/theme-utils";
import {
  Stethoscope,
  Leaf,
  Flame,
  Heart,
  Droplets,
  Waves,
  Wind,
  Sun,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PatientPageShell, PatientPageHeader } from "@/components/patient/PatientPageShell";

interface TreatmentCategory {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  containerClass: string;
  iconClass: string;
}

const TREATMENT_CATEGORIES: TreatmentCategory[] = [
  {
    icon: Stethoscope,
    title: "Consultations",
    description: "General health assessment and follow-ups",
    containerClass: theme.containers.featureBlue,
    iconClass: theme.iconColors.blue,
  },
  {
    icon: Droplets,
    title: "Panchakarma",
    description: "Detox and rejuvenation therapies",
    containerClass: theme.containers.featureGreen,
    iconClass: theme.iconColors.emerald,
  },
  {
    icon: Heart,
    title: "Diagnosis",
    description: "Nadi Pariksha and dosha analysis",
    containerClass: theme.containers.featureBlue,
    iconClass: theme.iconColors.blue,
  },
  {
    icon: Flame,
    title: "Specialized",
    description: "Agnikarma, Viddhakarma procedures",
    containerClass: theme.containers.featureGreen,
    iconClass: theme.iconColors.emerald,
  },
];

/**
 * Patient Appointments Page.
 *
 * This page serves as a central hub for patients to manage their health journey.
 * It provides categorized appointment booking, real-time queue status,
 * and a simplified overview of Ayurvedic treatments.
 */
export default function PatientAppointments() {
  const searchParams = useSearchParams();
  const queryClinicId = searchParams.get("clinicId") || undefined;
  const queryLocationId = searchParams.get("locationId") || undefined;
  const queryClinicName = searchParams.get("clinicName") || undefined;

  // Clear query parameters from URL to keep it clean, without triggering a re-render
  useEffect(() => {
    if (queryClinicId || queryLocationId || queryClinicName) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [queryClinicId, queryLocationId, queryClinicName]);

  return (
    <DashboardLayout title="My Appointments">
      <PatientPageShell>

        {/* Page Header — matches screenshot: eyebrow + title + Book CTA */}
        <PatientPageHeader
          eyebrow="MY APPOINTMENTS"
          title="My Appointments"
          description="Book and manage your in-person and virtual health appointments."
          actionsSlot={
            <BookAppointmentDialog
              {...(queryClinicId && { clinicId: queryClinicId })}
              {...(queryLocationId && { locationId: queryLocationId })}
              {...(queryClinicName && { clinicName: queryClinicName })}
              defaultOpen={!!queryClinicId}
            />
          }
        />

        {/* Real-time Queue Status */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <PatientQueueCard />
        </div>

        {/* AppointmentManager — rendered directly, has its own internal header */}
        <AppointmentManager hideBookButton={true} />

        {/* Ayurveda Treatment Categories — quick-book cards */}
        <Card className="border-l-4 border-l-amber-400 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-amber-600" />
              </div>
              Ayurvedic Treatment Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {TREATMENT_CATEGORIES.map(({ icon: Icon, title, description, containerClass, iconClass }) => (
                <div key={title} className={`p-4 rounded-xl border ${containerClass} transition-all hover:shadow-md`}>
                  <Icon className={`w-8 h-8 ${iconClass} mb-3`} />
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className={`text-sm ${theme.textColors.secondary} mb-3`}>{description}</p>
                  <BookAppointmentDialog
                    trigger={
                      <Button variant="outline" size="sm" className="w-full border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300">
                        Book Now
                      </Button>
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Treatment Information */}
        <Card className="border-l-4 border-l-blue-400 shadow-sm">
          <CardHeader>
            <CardTitle>
              Understanding Ayurvedic Treatments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Traditional Therapies</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Droplets
                      className={`w-5 h-5 ${theme.iconColors.cyan} mt-0.5`}
                    />
                    <div>
                      <h5 className="font-medium">Panchakarma</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Five-action detoxification process including Vamana,
                        Virechana, Basti, Nasya, and Raktamokshana
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Waves
                      className={`w-5 h-5 ${theme.iconColors.cyan} mt-0.5`}
                    />
                    <div>
                      <h5 className="font-medium">Shirodhara</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Continuous pouring of medicated oils on forehead for
                        stress relief and mental clarity
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Wind
                      className={`w-5 h-5 ${theme.iconColors.blue} mt-0.5`}
                    />
                    <div>
                      <h5 className="font-medium">Abhyanga</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Full-body therapeutic massage with warm herbal oils to
                        improve circulation and flexibility
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Diagnostic Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Heart
                      className={`w-5 h-5 ${theme.iconColors.red} mt-0.5`}
                    />
                    <div>
                      <h5 className="font-medium">Nadi Pariksha</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Pulse diagnosis to assess dosha imbalances and overall
                        health status
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Leaf
                      className={`w-5 h-5 ${theme.iconColors.green} mt-0.5`}
                    />
                    <div>
                      <h5 className="font-medium">Prakriti Analysis</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Constitutional assessment to determine individual body
                        type and treatment approach
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sun
                      className={`w-5 h-5 ${theme.iconColors.yellow} mt-0.5`}
                    />
                    <div>
                      <h5 className="font-medium">Vikriti Assessment</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Current health imbalances and deviation from natural
                        constitution
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PatientPageShell>
    </DashboardLayout>
  );
}
