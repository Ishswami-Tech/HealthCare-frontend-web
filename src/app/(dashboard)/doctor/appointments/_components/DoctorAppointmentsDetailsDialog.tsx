"use client";

import type { ReactNode } from "react";
import { CheckCircle, FileText, Loader2, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Divider, Kv, Note, Pill, statusLabel, statusTone } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { TransformedAppointment } from "../page";
import { getPatientContact, getVisitTypeLabel, joinRecordList } from "./appointmentLabels";

export type DoctorAppointmentDetailsTab = "patient-info" | "consultation" | "prescription";

interface DoctorAppointmentsDetailsDialogProps {
  selectedAppointment: TransformedAppointment | null;
  selectedAppointmentIsClosed: boolean;
  /** Tab shown when the dialog opens. A closed visit always opens on "patient-info". */
  initialTab?: DoctorAppointmentDetailsTab;
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

/** Bordered fact tile at the top of the dialog (status, visit type, contact, queue). */
function FactTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[14px] border border-hair bg-card px-3.5 py-3">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">{label}</span>
      <span className="flex min-w-0 text-sm font-bold text-ink">{children}</span>
    </div>
  );
}

/** Heading with one paragraph under it (complaint, history, allergies, medicines). */
function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="m-0 text-sm font-bold text-ink">{title}</h3>
      <p className="m-0 text-sm leading-normal text-ink-muted">{children}</p>
    </div>
  );
}

const INFO_CARD = "flex min-w-0 flex-col gap-3.5 rounded-2xl border border-hair bg-card p-4";
const FORM_CARD =
  "flex min-w-0 flex-col gap-2.5 rounded-2xl border border-hair bg-[#f8fafc] p-4 dark:bg-white/5";
const FIELD_LABEL = "text-xs font-bold text-ink-soft";

