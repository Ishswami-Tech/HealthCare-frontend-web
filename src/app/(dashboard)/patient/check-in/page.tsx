"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/qr/QRScanner";
import { scanLocationQRAndCheckIn } from "@/lib/actions/appointments.server";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function PatientCheckInPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    toast.info("Processing QR code...");

    try {
      const result = await scanLocationQRAndCheckIn({ code: decodedText });

      if (result.success && result.appointment) {
        setSuccessData(result.appointment);
        toast.success("Check-in successful!");
      } else {
        toast.error(result.error || "Failed to check in via QR code");
        setIsProcessing(false); // Allow retry
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  if (successData) {
    const aptId = successData.appointmentId || successData.id;
    const doctorName = successData.doctorName ?? successData.doctor?.name ?? "Assigned Doctor";
    const timeDisplay = successData.checkedInAt
      ? new Date(successData.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      : successData.time ?? "—";

    return (
      <div className="container max-w-md py-10 mx-auto">
        <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-900/10">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-700 dark:text-green-400">Checked In!</CardTitle>
            <CardDescription>
              You have successfully checked in for your appointment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-background rounded-lg p-4 border text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Appointment ID</span>
                <span className="font-medium">{aptId?.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Doctor</span>
                <span className="font-medium">{doctorName}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Check-in Time</span>
                <span className="font-medium">{timeDisplay}</span>
              </div>
              {(successData as any).queuePosition != null && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Queue Position</span>
                  <span className="font-medium">#{(successData as any).queuePosition}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-green-600">CHECKED_IN</span>
              </div>
            </div>
            
            <Button className="w-full" onClick={() => router.push("/patient/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-8 mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Self Check-in</h1>
      </div>

      <div className="space-y-2 text-center">
        <p className="text-muted-foreground">
          Scan the QR code displayed at the reception or treatment room to verify your arrival.
        </p>
      </div>

      <QRScanner 
        onScanSuccess={handleScanSuccess} 
        onScanFailure={(err) => console.log('Scan error (benign):', err)}
      />

      <div className="text-center text-sm text-muted-foreground">
        <p>Having trouble scanning?</p>
        <p>Please contact the receptionist for manual check-in.</p>
      </div>
    </div>
  );
}
