"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadError, Note, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { rxHref, visitHref } from "@/components/doctor/visit/visit-routes";
import { usePrescription } from "@/hooks/query/usePharmacy";
import { emptyPrescriptionForm, prescriptionToFormValues, type PrescriptionFormValues } from "./rx-form.logic";
import { RxPatientPicker } from "./RxPatientPicker";
import { useRxPatientContext, visitNoteOf } from "./useRxPatientContext";

/** A copy of a saved prescription for a new one: same medicines, diagnosis and advice; new rows, no follow-up date. */
function repeatValues(raw: unknown): PrescriptionFormValues {
  const saved = prescriptionToFormValues(raw);
  return {
    ...saved,
    followUpDate: "",
    medications: saved.medications.map((row, index) => ({ ...row, id: `repeat-${index}-${row.medicineId || row.name}` })),
  };
}

/**
 * DocNewPrescription (B6): full-page prescribing on the shared editor (`QuickPrescriptionModal`,
 * `presentation="page"`). Query: `?patientId=` and / or `?appointmentId=`; `?repeatFrom=<rxId>`
 * starts from a copy of that prescription ("Repeat" on the prescription detail). Without a patient the
 * doctor picks one first. With a visit, saving also completes it (doctor only).
 */
export function DoctorNewPrescriptionScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const repeatFrom = params.get("repeatFrom")?.trim() ?? "";
  const context = useRxPatientContext();
  const repeat = usePrescription(repeatFrom);

  const initialValues = useMemo<PrescriptionFormValues | undefined>(() => {
    if (repeatFrom) return repeat.data ? repeatValues(repeat.data) : undefined;
    const note = visitNoteOf(context.appointment);
    if (!note.diagnosis && !note.advice) return undefined;
    return { ...emptyPrescriptionForm(), diagnosis: note.diagnosis, advice: note.advice };
  }, [context.appointment, repeat.data, repeatFrom]);

  const back = context.appointmentId ? visitHref(context.appointmentId) : "/doctor/prescriptions";

  if (!context.patientId) {
    return (
      <TbdPage title="New prescription" backHref="/doctor/prescriptions" backLabel="Prescriptions">
        <RxPatientPicker clinicId={context.clinicId} actionLabel="Prescribe" />
      </TbdPage>
    );
  }

  const waitingForRepeat = Boolean(repeatFrom) && repeat.isPending;
  if (context.loading || waitingForRepeat || !context.doctorId) {
    return (
      <TbdPage title="New prescription" backHref={back} backLabel="Back">
        <Surface flush>
          <SkeletonRows rows={4} />
        </Surface>
      </TbdPage>
    );
  }

  if (context.error) {
    return (
      <TbdPage title="New prescription" backHref={back} backLabel="Back">
        <LoadError title="The patient could not be loaded" message="Check the connection and try again." onRetry={context.retry} />
      </TbdPage>
    );
  }

  return (
    <TbdPage title="New prescription" backHref={back} backLabel="Back">
      {repeatFrom && repeat.error ? (
        <Note tone="amber">The earlier prescription could not be loaded, so this one starts empty.</Note>
      ) : null}
      <QuickPrescriptionModal
        // Re-mount when the starting values arrive: the editor reads them once.
        key={repeatFrom ? `repeat-${repeatFrom}-${repeat.data ? "1" : "0"}` : `visit-${context.appointmentId}`}
        isOpen
        presentation="page"
        onClose={() => router.push(back)}
        patientId={context.patientId}
        patientName={context.patientName}
        doctorId={context.doctorId}
        {...(context.appointmentId ? { appointmentId: context.appointmentId } : {})}
        {...(context.patientSummary ? { patientSummary: context.patientSummary } : {})}
        {...(context.visitLabel ? { visitLabel: context.visitLabel } : {})}
        {...(context.visitStatus ? { visitStatus: context.visitStatus } : {})}
        {...(initialValues ? { initialValues } : {})}
        onSaved={(result) => {
          const query = context.appointmentId ? new URLSearchParams({ appointmentId: context.appointmentId }).toString() : undefined;
          router.push(result.prescriptionId ? rxHref(result.prescriptionId, "sent", query) : back);
        }}
      />
    </TbdPage>
  );
}
