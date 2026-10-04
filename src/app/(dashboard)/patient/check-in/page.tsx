"use client";

import { useMemo, useReducer, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { QRScanner } from "@/components/qr/QRScanner";
import { ScannerFrame } from "@/components/qr/ScannerFrame";
import { shortBookingRef } from "@/components/appointments/booking/format";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { patientQueueKeys, usePatientQueue } from "@/hooks/query/usePatientQueue";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  TOAST_IDS,
} from "@/hooks/utils/use-toast";
import {
  useScanLocationQrAndCheckIn,
  type QrCheckInAppointment,
  type QrCheckInSelectionCandidate,
} from "@/hooks/query/useAppointments";
import { formatTimeInIST } from "@/lib/utils/date-time";
import { formatDoctorDisplayName } from "@/lib/utils/appointmentUtils";
import {
  CheckedInView,
  CheckInIntroView,
  CheckInLoadingView,
  CheckInNoVisitView,
  CheckInScanView,
  CheckInSelectView,
  type CheckInChoice,
} from "./_components/CheckInViews";
import { ManualCodeDrawer } from "./_components/ManualCodeDrawer";
import {
  isOpenClinicVisit,
  readAppointments,
  selectClinicVisits,
  toCheckInTicket,
  toQueueTicket,
} from "../queue/_components/queueData";

type CheckInCoordinates = { lat: number; lng: number };

type CheckInState = {
  isProcessing: boolean;
  successData: QrCheckInAppointment | null;
  manualCode: string;
  eligibleAppointments: QrCheckInSelectionCandidate[];
  pendingQrCode: string;
  pendingCoordinates: CheckInCoordinates | null;
  selectingAppointment: boolean;
};

type CheckInAction =
  | { type: "SET_MANUAL_CODE"; value: string }
  | { type: "START_PROCESSING" }
  | { type: "SHOW_SUCCESS"; appointment: QrCheckInAppointment }
  | {
      type: "SHOW_SELECTION";
      appointments: QrCheckInSelectionCandidate[];
      qrCode: string;
      coordinates: CheckInCoordinates;
    }
  | { type: "STOP_PROCESSING" }
  | { type: "BEGIN_APPOINTMENT_SELECTION" }
  | { type: "CLEAR_SELECTION" }
  | { type: "SHOW_ERROR" };

const initialCheckInState: CheckInState = {
  isProcessing: false,
  successData: null,
  manualCode: "",
  eligibleAppointments: [],
  pendingQrCode: "",
  pendingCoordinates: null,
  selectingAppointment: false,
};

function checkInReducer(state: CheckInState, action: CheckInAction): CheckInState {
  switch (action.type) {
    case "SET_MANUAL_CODE":
      return { ...state, manualCode: action.value };
    case "START_PROCESSING":
      return { ...state, isProcessing: true };
    case "SHOW_SUCCESS":
      return {
        ...state,
        isProcessing: false,
        successData: action.appointment,
        selectingAppointment: false,
      };
    case "SHOW_SELECTION":
      return {
        ...state,
        eligibleAppointments: action.appointments,
        pendingQrCode: action.qrCode,
        pendingCoordinates: action.coordinates,
        selectingAppointment: true,
        isProcessing: false,
      };
    case "STOP_PROCESSING":
      return { ...state, isProcessing: false };
    case "BEGIN_APPOINTMENT_SELECTION":
      return { ...state, selectingAppointment: false, isProcessing: true };
    case "CLEAR_SELECTION":
      return {
        ...state,
        selectingAppointment: false,
        eligibleAppointments: [],
        pendingQrCode: "",
        pendingCoordinates: null,
      };
    case "SHOW_ERROR":
      return { ...state, isProcessing: false };
    default:
      return state;
  }
}

