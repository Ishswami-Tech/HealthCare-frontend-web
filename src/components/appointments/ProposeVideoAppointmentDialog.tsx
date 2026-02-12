"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useProposeVideoAppointment } from "@/hooks/query/useAppointments";
import { useDoctors } from "@/hooks/query/useDoctors";
import { usePatients } from "@/hooks/query/usePatients";
import { useClinicContext } from "@/hooks/query/useClinics";
import { Role } from "@/types/auth.types";

const TIME_OPTIONS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

export interface ProposeVideoAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  userRole: Role | string;
}

export function ProposeVideoAppointmentDialog({
  open,
  onOpenChange,
  patientId: initialPatientId,
  userRole,
}: ProposeVideoAppointmentDialogProps) {
  const { clinicId } = useClinicContext();
  const proposeMutation = useProposeVideoAppointment();
  const { data: doctorsData } = useDoctors(clinicId || "", { limit: 100 });
  // Only fetch patients when RECEPTIONIST – backend GET /clinics/:id/patients denies PATIENT
  const { data: patientsData } = usePatients(
    userRole === Role.RECEPTIONIST ? (clinicId || "") : "",
    { limit: 200 }
  );
  const doctors = Array.isArray(doctorsData?.doctors) ? doctorsData.doctors : doctorsData?.data ?? [];
  const patients = Array.isArray(patientsData?.patients) ? patientsData.patients : patientsData?.data ?? [];

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const patientId = userRole === Role.RECEPTIONIST ? selectedPatientId : initialPatientId;

  const [doctorId, setDoctorId] = useState("");
  const [duration, setDuration] = useState(30);
  const [proposedSlots, setProposedSlots] = useState<Array<{ date: string; time: string }>>([
    { date: "", time: "" },
    { date: "", time: "" },
    { date: "", time: "" },
  ]);
  const [notes, setNotes] = useState("");

  const addSlot = () => {
    if (proposedSlots.length < 4) {
      setProposedSlots([...proposedSlots, { date: "", time: "" }]);
    }
  };

  const removeSlot = (index: number) => {
    if (proposedSlots.length > 3) {
      setProposedSlots(proposedSlots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index: number, field: "date" | "time", value: string) => {
    const updated = [...proposedSlots];
    updated[index] = { ...updated[index], [field]: value };
    setProposedSlots(updated);
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const handleSubmit = async () => {
    if (!clinicId) return;

    const validSlots = proposedSlots.filter((s) => s.date && s.time);
    if (validSlots.length < 3) {
      return;
    }

    await proposeMutation.mutateAsync({
      patientId,
      doctorId,
      clinicId,
      duration,
      proposedSlots: validSlots,
      notes: notes || undefined,
    });

    onOpenChange(false);
    setDoctorId("");
    setProposedSlots([{ date: "", time: "" }, { date: "", time: "" }, { date: "", time: "" }]);
    setNotes("");
  };

  const validSlots = proposedSlots.filter((s) => s.date && s.time).length;
  const canSubmit =
    doctorId &&
    validSlots >= 3 &&
    clinicId &&
    (userRole !== Role.RECEPTIONIST || selectedPatientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Propose Video Appointment</DialogTitle>
          <DialogDescription>
            Propose 3–4 time slots. The doctor will select one to confirm your video appointment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {userRole === Role.RECEPTIONIST && (
            <div className="grid gap-2">
              <Label>Patient</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p: { id: string; user?: { name?: string }; userId?: string }) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.user?.name ?? p.userId ?? p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Doctor</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doc: { id: string; user?: { name?: string; firstName?: string }; userId?: string }) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.user?.name ?? doc.user?.firstName ?? doc.userId ?? doc.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Duration (minutes)</Label>
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Proposed time slots (3–4)</Label>
            {proposedSlots.map((slot, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  type="date"
                  value={slot.date}
                  min={getMinDate()}
                  onChange={(e) => updateSlot(i, "date", e.target.value)}
                  className="w-32"
                />
                <Select value={slot.time} onValueChange={(v) => updateSlot(i, "time", v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {proposedSlots.length > 3 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {proposedSlots.length < 4 && (
              <Button type="button" variant="outline" size="sm" onClick={addSlot} className="gap-1 w-fit">
                <Plus className="h-4 w-4" />
                Add slot
              </Button>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for the doctor" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || proposeMutation.isPending}>
            {proposeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Proposing...
              </>
            ) : (
              "Propose Appointment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
