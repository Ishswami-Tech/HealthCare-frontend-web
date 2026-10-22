"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/qr/QRScanner";
import { ScannerFrame } from "@/components/qr/ScannerFrame";
import { shortBookingRef } from "@/components/appointments/booking/format";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { CheckInRefusedError, useInPersonCheckIn, useMyInPersonToday } from "@/hooks/query/useInPerson";
import { showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { formatDoctorDisplayName } from "@/lib/utils/appointmentUtils";
import type { CheckInFailureCode, InPersonVisit } from "@/types/in-person.types";
import {
  CheckedInView,
  CheckInErrorView,
  CheckInIntroView,
  CheckInLoadingView,
  CheckInNoVisitView,
  CheckInScanView,
  CheckInSelectView,
  TodayVisitsView,
  type CheckInChoice,
} from "./_components/CheckInViews";
import { ManualCodeDrawer } from "./_components/ManualCodeDrawer";
import {
  isOpenClinicVisit,
  pickQueuedVisit,
  readAppointments,
  selectClinicVisits,
  toVisitTicket,
} from "@/components/patient/queue/queueData";
import { checkInErrorCopy, locationFailureCopy } from "@/components/patient/queue/checkInErrors";
import {
  isTypedDeskCode,
  readFixIfGranted,
  requestDeviceFix,
  type DeviceFix,
  type LocationFailure,
} from "@/components/patient/queue/deviceLocation";

/**
 * Patient check-in (V2): scan the QR of the location you booked -> checked in (token, place,
 * wait) -> live queue. One backend call (`POST in-person/check-in`), the same one the reception
 * desk uses for its one-click check-in. Refusals (wrong location, too early, window closed, not
 * booked, old QR) get their own screen with the fix.
 *
 * A typed desk code needs the device position (backend LOCATION_REQUIRED / TOO_FAR): it is read
 * first ("Checking your location…") and the API is not called without it. A scanned signed poster
 * attaches the position only when permission is already granted, and never waits for it.
 */

type Coordinates = DeviceFix;

type CheckInState =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "processing" }
  | { kind: "success"; visit: InPersonVisit }
  | { kind: "select"; candidates: InPersonVisit[]; qrCode: string; coordinates: Coordinates | null }
  | { kind: "error"; reason: CheckInFailureCode; message: string }
  | { kind: "location"; failure: LocationFailure };