function getCurrentCoordinates(): Promise<CheckInCoordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location access is not supported by this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        reject(new Error("Location access is required to verify you are within range of the clinic."));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export default function PatientCheckInPage() {
  const { push } = useRouter();
  const queryClient = useQueryClient();
  const { data: appointmentsData, isPending: isAppointmentsPending } = useMyAppointments();
  const [state, dispatch] = useReducer(checkInReducer, initialCheckInState);
  // "intro" = what to do (board 1); "scan" = the camera (board 2).
  const [step, setStep] = useState<"intro" | "scan">("intro");
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const scanLocationQrAndCheckInMutation = useScanLocationQrAndCheckIn();
  const {
    isProcessing,
    successData,
    manualCode,
    eligibleAppointments,
    pendingQrCode,
    pendingCoordinates,
    selectingAppointment,
  } = state;

  const appointments = useMemo(() => readAppointments(appointmentsData), [appointmentsData]);

  // Check-in is only for in-clinic visits that are still open. A video visit never qualifies.
  const hasEligibleAppointment = useMemo(() => appointments.some(isOpenClinicVisit), [appointments]);
  const clinicVisits = useMemo(() => selectClinicVisits(appointments, now), [appointments, now]);
  const visitToCheckIn = clinicVisits.find(({ visit }) => visit.clinicStage === "upcoming") ?? null;
  const checkedInVisit = clinicVisits.find(({ visit }) => visit.clinicStage !== "upcoming") ?? null;

  // The patient's own place in the queue, once checked in (now, or earlier today).
  const { data: queueEntry } = usePatientQueue({ enabled: Boolean(successData) || Boolean(checkedInVisit) });

  const handleManualCheckIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleScanSuccess(manualCode.trim());
  };

  const showSuccess = (appointment: QrCheckInAppointment) => {
    dispatch({ type: "SHOW_SUCCESS", appointment });
    setIsCodeDrawerOpen(false);
    // Read the new place in the queue straight away (here, on Home and on the live queue).
    void queryClient.invalidateQueries({ queryKey: patientQueueKeys.all });
    showSuccessToast("Check-in successful!", {
      id: TOAST_IDS.APPOINTMENT.CHECK_IN,
    });
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    dispatch({ type: "START_PROCESSING" });
    if ("vibrate" in navigator) navigator.vibrate(100);

    try {
      const coordinates = await getCurrentCoordinates();
      const result = await scanLocationQrAndCheckInMutation.mutateAsync({
        code: decodedText,
        coordinates,
      });

      if (result.success && result.appointment) {
        showSuccess(result.appointment);
        return;
      }

      if (
        result.requiresSelection &&
        Array.isArray(result.appointments) &&
        result.appointments.length > 0
      ) {
        dispatch({
          type: "SHOW_SELECTION",
          appointments: result.appointments,
          qrCode: decodedText,
          coordinates,
        });
        setIsCodeDrawerOpen(false);
        showInfoToast("Multiple appointments found. Please select one.", {
          id: TOAST_IDS.APPOINTMENT.CHECK_IN,
        });
        return;
      }

      showErrorToast(
        result.error || "Failed to check in. Please try again or ask reception.",
        { id: TOAST_IDS.APPOINTMENT.CHECK_IN }
      );
      dispatch({ type: "SHOW_ERROR" });
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.APPOINTMENT.CHECK_IN });
      dispatch({ type: "SHOW_ERROR" });
    }
  };

  const handleSelectAppointment = async (appointmentId: string) => {
    dispatch({ type: "BEGIN_APPOINTMENT_SELECTION" });

    try {
      const result = await scanLocationQrAndCheckInMutation.mutateAsync({
        code: pendingQrCode,
        appointmentId,
        ...(pendingCoordinates ? { coordinates: pendingCoordinates } : {}),
      });

      if (result.success && result.appointment) {
        showSuccess(result.appointment);
        return;
      }

      showErrorToast(result.error || "Failed to check in.", {
        id: TOAST_IDS.APPOINTMENT.CHECK_IN,
      });
      dispatch({ type: "SHOW_ERROR" });
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.APPOINTMENT.CHECK_IN });
      dispatch({ type: "SHOW_ERROR" });
    }
  };

  // ── Checked in: just now, or earlier today ──
  const isAlreadyInQueue = Boolean(queueEntry) || (!visitToCheckIn && Boolean(checkedInVisit));
  if (successData || (step === "intro" && !selectingAppointment && isAlreadyInQueue)) {
    const visitId = successData?.appointmentId ?? queueEntry?.appointmentId ?? checkedInVisit?.visit.id;
    const visit = clinicVisits.find((candidate) => candidate.visit.id === visitId)?.visit ?? checkedInVisit?.visit;
    const ticket = queueEntry
      ? toQueueTicket(queueEntry, visit?.tokenLabel)
      : successData
        ? toCheckInTicket(successData, visit?.tokenLabel)
        : null;

    return (
      <CheckedInView
        ticket={ticket}
        doctorName={successData?.doctorName ? formatDoctorDisplayName(successData.doctorName) : visit?.doctorName}
        locationLabel={successData?.locationName ?? visit?.locationLabel}
        // Opened while already checked in: the scanner stays one tap away.
        onScanAgain={!successData ? () => setStep("scan") : undefined}
      />
    );
  }

  if (selectingAppointment && eligibleAppointments.length > 0) {
    const choices: CheckInChoice[] = eligibleAppointments.map((apt) => {
      const derivedDoctorName =
        `${apt.doctor?.firstName || apt.doctor?.user?.firstName || ""} ${apt.doctor?.lastName || apt.doctor?.user?.lastName || ""}`.trim();
      const doctorName =
        apt.doctorName || apt.doctor?.user?.name || apt.doctor?.name || derivedDoctorName || "Doctor";
      const timeStr =
        apt.startTime || apt.time ? formatTimeInIST(apt.startTime || apt.time || "") : "";
      // A video visit never gets a check-in, so the type is shown only for clinic visits.
      const type = String(apt.type || "").toUpperCase();
      return {
        id: apt.id,
        doctorName,
        timeLabel: timeStr || "Time to be confirmed",
        typeLabel: type === "IN_PERSON" ? "In-clinic" : undefined,
      };
    });

    return (
      <CheckInSelectView
        choices={choices}
        onSelect={(appointmentId) => void handleSelectAppointment(appointmentId)}
        onCancel={() => {
          dispatch({ type: "CLEAR_SELECTION" });
        }}
      />
    );
  }

  if (isAppointmentsPending && appointments.length === 0) {
    return <CheckInLoadingView />;
  }

  if (!hasEligibleAppointment) {
    return <CheckInNoVisitView onBook={() => push("/patient/appointments?openBooking=1")} />;
  }

  const visit = (visitToCheckIn ?? checkedInVisit ?? clinicVisits[0])?.visit;

  if (step === "scan" || !visit) {
    return (
      <>
        <CheckInScanView
          locationLabel={visit?.locationLabel}
          onBack={() => (visit ? setStep("intro") : push("/patient/appointments"))}
          onEnterCode={() => setIsCodeDrawerOpen(true)}
          scanner={
            isProcessing ? (
              <ScannerFrame status="checking" />
            ) : (
              <QRScanner
                onScanSuccess={(value) => void handleScanSuccess(value)}
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
          onCodeChange={(value) => dispatch({ type: "SET_MANUAL_CODE", value })}
          onSubmit={(event) => void handleManualCheckIn(event)}
          isProcessing={isProcessing}
        />
      </>
    );
  }

  return <CheckInIntroView visit={visit} bookingRef={shortBookingRef(visit.id)} onScan={() => setStep("scan")} />;
}
