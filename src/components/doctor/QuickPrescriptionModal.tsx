"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Activity, Loader2, Plus, X } from "lucide-react";
import { useCompleteAppointment } from "@/hooks/query/useAppointments";
import { theme } from "@/lib/utils/theme-utils";

interface QuickPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
}

export function QuickPrescriptionModal({
  isOpen,
  onClose,
  appointmentId,
  patientId,
  patientName,
  doctorId,
}: QuickPrescriptionModalProps) {
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<{ name: string; dosage?: string }[]>([
    { name: "" },
  ]);

  const completeAppointment = useCompleteAppointment();

  const handleAddMedication = () => {
    setMedications([...medications, { name: "" }]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, name: string) => {
    const newMeds = [...medications];
    if (newMeds[index]) {
      newMeds[index].name = name;
      setMedications(newMeds);
    }
  };

  const handleSubmit = async () => {
    if (!notes.trim() && medications.every(m => !m.name.trim())) return;

    try {
      await completeAppointment.mutateAsync({
        id: appointmentId,
        data: {
          diagnosis: notes,
          notes: notes,
          treatmentPlan: notes,
          medications: medications
            .filter(m => m.name.trim())
            .map(m => m.name.trim()),
        },
      });
      
      // Reset and close
      setNotes("");
      setMedications([{ name: "" }]);
      onClose();
    } catch (error) {
      console.error("Failed to complete appointment with medicinal update:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            Clinical Prescription
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Record diagnosis and medicines for <span className="font-semibold text-foreground">{patientName}</span>. Payment and dispatch are handled by the medicine desk.
          </p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="clinical-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Diagnosis & Treatment Notes
            </Label>
            <Textarea
              id="clinical-notes"
              placeholder="Enter diagnosis or consultation summary..."
              className="resize-none min-h-[100px] bg-slate-50/50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Pill className="w-3 h-3" />
              Medicines To Prescribe
            </Label>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
              {medications.map((med, index) => (
                <div key={index} className="flex gap-2 group">
                  <Input
                    placeholder="e.g. Paracetamol 500mg"
                    value={med.name}
                    onChange={(e) => handleMedChange(index, e.target.value)}
                    className="bg-slate-50/50 h-9"
                  />
                  {medications.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                      onClick={() => handleRemoveMedication(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed text-xs h-8 text-muted-foreground border-slate-300 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
              onClick={handleAddMedication}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Another Medicine
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={completeAppointment.isPending}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
            onClick={handleSubmit}
            disabled={completeAppointment.isPending || (!notes.trim() && medications.every(m => !m.name.trim()))}
          >
            {completeAppointment.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
