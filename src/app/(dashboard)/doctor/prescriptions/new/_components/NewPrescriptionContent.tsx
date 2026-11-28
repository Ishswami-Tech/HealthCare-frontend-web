"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadError, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { QuickPrescriptionModal, type PrescriptionSavedResult } from "@/components/doctor/QuickPrescriptionModal";
import { RxPatientPicker } from "@/components/doctor/rx/RxPatientPicker";
import { emptyPrescriptionForm, prescriptionToFormValues } from "@/components/doctor/rx/rx-form.logic";
import { useRxPatientContext, visitNoteOf } from "@/components/doctor/rx/useRxPatientContext";
import { usePrescription } from "@/hooks/query/usePharmacy";

/**
 * DocNewPrescription: the quick-Rx editor as a page. With `?appointmentId=` it carries the visit
 * note (diagnosis, advice) written on the diagnosis screen and "Save and complete" finishes the visit.
 * With `?repeatFrom=<prescriptionId>` (the "Repeat" button of a prescription) the medicines and the
 * diagnosis of that prescription are copied in; the follow-up date is left for the doctor to pick.
 */
export function NewPrescriptionContent() {
  const router = useRouter();
  const context = useRxPatientContext();
  const note = visitNoteOf(context.appointment);
  const repeatFrom = useSearchParams()?.get("repeatFrom") ?? "";
  const repeat = usePrescription(repeatFrom);
  const repeatLoading = Boolean(repeatFrom) && repeat.isPending;
  const initialValues = useMemo(() => {
    const base = repeatFrom && repeat.data ? { ...prescriptionToFormValues(repeat.data), followUpDate: "" } : emptyPrescriptionForm();
    return {
      ...base,
      diagnosis: note.diagnosis || base.diagnosis,
      advice: note.advice || base.advice,
    };
  }, [note.advice, note.diagnosis, repeat.data, repeatFrom]);

  const onSaved = (result: PrescriptionSavedResult) => {
    router.push(result.prescriptionId ? `/doctor/prescriptions/${encodeURIComponent(result.prescriptionId)}/sent` : "/doctor/prescriptions");
  };

  const page = (children: ReactNode) => (
    <TbdPage
      title="New prescription"
      description={context.patientId ? "Medicines from pharmacy stock, kits or voice. No prices are shown." : "Choose the patient to prescribe for."}
      backHref={context.appointmentId ? "/doctor/appointments" : "/doctor/prescriptions"}
      backLabel={context.appointmentId ? "Appointments" : "Prescriptions"}
    >
      {children}
    </TbdPage>
  );

  if (!context.patientId) {
    return page(context.loading ? <Surface flush><SkeletonRows rows={3} /></Surface> : <RxPatientPicker clinicId={context.clinicId} actionLabel="Prescribe" />);
  }
  // The editor reads `initialValues` once: wait for the prescription being repeated.
  if (context.loading || repeatLoading) {
    return page(
      <Surface flush>
        <SkeletonRows rows={4} />
      </Surface>,
    );
  }
  if (context.error && !context.appointment && context.appointmentId) {
    return page(
      <Surface flush>
        <LoadError title="The visit could not be loaded" message="Check the connection and try again." onRetry={context.retry} />
      </Surface>,
    );
  }

  return page(
    <QuickPrescriptionModal
      presentation="page"
      isOpen
      onClose={() => router.back()}
      {...(context.appointmentId ? { appointmentId: context.appointmentId } : {})}
      patientId={context.patientId}
      patientName={context.patientName}
      doctorId={context.doctorId}
      {...(context.patientSummary ? { patientSummary: context.patientSummary } : {})}
      {...(context.visitLabel ? { visitLabel: context.visitLabel } : {})}
      {...(context.visitStatus ? { visitStatus: context.visitStatus } : {})}
      {...(note.complaint ? { consultationNotes: note.complaint } : {})}
      initialValues={initialValues}
      onSaved={onSaved}
    />,
  );
}
