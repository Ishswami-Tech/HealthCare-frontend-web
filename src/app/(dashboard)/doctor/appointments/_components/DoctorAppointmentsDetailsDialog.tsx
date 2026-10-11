"use client";

import type { ReactNode } from "react";
import { CheckCircle, FileText, Loader2, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DialogBody, DialogShell, Divider, FactTile, Field, Kv, Note, Pill, statusLabel, statusTone, visitTypeLabel } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { TransformedAppointment } from "../page";
import { getPatientContact, joinRecordList } from "./appointmentLabels";

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
/** The longest text the complete-visit request accepts in one field. */
const VISIT_TEXT_LIMIT = 1000;

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
    <DialogShell
      open={!!selectedAppointment}
      onClose={() => setSelectedAppointment(null)}
      title={selectedAppointment ? `Patient Details: ${selectedAppointment.patientName}` : ""}
      description={
        selectedAppointment
          ? `${visitTypeLabel(selectedAppointment.type)} · ${selectedAppointment.appointmentDate} · ${selectedAppointment.time}`
          : undefined
      }
      width={900}
      stretch
      cornerClose
    >
      {selectedAppointment && (
        <DialogBody>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <FactTile label="Status">
              <Pill tone={statusTone(selectedAppointment.status)}>{statusLabel(selectedAppointment.status)}</Pill>
            </FactTile>
            <FactTile label="Visit type" value={visitTypeLabel(selectedAppointment.type)} />
            <FactTile label="Contact">
              <span className="min-w-0 [overflow-wrap:anywhere]">{getPatientContact(selectedAppointment)}</span>
            </FactTile>
            <FactTile label="Queue" value={String(selectedAppointment.queuePosition ?? "–")} />
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
                  <InfoBlock title="Chief Complaint">{selectedAppointment.chiefComplaint}</InfoBlock>
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
                <Field label="Diagnosis" htmlFor="diagnosis" className={FORM_CARD}>
                  <Input
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    maxLength={VISIT_TEXT_LIMIT}
                    placeholder="Enter diagnosis..."
                    disabled={selectedAppointmentIsClosed}
                  />
                </Field>

                <Field label="Consultation Notes" htmlFor="consultationNotes" className={FORM_CARD}>
                  <Textarea
                    id="consultationNotes"
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    maxLength={VISIT_TEXT_LIMIT}
                    placeholder="Enter detailed consultation notes..."
                    rows={4}
                    disabled={selectedAppointmentIsClosed}
                  />
                </Field>

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
                <Field label="Prescription & Treatment Plan" htmlFor="prescription" className={FORM_CARD}>
                  <Textarea
                    id="prescription"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    maxLength={VISIT_TEXT_LIMIT}
                    placeholder="Enter medications, dosage, and treatment instructions..."
                    rows={4}
                    disabled={selectedAppointmentIsClosed}
                  />
                </Field>

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
        </DialogBody>
      )}
    </DialogShell>
  );
}
