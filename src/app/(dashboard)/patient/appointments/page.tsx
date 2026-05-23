"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { useAuth } from "@/hooks/auth/useAuth";
import { PatientQueueCard } from "@/components/dashboard/PatientQueueCard";
import AppointmentManager from "@/components/appointments/AppointmentManager";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { usePatientUiStore } from "@/stores/patient-ui.store";
import {
  DashboardPageHeader as PatientPageHeader,
  DashboardPageShell as PatientPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { theme } from "@/lib/utils/theme-utils";
import { Leaf, Droplets, Waves, Wind, Heart, Sun, Stethoscope, QrCode, BookOpen } from "lucide-react";
import { normalizeAppointmentStatus } from "@/lib/utils/appointmentUtils";

interface TreatmentCategory {
  icon: ComponentType<{ className?: string }>;
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
    icon: Leaf,
    title: "Specialized",
    description: "Agnikarma, Viddhakarma procedures",
    containerClass: theme.containers.featureGreen,
    iconClass: theme.iconColors.emerald,
  },
];

function PatientAppointmentsContent() {
  const { push } = useRouter();
  const { session } = useAuth();
  useWebSocketQuerySync();
  const searchParams = useSearchParams();
  const getSearchParam = useMemo(() => searchParams.get.bind(searchParams), [searchParams]);
  const queryClinicId = getSearchParam("clinicId") || undefined;
  const queryLocationId = getSearchParam("locationId") || undefined;
  const queryClinicName = getSearchParam("clinicName") || undefined;
  const bookingMode = getSearchParam("mode");
  const shouldOpenBooking = getSearchParam("openBooking") === "1";
  const defaultConsultationMode =
    bookingMode?.toUpperCase() === "VIDEO" ? "VIDEO" : undefined;
  const sessionClinicId = session?.user?.clinicId || "";
  const resolvedClinicId = queryClinicId || sessionClinicId || undefined;
  const {
    data: appointmentsData,
    isPending: isPendingAppointments,
    isFetching: isFetchingAppointments,
    refetch: refetchAppointments,
  } = useMyAppointments(
    resolvedClinicId ? { clinicId: resolvedClinicId } : undefined
  );
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const openQrGate = usePatientUiStore((state) => state.openQrGate);
  const hasInPersonAppointment = useMemo(() => {
    const appointments = Array.isArray((appointmentsData as any)?.appointments)
      ? (appointmentsData as any).appointments
      : Array.isArray(appointmentsData)
        ? appointmentsData
        : [];

    return appointments.some((appointment: any) => {
      const status = normalizeAppointmentStatus(appointment?.status);
      const type = String(appointment?.type || appointment?.appointmentType || "").toUpperCase();
      return (
        type === "IN_PERSON" &&
        status !== "CANCELLED" &&
        status !== "COMPLETED" &&
        status !== "NO_SHOW"
      );
    });
  }, [appointmentsData]);

  useEffect(() => {
    if (shouldOpenBooking) {
      setIsBookingDialogOpen(true);
    }

    if (queryClinicId || queryLocationId || queryClinicName || bookingMode || shouldOpenBooking) {
      document.getElementById("appointment-manager")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [queryClinicId, queryLocationId, queryClinicName, bookingMode, shouldOpenBooking]);

  return (
    <DashboardLayout title="Appointments">
      <PatientPageShell>
        <PatientPageHeader
          eyebrow="APPOINTMENTS"
          title="Appointments"
          description="Book a visit, check in, and follow your queue in one place."
          actionsSlot={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-xl border-sky-200 bg-sky-50 px-4 text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-300"
                onClick={() => {
                  if (hasInPersonAppointment) {
                    push("/patient/check-in");
                    return;
                  }
                  openQrGate({
                    onBookAppointment: () => setIsBookingDialogOpen(true),
                  });
                }}
              >
                <QrCode className="size-4" />
                Scan QR
              </Button>
              <Button
                className="h-10 gap-2 rounded-xl border-0 bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700"
                onClick={() => setIsBookingDialogOpen(true)}
              >
                <BookOpen className="size-4" />
                Book Appointment
              </Button>
            </div>
          }
        />

        <BookAppointmentDialog
          open={isBookingDialogOpen}
          onOpenChange={setIsBookingDialogOpen}
          hideTrigger
          {...(defaultConsultationMode ? { initialConsultationMode: defaultConsultationMode } : {})}
          {...(resolvedClinicId ? { clinicId: resolvedClinicId } : {})}
          {...(queryLocationId ? { locationId: queryLocationId } : {})}
          {...(queryClinicName ? { clinicName: queryClinicName } : {})}
          onBooked={() => setIsBookingDialogOpen(false)}
        />

        <div id="patient-queue-status" className="animate-in fade-in slide-in-from-top-4 duration-500">
          <PatientQueueCard
            appointmentsData={appointmentsData}
            isAppointmentsPending={isPendingAppointments}
            onBookAppointment={() => setIsBookingDialogOpen(true)}
          />
        </div>

        <div id="appointment-manager">
          <AppointmentManager
            hideBookButton
            autoOpenBookDialog={shouldOpenBooking}
            appointmentsData={appointmentsData}
            isAppointmentsPending={isPendingAppointments || isFetchingAppointments}
            onRefreshAppointments={async () => {
              await refetchAppointments();
            }}
            {...(defaultConsultationMode ? { defaultConsultationMode } : {})}
            {...(resolvedClinicId ? { clinicId: resolvedClinicId } : {})}
          />
        </div>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex size-7 items-center justify-center rounded-lg border border-amber-100 bg-amber-50">
                <Leaf className="size-4 text-amber-600" />
              </div>
              Ayurvedic Treatment Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {TREATMENT_CATEGORIES.map(({ icon: Icon, title, description, containerClass, iconClass }) => (
                <div key={title} className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${containerClass}`}>
                  <Icon className={`mb-3 size-8 ${iconClass}`} />
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className={`mb-3 text-sm ${theme.textColors.secondary}`}>{description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
                    onClick={() =>
                      document
                        .getElementById("appointment-manager")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  >
                    Use Booking Manager
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Understanding Ayurvedic Treatments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="gap-y-4">
                <h4 className="text-lg font-semibold">Traditional Therapies</h4>
                <div className="gap-y-3">
                  <div className="flex items-start gap-3">
                    <Droplets className={`mt-0.5 size-5 ${theme.iconColors.cyan}`} />
                    <div>
                      <h5 className="font-medium">Panchakarma</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Five-action detoxification process including Vamana, Virechana, Basti, Nasya, and Raktamokshana
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Waves className={`mt-0.5 size-5 ${theme.iconColors.cyan}`} />
                    <div>
                      <h5 className="font-medium">Shirodhara</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Continuous pouring of medicated oils on forehead for stress relief and mental clarity
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Wind className={`mt-0.5 size-5 ${theme.iconColors.blue}`} />
                    <div>
                      <h5 className="font-medium">Abhyanga</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Full-body therapeutic massage with warm herbal oils to improve circulation and flexibility
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="gap-y-4">
                <h4 className="text-lg font-semibold">Diagnostic Methods</h4>
                <div className="gap-y-3">
                  <div className="flex items-start gap-3">
                    <Heart className={`mt-0.5 size-5 ${theme.iconColors.red}`} />
                    <div>
                      <h5 className="font-medium">Nadi Pariksha</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Pulse diagnosis to assess dosha imbalances and overall health status
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Leaf className={`mt-0.5 size-5 ${theme.iconColors.green}`} />
                    <div>
                      <h5 className="font-medium">Prakriti Analysis</h5>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Constitutional assessment to determine individual body type and treatment approach
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sun className={`mt-0.5 size-5 ${theme.iconColors.yellow}`} />
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

      </PatientPageShell>
    </DashboardLayout>
  );
}

export default function PatientAppointments() {
  return (
    <Suspense fallback={null}>
      <PatientAppointmentsContent />
    </Suspense>
  );
}