export default function PatientCheckInPage() {
  const { push } = useRouter();
  const { data: appointmentsData, isPending: isAppointmentsPending } = useMyAppointments();
  const { data: todayVisits } = useMyInPersonToday({ live: true });
  const checkIn = useInPersonCheckIn();
  const [state, setState] = useState<CheckInState>({ kind: "idle" });
  // "intro" = what to do; "scan" = the camera.
  const [step, setStep] = useState<"intro" | "scan">("intro");
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [now] = useState(() => Date.now());

  const appointments = useMemo(() => readAppointments(appointmentsData), [appointmentsData]);
  const hasEligibleAppointment = useMemo(
    // A NO_SHOW / COMPLETED / CANCELLED visit today is not something to check in for.
    () =>
      appointments.some(isOpenClinicVisit) ||
      (todayVisits ?? []).some(
        (visit) => visit.stage === "BOOKED" || visit.stage === "CHECKED_IN" || visit.stage === "WITH_DOCTOR",
      ),
    [appointments, todayVisits],
  );
  const clinicVisits = useMemo(() => selectClinicVisits(appointments, now), [appointments, now]);
  const visitToCheckIn = clinicVisits.find(({ visit }) => visit.clinicStage === "upcoming") ?? null;
  const queuedVisit = pickQueuedVisit(todayVisits);
  const activeTodayVisits = (todayVisits ?? []).filter(
    (visit) => visit.stage === "BOOKED" || visit.stage === "CHECKED_IN" || visit.stage === "WITH_DOCTOR",
  );
  const bookedToday = (todayVisits ?? []).find((visit) => visit.stage === "BOOKED") ?? null;
  const isLocating = state.kind === "locating";
  const isProcessing = isLocating || state.kind === "processing" || checkIn.isPending;
  // One check-in at a time: a double tap / Enter + click / the camera reading the poster twice
  // gets the request already in flight instead of a second attempt (and a second log row).
  const inFlight = useRef<Promise<void> | null>(null);

  const submit = async (qrCode: string, coordinates: Coordinates | null, appointmentId?: string) => {
    setState({ kind: "processing" });
    try {
      const result = await checkIn.mutateAsync({
        qrCode,
        ...(appointmentId ? { appointmentId } : {}),
        ...(coordinates ? { coordinates } : {}),
      });
      setIsCodeDrawerOpen(false);
      if (result.result === "SELECT_APPOINTMENT") {
        setState({ kind: "select", candidates: result.candidates, qrCode, coordinates });
        return;
      }
      setState({ kind: "success", visit: result.visit });
      showSuccessToast(result.alreadyCheckedIn ? "You are already checked in." : "Check-in successful!", {
        id: TOAST_IDS.APPOINTMENT.CHECK_IN,
      });
    } catch (error) {
      setIsCodeDrawerOpen(false);
      const reason = error instanceof CheckInRefusedError ? error.failure.reason : "UNKNOWN";
      const message = error instanceof Error ? error.message : "";
      setState({ kind: "error", reason, message });
    }
  };

  /** The position this code needs: required for a typed desk code, best effort for a poster. */
  const resolvePosition = async (qrCode: string): Promise<{ ok: true; fix: Coordinates | null } | { ok: false }> => {
    if (!isTypedDeskCode(qrCode)) return { ok: true, fix: await readFixIfGranted() };
    setState({ kind: "locating" });
    const result = await requestDeviceFix();
    if (result.ok) return { ok: true, fix: result.fix };
    setIsCodeDrawerOpen(false);
    setState({ kind: "location", failure: result.failure });
    return { ok: false };
  };

  /** `known`: the position already read for this code (picking one of several bookings). */
  const runCheckIn = (qrCode: string, appointmentId?: string, known?: Coordinates | null): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    const run = (async () => {
      const position = known !== undefined ? { ok: true as const, fix: known } : await resolvePosition(qrCode);
      if (!position.ok) return;
      await submit(qrCode, position.fix, appointmentId);
    })().finally(() => {
      inFlight.current = null;
    });
    inFlight.current = run;
    return run;
  };

  const handleScan = async (decodedText: string) => {
    if (inFlight.current) return inFlight.current;
    if ("vibrate" in navigator) navigator.vibrate(100);
    await runCheckIn(decodedText);
  };

  const handleManualCheckIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!manualCode.trim()) return;
    await runCheckIn(manualCode.trim());
  };

  const scanAgain = () => {
    setState({ kind: "idle" });
    setStep("scan");
  };

  const retryDeskCode = () => {
    setState({ kind: "idle" });
    setStep("scan");
    setIsCodeDrawerOpen(true);
  };

  // ── No position for the desk code: how to turn location on, or scan the QR instead ──
  if (state.kind === "location") {
    return (
      <CheckInErrorView
        copy={locationFailureCopy(state.failure)}
        onScanAgain={scanAgain}
        onBook={() => push("/patient/appointments?openBooking=1")}
        onRetryCode={retryDeskCode}
      />
    );
  }

  // ── Refused: say why and offer the fix ──
  if (state.kind === "error") {
    return (
      <CheckInErrorView
        copy={checkInErrorCopy(state.reason, state.message, bookedToday)}
        onScanAgain={scanAgain}
        onBook={() => push("/patient/appointments?openBooking=1")}
        onRetryCode={retryDeskCode}
      />
    );
  }

  // ── Checked in: just now, or earlier today (live: token, people ahead, ETA, you're next) ──
  const successVisit = state.kind === "success" ? state.visit : null;
  // Several visits today: list them all (check in a booked one, see the token of a queued one).
  if (!successVisit && state.kind === "idle" && step === "intro" && activeTodayVisits.length > 1) {
    return <TodayVisitsView visits={activeTodayVisits} onCheckIn={() => setStep("scan")} />;
  }
  const liveVisit =
    (successVisit && (todayVisits ?? []).find((visit) => visit.appointmentId === successVisit.appointmentId)) ||
    successVisit ||
    (step === "intro" ? queuedVisit : null);
  if (liveVisit && state.kind !== "select") {
    return (
      <CheckedInView
        ticket={toVisitTicket(liveVisit)}
        doctorName={formatDoctorDisplayName(liveVisit.doctorName)}
        locationLabel={liveVisit.locationName}
        // Opened while already checked in: the scanner stays one tap away.
        onScanAgain={!successVisit ? () => setStep("scan") : undefined}
      />
    );
  }

  if (state.kind === "select") {
    const choices: CheckInChoice[] = state.candidates.map((visit) => ({
      id: visit.appointmentId,
      doctorName: formatDoctorDisplayName(visit.doctorName),
      timeLabel: visit.time || "Time to be confirmed",
      typeLabel: [visit.patientName, visit.locationName].filter(Boolean).join(" · ") || "In-clinic",
    }));
    return (
      <CheckInSelectView
        choices={choices}
        onSelect={(appointmentId) => void runCheckIn(state.qrCode, appointmentId, state.coordinates)}
        onCancel={() => setState({ kind: "idle" })}
      />
    );
  }

  if (isAppointmentsPending && appointments.length === 0 && !todayVisits) {
    return <CheckInLoadingView />;
  }

  if (!hasEligibleAppointment) {
    return <CheckInNoVisitView onBook={() => push("/patient/appointments?openBooking=1&mode=IN_PERSON")} />;
  }

  const visit = (visitToCheckIn ?? clinicVisits[0])?.visit;

  if (step === "scan" || !visit) {
    return (
      <>
        <CheckInScanView
          locationLabel={bookedToday?.locationName ?? visit?.locationLabel}
          onBack={() => (visit ? setStep("intro") : push("/patient/appointments"))}
          onEnterCode={() => setIsCodeDrawerOpen(true)}
          scanner={
            isProcessing ? (
              <ScannerFrame status="checking" />
            ) : (
              <QRScanner
                onScanSuccess={(value) => void handleScan(value)}
                onScanFailure={() => void 0}
                autoStart={true}
                onEnterCode={() => setIsCodeDrawerOpen(true)}
              />
            )
          }
        />
        <ManualCodeDrawer
          open={isCodeDrawerOpen}
          onOpenChange={setIsCodeDrawerOpen}
          code={manualCode}
          onCodeChange={setManualCode}
          onSubmit={(event) => void handleManualCheckIn(event)}
          isProcessing={isProcessing}
          isLocating={isLocating}
        />
      </>
    );
  }

  const inPersonVisit = (todayVisits ?? []).find((entry) => entry.appointmentId === visit.id);
  return (
    <CheckInIntroView
      visit={visit}
      bookingRef={shortBookingRef(visit.id)}
      checkInWindow={inPersonVisit?.checkInWindow}
      onScan={() => setStep("scan")}
    />
  );
}
