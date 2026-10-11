"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import AppointmentManager from "@/components/appointments/AppointmentManager";
import type { ManagerVisitFocus } from "@/components/appointments/manager/types";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { DashboardPageShell as PatientPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageHead } from "@/components/tbd";
import { Button } from "@/components/ui/button";
import { useMyAppointments, hasAppointmentsLoadedForSession } from "@/hooks/query/useAppointments";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { APP_CONFIG } from "@/lib/config/config";

function PatientAppointmentsContent() {
  useWebSocketQuerySync();
  const searchParams = useSearchParams();
  const getSearchParam = useMemo(() => searchParams.get.bind(searchParams), [searchParams]);
  const queryClinicId = getSearchParam("clinicId") || undefined;
  const queryLocationId = getSearchParam("locationId") || undefined;
  const queryClinicName = getSearchParam("clinicName") || undefined;
  const bookingMode = getSearchParam("mode");
  const shouldOpenBooking = getSearchParam("openBooking") === "1";
  // `?tab=past` / `?tab=cancelled` open that list (Home links "Past visits" here).
  const tabParam = (getSearchParam("tab") || "").toLowerCase();
  const initialTab = tabParam === "past" || tabParam === "cancelled" ? tabParam : undefined;
  // `&familyMemberId=<id>`: open the booking wizard for that family member.
  const queryFamilyMemberId = getSearchParam("familyMemberId") || undefined;
  // `?id=<appointmentId>`: show that visit (a notification, or Home's "Pay now" / "Reschedule").
  // `&action=reschedule` also opens the reschedule dialog when the visit can still be moved.
  const queryVisitId = getSearchParam("id") || undefined;
  const queryVisitAction = getSearchParam("action") === "reschedule" ? "reschedule" : undefined;
  const defaultConsultationMode =
    bookingMode?.toUpperCase() === "VIDEO" ? "VIDEO" : undefined;
  const currentClinicId = useCurrentClinicId();
  const resolvedClinicId =
    queryClinicId ||
    currentClinicId ||
    APP_CONFIG.CLINIC.ID?.trim() ||
    undefined;
  const myAppointmentsFilters = resolvedClinicId ? { clinicId: resolvedClinicId } : undefined;
  const {
    data: appointmentsData,
    isPending: isPendingAppointments,
    isFetching: isFetchingAppointments,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useMyAppointments(myAppointmentsFilters);

  // Show a loading skeleton only on the very first fetch of the session.
  // Once the cache has any appointments (initial load, dashboard prefetch, or
  // sidebar hover-warm), `placeholderData: keepPreviousData` keeps the list
  // visible across refetches, filter changes, and remounts. Background
  // `isFetching` does NOT count as loading here — otherwise the list would
  // flash a skeleton on every window focus or reconnect.
  const hasCachedAppointments = useMemo(() => {
    if (!appointmentsData) return false;
    if (Array.isArray(appointmentsData)) return appointmentsData.length > 0;
    const inner = (appointmentsData as { appointments?: unknown })?.appointments;
    return Array.isArray(inner) && inner.length > 0;
  }, [appointmentsData]);
  const showAppointmentsSkeleton =
    isPendingAppointments &&
    !appointmentsError &&
    !hasCachedAppointments &&
    !hasAppointmentsLoadedForSession();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(shouldOpenBooking);
  // Kept in state because the query string is removed from the address bar below.
  const [bookingFamilyMemberId, setBookingFamilyMemberId] = useState(
    shouldOpenBooking ? queryFamilyMemberId : undefined,
  );
  const isBookingDialogOpening = shouldOpenBooking && !isBookingDialogOpen;
  // Kept in state for the same reason. A new object each time a link arrives, so opening the
  // same visit twice still scrolls to it.
  const [visitFocus, setVisitFocus] = useState<ManagerVisitFocus | undefined>(
    queryVisitId ? { visitId: queryVisitId, ...(queryVisitAction ? { action: queryVisitAction } : {}) } : undefined,
  );

  useEffect(() => {
    if (shouldOpenBooking) {
      setIsBookingDialogOpen(true);
      setBookingFamilyMemberId(queryFamilyMemberId);
    }

    if (queryVisitId) {
      setVisitFocus({ visitId: queryVisitId, ...(queryVisitAction ? { action: queryVisitAction } : {}) });
    }

    if (queryClinicId || queryLocationId || queryClinicName || bookingMode || shouldOpenBooking) {
      document.getElementById("appointment-manager")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (queryClinicId || queryLocationId || queryClinicName || bookingMode || shouldOpenBooking || queryVisitId) {
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
  }, [
    queryClinicId,
    queryLocationId,
    queryClinicName,
    bookingMode,
    shouldOpenBooking,
    queryFamilyMemberId,
    queryVisitId,
    queryVisitAction,
  ]);

  // Closing the wizard forgets the family member, so the next booking starts with "Myself".
  const handleBookingDialogOpenChange = (open: boolean) => {
    setIsBookingDialogOpen(open);
    if (!open) {
      setBookingFamilyMemberId(undefined);
    }
  };

  return (
    <PatientPageShell>
      <PageHead
        title="Appointments"
        description="Manage your consultations"
        actions={
          <Button variant="action" size="md" onClick={() => setIsBookingDialogOpen(true)}>
            <Plus aria-hidden="true" />
            Book appointment
          </Button>
        }
      />

      <BookAppointmentDialog
        open={isBookingDialogOpen}
        onOpenChange={handleBookingDialogOpenChange}
        hideTrigger
        {...(defaultConsultationMode ? { initialConsultationMode: defaultConsultationMode } : {})}
        {...(resolvedClinicId ? { clinicId: resolvedClinicId } : {})}
        {...(queryLocationId ? { locationId: queryLocationId } : {})}
        {...(queryClinicName ? { clinicName: queryClinicName } : {})}
        {...(bookingFamilyMemberId ? { initialFamilyMemberId: bookingFamilyMemberId } : {})}
        onBooked={() => setIsBookingDialogOpen(false)}
      />

      {isBookingDialogOpening && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-[20px] bg-card px-5 py-3.5 shadow-card dark:border dark:border-border/70"
        >
          <Loader2 className="size-4 animate-spin text-brand" aria-hidden="true" />
          <p className="m-0 text-sm font-semibold text-ink-muted">Opening booking…</p>
        </div>
      )}

      <div id="appointment-manager">
        <AppointmentManager
          hideBookButton
          autoOpenBookDialog={shouldOpenBooking}
          appointmentsData={appointmentsData}
          isAppointmentsPending={showAppointmentsSkeleton}
          isAppointmentsFetching={isFetchingAppointments}
          appointmentsError={appointmentsError}
          onRefreshAppointments={async () => {
            await refetchAppointments();
          }}
          onBookAppointment={() => setIsBookingDialogOpen(true)}
          initialTab={initialTab}
          focus={visitFocus}
          {...(defaultConsultationMode ? { defaultConsultationMode } : {})}
          {...(resolvedClinicId ? { clinicId: resolvedClinicId } : {})}
        />
      </div>
    </PatientPageShell>
  );
}

export default function PatientAppointments() {
  return (
    <Suspense fallback={null}>
      <PatientAppointmentsContent />
    </Suspense>
  );
}
