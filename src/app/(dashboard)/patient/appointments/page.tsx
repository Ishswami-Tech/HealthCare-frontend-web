"use client";

import { useSearchParams } from "next/navigation";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import AppointmentManager from "@/components/appointments/AppointmentManager";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { theme } from "@/lib/utils/theme-utils";
import {
  Activity,
  Leaf,
  Flame,
  Heart,
  Droplets,
  Waves,
  Wind,
  Sun,
} from "lucide-react";

export default function PatientAppointments() {
  const searchParams = useSearchParams();
  const queryClinicId = searchParams.get("clinicId") || undefined;
  const queryLocationId = searchParams.get("locationId") || undefined;

  return (
    <DashboardLayout title="Patient Appointments" allowedRole={Role.PATIENT}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Appointments</h1>

          {/* ✅ Single reusable BookAppointmentDialog */}
          <BookAppointmentDialog
            {...(queryClinicId && { clinicId: queryClinicId })}
            {...(queryLocationId && { locationId: queryLocationId })}
            defaultOpen={!!queryClinicId}
          />
        </div>

        {/* Existing AppointmentManager Component */}
        <Card>
          <CardHeader>
            <CardTitle>Current Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentManager />
          </CardContent>
        </Card>

        {/* Ayurveda Treatment Categories — quick-book cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5" />
              Ayurvedic Treatment Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 transition-all hover:shadow-md">
                <Activity className={`w-8 h-8 ${theme.iconColors.blue} mb-3`} />
                <h3 className="font-semibold mb-2">Consultations</h3>
                <p className={`text-sm ${theme.textColors.secondary} mb-3`}>
                  General health assessment and follow-ups
                </p>
                <BookAppointmentDialog
                  trigger={
                    <Button variant="outline" size="sm" className="w-full">
                      Book Now
                    </Button>
                  }
                />
              </div>

              <div className="p-4 rounded-xl bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 transition-all hover:shadow-md">
                <Droplets className={`w-8 h-8 ${theme.iconColors.green} mb-3`} />
                <h3 className="font-semibold mb-2">Panchakarma</h3>
                <p className={`text-sm ${theme.textColors.secondary} mb-3`}>
                  Detox and rejuvenation therapies
                </p>
                <BookAppointmentDialog
                  trigger={
                    <Button variant="outline" size="sm" className="w-full">
                      Book Now
                    </Button>
                  }
                />
              </div>

              <div className="p-4 rounded-xl bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 transition-all hover:shadow-md">
                <Heart className={`w-8 h-8 ${theme.iconColors.purple} mb-3`} />
                <h3 className="font-semibold mb-2">Diagnosis</h3>
                <p className={`text-sm ${theme.textColors.secondary} mb-3`}>
                  Nadi Pariksha and dosha analysis
                </p>
                <BookAppointmentDialog
                  trigger={
                    <Button variant="outline" size="sm" className="w-full">
                      Book Now
                    </Button>
                  }
                />
              </div>

              <div className="p-4 rounded-xl bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 transition-all hover:shadow-md">
                <Flame className={`w-8 h-8 ${theme.iconColors.orange} mb-3`} />
                <h3 className="font-semibold mb-2">Specialized</h3>
                <p className={`text-sm ${theme.textColors.secondary} mb-3`}>
                  Agnikarma, Viddhakarma procedures
                </p>
                <BookAppointmentDialog
                  trigger={
                    <Button variant="outline" size="sm" className="w-full">
                      Book Now
                    </Button>
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Understanding Ayurvedic Treatments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Traditional Therapies</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Droplets className={`w-5 h-5 ${theme.iconColors.cyan} mt-0.5`} />
                    <div>
                      <h5 className="font-medium">Panchakarma</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Five-action detoxification process including Vamana, Virechana, Basti,
                        Nasya, and Raktamokshana
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Waves className={`w-5 h-5 ${theme.iconColors.indigo} mt-0.5`} />
                    <div>
                      <h5 className="font-medium">Shirodhara</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Continuous pouring of medicated oils on forehead for stress relief and
                        mental clarity
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Wind className={`w-5 h-5 ${theme.iconColors.purple} mt-0.5`} />
                    <div>
                      <h5 className="font-medium">Abhyanga</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Full-body therapeutic massage with warm herbal oils to improve circulation
                        and flexibility
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Diagnostic Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Heart className={`w-5 h-5 ${theme.iconColors.red} mt-0.5`} />
                    <div>
                      <h5 className="font-medium">Nadi Pariksha</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Pulse diagnosis to assess dosha imbalances and overall health status
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Leaf className={`w-5 h-5 ${theme.iconColors.green} mt-0.5`} />
                    <div>
                      <h5 className="font-medium">Prakriti Analysis</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Constitutional assessment to determine individual body type and treatment
                        approach
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sun className={`w-5 h-5 ${theme.iconColors.yellow} mt-0.5`} />
                    <div>
                      <h5 className="font-medium">Vikriti Assessment</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Current health imbalances and deviation from natural constitution
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
