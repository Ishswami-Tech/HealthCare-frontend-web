"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Pill, Activity, Loader2, Plus, X, Stethoscope, CalendarClock } from "lucide-react";
import { useCompleteAppointment } from "@/hooks/query/useAppointments";

interface QuickPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
}

interface MedicationRow {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const createEmptyMedication = (): MedicationRow => ({
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

const formatMedicationSummary = (medication: MedicationRow) =>
  [
    medication.name.trim(),
    medication.dosage.trim() ? `Dose: ${medication.dosage.trim()}` : "",
    medication.frequency.trim() ? `Freq: ${medication.frequency.trim()}` : "",
    medication.duration.trim() ? `Duration: ${medication.duration.trim()}` : "",
    medication.instructions.trim() ? `Instructions: ${medication.instructions.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

export function QuickPrescriptionModal({
  isOpen,
  onClose,
  appointmentId,
  patientId,
  patientName,
  doctorId,
}: QuickPrescriptionModalProps) {
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [medications, setMedications] = useState<MedicationRow[]>([createEmptyMedication()]);

  const completeAppointment = useCompleteAppointment();

  const handleAddMedication = () => {
    setMedications((current) => [...current, createEmptyMedication()]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications((current) => current.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: keyof MedicationRow, value: string) => {
    setMedications((current) =>
      current.map((medication, i) =>
        i === index ? { ...medication, [field]: value } : medication
      )
    );
  };

  const handleSubmit = async () => {
    const cleanMedications = medications
      .map((medication) => ({
        ...medication,
        name: medication.name.trim(),
        dosage: medication.dosage.trim(),
        frequency: medication.frequency.trim(),
        duration: medication.duration.trim(),
        instructions: medication.instructions.trim(),
      }))
      .filter((medication) => medication.name);

    if (!diagnosis.trim() && !treatmentPlan.trim() && cleanMedications.length === 0) {
      return;
    }

    try {
      const prescriptionText = cleanMedications
        .map(formatMedicationSummary)
        .filter(Boolean)
        .join("\n");

      await completeAppointment.mutateAsync({
        id: appointmentId,
        data: {
          diagnosis: diagnosis.trim(),
          notes: notes.trim(),
          treatmentPlan: treatmentPlan.trim() || notes.trim(),
          medications: cleanMedications.map(formatMedicationSummary),
          ...(prescriptionText ? { prescription: prescriptionText } : {}),
          ...(followUpDate ? { followUpDate } : {}),
          ...(followUpNotes.trim() ? { followUpNotes: followUpNotes.trim() } : {}),
        },
      });

      setDiagnosis("");
      setTreatmentPlan("");
      setNotes("");
      setFollowUpDate("");
      setFollowUpNotes("");
      setMedications([createEmptyMedication()]);
      onClose();
    } catch (error) {
      console.error("Failed to complete appointment with prescription:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Pill className="h-4 w-4" />
            </div>
            Clinical Prescription
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Record diagnosis, treatment, and structured medicines for{" "}
            <span className="font-semibold text-foreground">{patientName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <Card className="border-border/70">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Patient</p>
                <p className="mt-1 font-semibold">{patientName}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Patient ID</p>
                <p className="mt-1 font-semibold break-all">{patientId}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Appointment</p>
                <p className="mt-1 font-semibold break-all">{appointmentId}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Doctor</p>
                <p className="mt-1 font-semibold break-all">{doctorId}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="diagnosis" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Stethoscope className="h-3 w-3" />
              Diagnosis
            </Label>
            <Textarea
              id="diagnosis"
              placeholder="Primary diagnosis or clinical impression"
              className="min-h-[90px] resize-none"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treatment-plan" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Activity className="h-3 w-3" />
              Treatment Plan
            </Label>
            <Textarea
              id="treatment-plan"
              placeholder="Consultation summary, treatment plan, diet, exercise, instructions"
              className="min-h-[90px] resize-none"
              value={treatmentPlan}
              onChange={(event) => setTreatmentPlan(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinical-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Additional Notes
            </Label>
            <Textarea
              id="clinical-notes"
              placeholder="Any extra notes for the chart or handover"
              className="min-h-[80px] resize-none"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <Card className="border-border/70">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Medicines</p>
                  <p className="text-xs text-muted-foreground">Add structured medication rows for pharmacy and patient handover.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddMedication}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add medicine
                </Button>
              </div>

              <div className="space-y-3">
                {medications.map((medication, index) => (
                  <div key={index} className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Medicine {index + 1}
                      </p>
                      {medications.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => handleRemoveMedication(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medicine name</Label>
                        <Input
                          placeholder="Paracetamol 500 mg"
                          value={medication.name}
                          onChange={(event) => handleMedChange(index, "name", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dose</Label>
                        <Input
                          placeholder="1 tablet"
                          value={medication.dosage}
                          onChange={(event) => handleMedChange(index, "dosage", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frequency</Label>
                        <Input
                          placeholder="Twice daily"
                          value={medication.frequency}
                          onChange={(event) => handleMedChange(index, "frequency", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</Label>
                        <Input
                          placeholder="5 days"
                          value={medication.duration}
                          onChange={(event) => handleMedChange(index, "duration", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Instructions</Label>
                        <Input
                          placeholder="After food"
                          value={medication.instructions}
                          onChange={(event) => handleMedChange(index, "instructions", event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="follow-up-date" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <CalendarClock className="h-3 w-3" />
                  Follow-up date
                </Label>
                <Input
                  id="follow-up-date"
                  type="date"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="follow-up-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Follow-up notes
                </Label>
                <Input
                  id="follow-up-notes"
                  placeholder="Review labs in 1 week"
                  value={followUpNotes}
                  onChange={(event) => setFollowUpNotes(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={completeAppointment.isPending}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700 min-w-[140px]"
            onClick={handleSubmit}
            disabled={completeAppointment.isPending || (!diagnosis.trim() && !treatmentPlan.trim() && medications.every((medication) => !medication.name.trim()))}
          >
            {completeAppointment.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              "Complete Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
