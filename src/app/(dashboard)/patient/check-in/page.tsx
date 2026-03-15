"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/qr/QRScanner";
import { scanLocationQRAndCheckIn } from "@/lib/actions/appointments.server";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Info, Loader2, QrCode, Clock, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface EligibleAppointment {
  id: string;
  doctorName?: string;
  doctor?: { name?: string; firstName?: string; lastName?: string };
  startTime?: string;
  time?: string;
  type?: string;
}

export default function PatientCheckInPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [manualCode, setManualCode] = useState("");
  // Multi-appointment selection state
  const [eligibleAppointments, setEligibleAppointments] = useState<EligibleAppointment[]>([]);
  const [pendingQrCode, setPendingQrCode] = useState<string>("");
  const [selectingAppointment, setSelectingAppointment] = useState(false);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanSuccess(manualCode.trim());
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    if ("vibrate" in navigator) navigator.vibrate(100);

    try {
      const result = await scanLocationQRAndCheckIn({ code: decodedText }) as any;

      if (result.success && result.appointment) {
        setSuccessData(result.appointment);
        toast.success("Check-in successful!");
      } else if (result.requiresSelection && result.appointments?.length > 0) {
        // Backend found multiple eligible appointments — let patient pick
        setEligibleAppointments(result.appointments);
        setPendingQrCode(decodedText);
        setSelectingAppointment(true);
        setIsProcessing(false);
        toast.info("Multiple appointments found. Please select one.");
      } else {
        toast.error(result.error || "Failed to check in. Please try again or ask reception.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  const handleSelectAppointment = async (appointmentId: string) => {
    setSelectingAppointment(false);
    setIsProcessing(true);

    try {
      const result = await scanLocationQRAndCheckIn({
        code: pendingQrCode,
        appointmentId,
      } as any) as any;

      if (result.success && result.appointment) {
        setSuccessData(result.appointment);
        toast.success("Check-in successful!");
      } else {
        toast.error(result.error || "Failed to check in.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  // ─── Success State ────────────────────────────────────────────────────────
  if (successData) {
    const doctorName = successData.doctorName ?? successData.doctor?.name ?? "Assigned Doctor";
    const locationName =
      successData.locationName ??
      successData.location?.locationName ??
      successData.location?.name ??
      "Booked Clinic Location";
    const timeDisplay = successData.checkedInAt
      ? new Date(successData.checkedInAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : successData.time ?? "—";

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center space-y-8"
        >
          <div className="relative mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center shadow-inner">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Check-in Confirmed!</h1>
            <p className="text-muted-foreground text-sm font-medium">
              You&apos;re all set for your visit.
            </p>
          </div>

          <div className="grid gap-4 bg-muted/40 p-6 rounded-3xl border text-left">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                Doctor
              </span>
              <span className="font-bold truncate max-w-[150px]">{doctorName}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                Time
              </span>
              <span className="font-bold">{timeDisplay}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                Location
              </span>
              <span className="font-bold truncate max-w-[160px] text-right">{locationName}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                Queue #
              </span>
              <span className="font-black text-primary uppercase">
                {successData.queuePosition || "1"}
              </span>
            </div>
          </div>

          <Button
            className="w-full h-14 rounded-2xl text-base font-bold"
            onClick={() => router.push("/patient/dashboard")}
          >
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Multi-Appointment Selection State ──────────────────────────────────
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
            const doctorName =
              apt.doctorName ??
              apt.doctor?.name ??
              (`${apt.doctor?.firstName || ""} ${apt.doctor?.lastName || ""}`.trim() ||
              "Doctor");
            const timeStr = apt.startTime || apt.time
              ? new Date((apt.startTime || apt.time)!).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "—";

            return (
              <motion.button
                key={apt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-2xl border bg-card p-5 text-left hover:border-primary/50 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
                onClick={() => handleSelectAppointment(apt.id)}
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

  // ─── Scanner State ────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto space-y-6 py-4">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">QR Check-in</h1>
        <p className="text-muted-foreground text-sm">
          Scan the QR at your booked clinic location to confirm appointment and join the live queue.
        </p>
      </div>

      {/* Scanner Card */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          {!isProcessing ? (
            <motion.div
              key="scanner-layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 flex flex-col items-center gap-4"
            >
              <div className="w-full max-w-sm">
                <QRScanner
                  onScanSuccess={handleScanSuccess}
                  onScanFailure={() => void 0}
                  autoStart={true}
                />
              </div>

              <div className="flex items-start gap-3 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 w-full max-w-sm">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 dark:text-blue-300/80 leading-relaxed font-medium">
                  QR check-in works only at the booked appointment location. Once scanned, you are added to the live queue.
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

      {/* Manual Check-in */}
      <div className="text-center">
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors h-auto py-3"
            >
              Can&apos;t scan? Check-in Manually
            </Button>
          </DrawerTrigger>
          <DrawerContent className="bg-background border rounded-t-4xl">
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader className="text-left mt-4">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4 border">
                  <QrCode className="h-6 w-6" />
                </div>
                <DrawerTitle className="text-2xl font-bold">Manual Code</DrawerTitle>
                <DrawerDescription className="text-muted-foreground font-medium">
                  Enter the code encoded in the clinic QR poster to check in manually.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-0">
                <form id="manual-checkin-form" onSubmit={handleManualCheckIn} className="space-y-6">
                  <Input
                    placeholder="Paste code from the clinic QR poster"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    className="h-14 rounded-xl bg-muted/50 px-3 text-center text-sm font-bold uppercase tracking-wide sm:text-lg sm:tracking-widest"
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
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Verify & Check-in"
                  )}
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
    </div>
  );
}