export function DoctorAppointmentsDetailsDialog({
  selectedAppointment,
  selectedAppointmentIsClosed,
  initialTab = "patient-info",
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
  const vitals = selectedAppointment?.vitalSigns ?? null;

  return (
    <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[900px]">
        {selectedAppointment && (
          <>
            <DialogHeader className="gap-0.5 px-6 pb-3.5 pt-[22px] pr-16 text-left">
              <DialogTitle>Patient Details: {selectedAppointment.patientName}</DialogTitle>
              <DialogDescription>
                {getVisitTypeLabel(selectedAppointment.type)} · {selectedAppointment.appointmentDate} ·{" "}
                {selectedAppointment.time}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-5 pt-1">
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                <FactTile label="Status">
                  <Pill tone={statusTone(selectedAppointment.status)}>{statusLabel(selectedAppointment.status)}</Pill>
                </FactTile>
                <FactTile label="Visit type">{getVisitTypeLabel(selectedAppointment.type)}</FactTile>
                <FactTile label="Contact">
                  <span className="min-w-0 [overflow-wrap:anywhere]">{getPatientContact(selectedAppointment) || "Not available"}</span>
                </FactTile>
                <FactTile label="Queue">{selectedAppointment.queuePosition ?? "–"}</FactTile>
              </div>

              <Tabs
                key={`${selectedAppointment.id}:${initialTab}`}
                defaultValue={selectedAppointmentIsClosed ? "patient-info" : initialTab}
                className="gap-4"
              >
                <TabsList>
                  <TabsTrigger value="patient-info">Patient Info</TabsTrigger>
                  <TabsTrigger value="consultation" disabled={selectedAppointmentIsClosed}>
                    Consultation
                  </TabsTrigger>
                  <TabsTrigger value="prescription" disabled={selectedAppointmentIsClosed}>
                    Prescription
                  </TabsTrigger>
                </TabsList>
                {selectedAppointmentIsClosed ? (
                  <p className="m-0 -mt-1.5 text-xs text-ink-muted">
                    This appointment is closed, so Consultation and Prescription are locked.
                  </p>
                ) : null}

                <TabsContent value="patient-info">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={INFO_CARD}>
                      <div className="flex flex-col gap-2">
                        <h3 className="m-0 text-sm font-bold text-ink">Contact Information</h3>
                        <span className="flex items-center gap-2 text-sm text-ink">
                          <Phone className="size-4 shrink-0 text-brand" aria-hidden="true" />
                          <span className="sr-only">Phone:</span>
                          <span className={cn("min-w-0 break-words", !selectedAppointment.patientPhone && "text-ink-muted")}>
                            {selectedAppointment.patientPhone || "Not available"}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 text-sm text-ink">
                          <MessageSquare className="size-4 shrink-0 text-brand" aria-hidden="true" />
                          <span className="sr-only">Email:</span>
                          <span className={cn("min-w-0 break-all", !selectedAppointment.patientEmail && "text-ink-muted")}>
                            {selectedAppointment.patientEmail || "Not available"}
                          </span>
                        </span>
                      </div>
                      <Divider />
                      <InfoBlock title="Chief Complaint">{selectedAppointment.chiefComplaint || "None recorded"}</InfoBlock>
                      <Divider />
                      <InfoBlock title="Medical History">{joinRecordList(selectedAppointment.medicalHistory)}</InfoBlock>
                    </div>

                    <div className={INFO_CARD}>
                      <div className="flex flex-col gap-2">
                        <h3 className="m-0 text-sm font-bold text-ink">Vital Signs</h3>
                        {vitals ? (
                          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                            <Kv label="BP" value={vitals.bp ?? "–"} />
                            <Kv label="Pulse" value={vitals.pulse ?? "–"} />
                            <Kv label="Temp" value={vitals.temperature ?? "–"} />
                            <Kv label="Weight" value={vitals.weight ?? "–"} />
                          </div>
                        ) : (
                          <p className="m-0 text-sm text-ink-muted">Not recorded for this visit.</p>
                        )}
                      </div>
                      <Divider />
                      <InfoBlock title="Allergies">{joinRecordList(selectedAppointment.allergies)}</InfoBlock>
                      <Divider />
                      <InfoBlock title="Current Medications">
                        {joinRecordList(selectedAppointment.currentMedications)}
                      </InfoBlock>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="consultation">
                  <div className="flex flex-col gap-3">
                    {selectedAppointmentIsClosed ? (
                      <Note tone="amber">
                        This appointment is closed. Consultation fields are read-only for completed, cancelled, and
                        no-show visits.
                      </Note>
                    ) : null}
                    <div className={FORM_CARD}>
                      <label htmlFor="diagnosis" className={FIELD_LABEL}>
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

                    <div className={FORM_CARD}>
                      <label htmlFor="consultationNotes" className={FIELD_LABEL}>
                        Consultation Notes
                      </label>
                      <Textarea
                        id="consultationNotes"
                        value={consultationNotes}
                        onChange={(e) => setConsultationNotes(e.target.value)}
                        placeholder="Enter detailed consultation notes..."
                        rows={4}
                        disabled={selectedAppointmentIsClosed}
                      />
                    </div>

                    <Button
                      size="md"
                      className="w-full"
                      onClick={() => saveConsultationDraft(selectedAppointment.id)}
                      disabled={updateAppointmentPending || selectedAppointmentIsClosed}
                    >
                      {updateAppointmentPending ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Saving draft…
                        </>
                      ) : selectedAppointmentIsClosed ? (
                        "Read only"
                      ) : (
                        <>
                          <FileText />
                          Save Draft
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="prescription">
                  <div className="flex flex-col gap-3">
                    {selectedAppointmentIsClosed ? (
                      <Note tone="amber">Prescription editing is disabled for closed appointments.</Note>
                    ) : null}
                    <div className={FORM_CARD}>
                      <label htmlFor="prescription" className={FIELD_LABEL}>
                        Prescription &amp; Treatment Plan
                      </label>
                      <Textarea
                        id="prescription"
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        placeholder="Enter medications, dosage, and treatment instructions..."
                        rows={4}
                        disabled={selectedAppointmentIsClosed}
                      />
                    </div>

                    <div className={cn(FORM_CARD, "gap-3")}>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="m-0 text-sm font-bold text-ink">Workflow actions</h3>
                        <p className="m-0 text-[13px] leading-normal text-ink-muted">
                          Save a draft first if you want to preserve interim notes before finalizing the prescription.
                        </p>
                      </div>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <Button
                          variant="outline"
                          size="md"
                          className="w-full"
                          onClick={() => saveConsultationDraft(selectedAppointment.id)}
                          disabled={updateAppointmentPending || selectedAppointmentIsClosed}
                        >
                          {updateAppointmentPending ? "Saving…" : selectedAppointmentIsClosed ? "Read only" : "Save as Draft"}
                        </Button>
                        <Button
                          size="md"
                          className="w-full"
                          onClick={() =>
                            completeConsultation(selectedAppointment.id, {
                              diagnosis,
                              prescription,
                              notes: consultationNotes,
                            })
                          }
                          disabled={completeAppointmentPending || selectedAppointmentIsClosed}
                        >
                          {completeAppointmentPending ? (
                            <>
                              <Loader2 className="animate-spin" />
                              Saving…
                            </>
                          ) : selectedAppointmentIsClosed ? (
                            "Read only"
                          ) : (
                            <>
                              <CheckCircle />
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
