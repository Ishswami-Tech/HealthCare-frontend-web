"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Info, Loader2, QrCode, Clock, Stethoscope } from "lucide-react";
import { QRScanner } from "@/components/qr/QRScanner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  DashboardPageHeader as PatientPageHeader,
  DashboardPageShell as PatientPageShell,
} from "@/components/dashboard/DashboardPageShell";
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
import { theme } from "@/lib/utils/theme-utils";

type CheckInCoordinates = { lat: number; lng: number };

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
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<QrCheckInAppointment | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [eligibleAppointments, setEligibleAppointments] = useState<QrCheckInSelectionCandidate[]>([]);
  const [pendingQrCode, setPendingQrCode] = useState("");
  const [pendingCoordinates, setPendingCoordinates] = useState<CheckInCoordinates | null>(null);
  const [selectingAppointment, setSelectingAppointment] = useState(false);
  const scanLocationQrAndCheckInMutation = useScanLocationQrAndCheckIn();

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleScanSuccess(manualCode.trim());
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    if ("vibrate" in navigator) navigator.vibrate(100);

    try {
      const coordinates = await getCurrentCoordinates();
      const result = await scanLocationQrAndCheckInMutation.mutateAsync({
        code: decodedText,
        coordinates,
      });

      if (result.success && result.appointment) {
        setSuccessData(result.appointment);
        showSuccessToast("Check-in successful!", {
          id: TOAST_IDS.APPOINTMENT.CHECK_IN,
        });
        return;
      }

      if (
        result.requiresSelection &&
        Array.isArray(result.appointments) &&
        result.appointments.length > 0
      ) {
        setEligibleAppointments(result.appointments);
        setPendingQrCode(decodedText);
        setPendingCoordinates(coordinates);
        setSelectingAppointment(true);
        setIsProcessing(false);
        showInfoToast("Multiple appointments found. Please select one.", {
          id: TOAST_IDS.APPOINTMENT.CHECK_IN,
        });
        return;
      }

      showErrorToast(
        result.error || "Failed to check in. Please try again or ask reception.",
        { id: TOAST_IDS.APPOINTMENT.CHECK_IN }
      );
      setIsProcessing(false);
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.APPOINTMENT.CHECK_IN });
      setIsProcessing(false);
    }
  };

  const handleSelectAppointment = async (appointmentId: string) => {
    setSelectingAppointment(false);
    setIsProcessing(true);

    try {
      const result = await scanLocationQrAndCheckInMutation.mutateAsync({
        code: pendingQrCode,
        appointmentId,
        ...(pendingCoordinates ? { coordinates: pendingCoordinates } : {}),
      });

      if (result.success && result.appointment) {
        setSuccessData(result.appointment);
        showSuccessToast("Check-in successful!", {
          id: TOAST_IDS.APPOINTMENT.CHECK_IN,
        });
        return;
      }

      showErrorToast(result.error || "Failed to check in.", {
        id: TOAST_IDS.APPOINTMENT.CHECK_IN,
      });
      setIsProcessing(false);
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.APPOINTMENT.CHECK_IN });
      setIsProcessing(false);
    }
  };

  if (successData) {
    const doctorName = successData.doctorName ?? "Assigned Doctor";
    const locationName = successData.locationName ?? "Booked Clinic Location";
    const timeDisplay = successData.checkedInAt
      ? formatTimeInIST(successData.checkedInAt)
      : "—";

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center space-y-6 sm:space-y-8"
        >
          <div
            className={`relative mx-auto w-20 h-20 sm:w-24 sm:h-24 ${theme.badges.emerald} rounded-full flex items-center justify-center shadow-inner border-none`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className={`h-8 w-8 sm:h-10 sm:w-10 ${theme.iconColors.emerald}`} />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Check-in Confirmed!</h1>
            <p className="text-muted-foreground text-xs sm:text-sm font-medium">
              You&apos;re all set for your visit.
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4 bg-muted/40 p-4 sm:p-6 rounded-3xl border text-left">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">
                Doctor
              </span>
              <span className="font-bold truncate max-w-[120px] sm:max-w-[150px]">{doctorName}</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">
                Time
              </span>
              <span className="font-bold">{timeDisplay}</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">
                Location
              </span>
              <span className="font-bold truncate max-w-[140px] sm:max-w-[160px] text-right">
                {locationName}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">
                Queue #
              </span>
              <span className="font-black text-primary uppercase">
                {successData.queuePosition || "1"}
              </span>
            </div>
          </div>

          <Button
            className="w-full h-12 sm:h-14 rounded-2xl text-sm sm:text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-glow-subtle hover:shadow-glow-medium"
            onClick={() => router.push("/patient/dashboard")}
          >
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (selectingAppointment && eligibleAppointments.length > 0) {
    return (
      <div className="max-w-xl mx-auto space-y-6 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Select Appointment</h1>
          <p className="text-muted-foreground text-sm">
            You have multiple appointments today. Please select which one to check in for.
          </p>
        </div>

        <div className="space-y-3">
          {eligibleAppointments.map((apt) => {
            const derivedDoctorName = `${apt.doctor?.firstName || ""} ${apt.doctor?.lastName || ""}`.trim();
            const doctorName = (apt.doctorName ?? apt.doctor?.name ?? derivedDoctorName) || "Doctor";
            const timeStr =
              apt.startTime || apt.time
                ? formatTimeInIST(apt.startTime || apt.time || "")
                : "—";

            return (
              <motion.button
                key={apt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-2xl border bg-card p-4 sm:p-5 text-left hover:border-primary/50 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                onClick={() => void handleSelectAppointment(apt.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{doctorName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{timeStr}</span>
                      {apt.type && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <span>{apt.type}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-primary font-semibold text-sm">Select →</div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setSelectingAppointment(false);
            setEligibleAppointments([]);
            setPendingQrCode("");
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <DashboardLayout title="Location Check-In">
      <PatientPageShell className="max-w-xl mx-auto">
        <PatientPageHeader
          eyebrow="LOCATION CHECK-IN"
          title="Check-in with Location Code"
          description="Scan the clinic QR or enter the location code from the poster. Your device location is validated before arrival is confirmed."
        />

        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">
            {!isProcessing ? (
              <motion.div
                key="scanner-layout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 sm:p-4 flex flex-col items-center gap-3 sm:gap-4"
              >
                <div className="w-full max-w-sm">
                  <QRScanner
                    onScanSuccess={(value) => void handleScanSuccess(value)}
                    onScanFailure={() => void 0}
                    autoStart={true}
                  />
                </div>

                <div className={`flex items-start gap-3 ${theme.containers.featureBlue} p-4 rounded-xl w-full max-w-sm`}>
                  <Info className={`h-4 w-4 ${theme.iconColors.blue} shrink-0 mt-0.5`} />
                  <p className={`text-[11px] ${theme.textColors.info} leading-relaxed font-medium`}>
                    Check-in is allowed only when your device is within the clinic&apos;s configured geofence, the location code is valid, and a matching appointment exists for today.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="processing-layout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-16 text-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl bg-primary/20 scale-150 rounded-full animate-pulse" />
                  <Loader2 className="h-10 w-10 text-primary animate-spin relative z-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Connecting</h3>
                  <p className="text-muted-foreground text-xs">Syncing your arrival data securely</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center">
          <Drawer>
            <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors h-auto py-3"
                >
                Enter Location Code Manually
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-background border rounded-t-4xl">
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader className="text-left mt-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4 border">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <DrawerTitle className="text-2xl font-bold">Enter Location Code</DrawerTitle>
                  <DrawerDescription className="text-muted-foreground font-medium">
                    Enter the code shown on the clinic location QR poster. The system checks your appointment, clinic location, and current proximity before confirming.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 pb-0">
                  <form id="manual-checkin-form" onSubmit={handleManualCheckIn} className="space-y-6">
                    <Input
                      placeholder="Enter location code"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      className="h-12 sm:h-14 rounded-xl bg-muted/50 px-3 text-center text-xs font-bold uppercase tracking-wide sm:text-lg sm:tracking-widest"
                      maxLength={160}
                      autoComplete="off"
                    />
                  </form>
                </div>
                <DrawerFooter className="pt-8 pb-8">
                  <Button
                    type="submit"
                    form="manual-checkin-form"
                    className="w-full h-14 rounded-xl text-base font-bold"
                    disabled={manualCode.length < 4 || isProcessing}
                  >
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Validate & Check-in"}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" className="h-14 rounded-xl font-bold">
                      Cancel
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </PatientPageShell>
    </DashboardLayout>
  );
}
