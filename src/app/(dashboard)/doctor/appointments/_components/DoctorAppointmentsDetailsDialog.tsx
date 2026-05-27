"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, FileText, MessageSquare, Phone } from "lucide-react";
import type { TransformedAppointment } from "../page";

interface DoctorAppointmentsDetailsDialogProps {
  selectedAppointment: TransformedAppointment | null;
  selectedAppointmentIsClosed: boolean;
  diagnosis: string;
  prescription: string;
  consultationNotes: string;
  updateAppointmentPending: boolean;
  completeAppointmentPending: boolean;
  setSelectedAppointment: (value: TransformedAppointment | null) => void;
  setDiagnosis: (value: string) => void;
  setPrescription: (value: string) => void;
  setConsultationNotes: (value: string) => void;
  saveConsultationDraft: (appointmentId: string) => Promise<void>;
  completeConsultation: (
    appointmentId: string,
    data?: { diagnosis?: string; prescription?: string; notes?: string },
  ) => Promise<void>;
}

export function DoctorAppointmentsDetailsDialog({
  selectedAppointment,
  selectedAppointmentIsClosed,
  diagnosis,
  prescription,
  consultationNotes,
  updateAppointmentPending,
  completeAppointmentPending,
  setSelectedAppointment,
  setDiagnosis,
  setPrescription,
  setConsultationNotes,
  saveConsultationDraft,
  completeConsultation,
}: DoctorAppointmentsDetailsDialogProps) {
  return (
    <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-0">
        {selectedAppointment && (
          <div className="flex flex-col gap-y-4 p-5 sm:p-6">
            <DialogHeader className="flex flex-col gap-y-2 border-b border-border pb-4">
              <DialogTitle className="flex flex-col gap-1 text-left sm:flex-row sm:items-center sm:justify-between">
                <span>Patient Details: {selectedAppointment.patientName}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {selectedAppointment.type}  {selectedAppointment.time}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                <Badge className="mt-1">{selectedAppointment.status}</Badge>
              </div>
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Visit Type</p>
                <p className="mt-1 text-sm text-foreground">{selectedAppointment.type}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Contact</p>
                <p className="mt-1 text-sm text-foreground">{selectedAppointment.patientPhone || selectedAppointment.patientEmail || "Not available"}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Queue</p>
                <p className="mt-1 text-sm text-foreground">{selectedAppointment.queuePosition ?? "-"}</p>
              </div>
            </div>

            <Tabs defaultValue="patient-info" className="flex flex-col gap-y-4">
              <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl bg-muted p-1">
                <TabsTrigger value="patient-info">Patient Info</TabsTrigger>
                <TabsTrigger value="consultation" disabled={selectedAppointmentIsClosed}>
                  Consultation
                </TabsTrigger>
                <TabsTrigger value="prescription" disabled={selectedAppointmentIsClosed}>
                  Prescription
                </TabsTrigger>
              </TabsList>

              <TabsContent value="patient-info">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-y-4">
                    <div>
                      <h4 className="mb-2 font-semibold">Contact Information</h4>
                      <div className="flex flex-col gap-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="size-4" />
                          <span>{selectedAppointment.patientPhone || "Not available"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="size-4" />
                          <span>{selectedAppointment.patientEmail || "Not available"}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 font-semibold">Chief Complaint</h4>
                      <p className="text-sm text-muted-foreground">{selectedAppointment.chiefComplaint}</p>
                    </div>

                    <div>
                      <h4 className="mb-2 font-semibold">Medical History</h4>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(selectedAppointment.medicalHistory)
                          ? selectedAppointment.medicalHistory.join(", ") || "None"
                          : selectedAppointment.medicalHistory || "None"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-y-4">
                    {selectedAppointment.vitalSigns && (
                      <div>
                        <h4 className="mb-2 font-semibold">Vital Signs</h4>
                        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                          <div>BP: {selectedAppointment.vitalSigns.bp ?? "-"}</div>
                          <div>Pulse: {selectedAppointment.vitalSigns.pulse ?? "-"}</div>
                          <div>Temp: {selectedAppointment.vitalSigns.temperature ?? "-"}</div>
                          <div>Weight: {selectedAppointment.vitalSigns.weight ?? "-"}</div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="mb-2 font-semibold">Allergies</h4>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(selectedAppointment.allergies)
                          ? selectedAppointment.allergies.join(", ") || "None"
                          : selectedAppointment.allergies || "None"}
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-2 font-semibold">Current Medications</h4>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(selectedAppointment.currentMedications)
                          ? selectedAppointment.currentMedications.join(", ") || "None"
                          : selectedAppointment.currentMedications || "None"}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="consultation">
                {selectedAppointmentIsClosed ? (
                  <div className="mb-4 rounded-xl border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                    This appointment is closed. Consultation fields are read-only for completed, cancelled, and no-show visits.
                  </div>
                ) : null}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <label htmlFor="diagnosis" className="mb-2 block text-sm font-medium">
                      Diagnosis
                    </label>
                    <Input
                      id="diagnosis"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="Enter diagnosis..."
                      disabled={selectedAppointmentIsClosed}
                    />
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <label htmlFor="consultationNotes" className="mb-2 block text-sm font-medium">
                      Consultation Notes
                    </label>
                    <Textarea
                      id="consultationNotes"
                      value={consultationNotes}
                      onChange={(e) => setConsultationNotes(e.target.value)}
                      placeholder="Enter detailed consultation notes..."
                      rows={6}
                      disabled={selectedAppointmentIsClosed}
                    />
                  </div>

                  <Button
                    className="h-10 w-full rounded-xl lg:col-span-2"
                    onClick={() => {
                      if (selectedAppointment) {
                        saveConsultationDraft(selectedAppointment.id);
                      }
                    }}
                    disabled={updateAppointmentPending || selectedAppointmentIsClosed}
                  >
                    {updateAppointmentPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving draft…
                      </>
                    ) : selectedAppointmentIsClosed ? (
                      "Read only"
                    ) : (
                      <>
                        <FileText className="mr-2 size-4" />
                        Save Draft
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="prescription">
                {selectedAppointmentIsClosed ? (
                  <div className="mb-4 rounded-xl border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                    Prescription editing is disabled for closed appointments.
                  </div>
                ) : null}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <label htmlFor="prescription" className="mb-2 block text-sm font-medium">
                      Prescription & Treatment Plan
                    </label>
                    <Textarea
                      id="prescription"
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      placeholder="Enter medications, dosage, and treatment instructions..."
                      rows={8}
                      disabled={selectedAppointmentIsClosed}
                    />
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex flex-col gap-y-2">
                      <p className="text-sm font-medium text-foreground">Workflow actions</p>
                      <p className="text-sm text-muted-foreground">
                        Save a draft first if you want to preserve interim notes before finalizing the prescription.
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        className="h-10 w-full rounded-xl"
                        onClick={() => selectedAppointment && saveConsultationDraft(selectedAppointment.id)}
                        disabled={updateAppointmentPending || selectedAppointmentIsClosed}
                      >
                        {updateAppointmentPending ? "Saving…" : selectedAppointmentIsClosed ? "Read only" : "Save as Draft"}
                      </Button>
                      <Button
                        className="h-10 w-full rounded-xl"
                        onClick={() => {
                          if (selectedAppointment) {
                            completeConsultation(selectedAppointment.id, {
                              diagnosis,
                              prescription,
                              notes: consultationNotes,
                            });
                          }
                        }}
                        disabled={completeAppointmentPending || selectedAppointmentIsClosed}
                      >
                        {completeAppointmentPending ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Saving…
                          </>
                        ) : selectedAppointmentIsClosed ? (
                          "Read only"
                        ) : (
                          <>
                            <CheckCircle className="mr-2 size-4" />
                            Generate Prescription
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
