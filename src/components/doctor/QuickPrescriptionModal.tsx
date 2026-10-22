"use client";

import { useMemo, useState } from "react";
import { useCompleteAppointment } from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useMedicineFavourites, useRxKits } from "@/hooks/query/useDoctorFavourites";
import { useCreateEhrPrescriptionNote } from "@/hooks/query/useMedicalRecords";
import { useCreatePrescription } from "@/hooks/query/usePharmacy";
import { usePrescriptions, useUpdatePrescription } from "@/hooks/query/usePrescriptions";
import { PrescriptionEditor, type PrescriptionEditorMode } from "./rx/PrescriptionEditor";
import { usePrescriptionCatalogue } from "./rx/usePrescriptionCatalogue";
import {
  formatMedicationSummary,
  readPrescriptionId,
  readPrescriptionReference,
  toPrescriptionItems,
  type PrescriptionFormValues,
  type PrescriptionMedicationRow,
} from "./rx/rx-form.logic";
import { recentMedicineIds } from "./rx/rx-shortcuts.logic";

export type { PrescriptionFormValues, PrescriptionMedicationRow } from "./rx/rx-form.logic";

/** What was really saved. The caller uses it for its confirmation message. */
export interface PrescriptionSavedResult {
  appointmentId?: string;
  /** True when the appointment was completed as part of this save. */
  appointmentCompleted: boolean;
  patientName: string;
  /** Medicines saved to the pharmacy prescription. */
  pharmacyMedicineCount: number;
  /** Medicines that are not in pharmacy stock: written in the visit notes only. */
  outsideMedicineCount: number;
  prescriptionNumber: string | null;
  /** Id of the saved pharmacy prescription (a draft in draft mode), when one was created or edited. */
  prescriptionId: string | null;
  /** True when it was saved as a draft for the doctor to approve (nothing went to the pharmacy). */
  isDraft: boolean;
  followUpDate: string | null;
}

/**
 * Who is writing:
 * - "doctor": the doctor prescribes; with a visit, saving also completes it.
 * - "assistantDraft": the assistant doctor drafts. The server stores it as a DRAFT for the doctor to
 *   approve (POST /pharmacy/prescriptions as ASSISTANT_DOCTOR); the visit is never completed and only
 *   pharmacy-stock medicines can be added.
 */
export type PrescriptionAuthoringMode = "doctor" | "assistantDraft" | /** @deprecated same as "assistantDraft" */ "draft";

export interface QuickPrescriptionModalProps {
  /** Dialog only; a page is always shown. */
  isOpen: boolean;
  onClose: () => void;
  /** Omit when prescribing directly from a patient record with no active appointment. */
  appointmentId?: string;
  /** Patient-record id. */
  patientId: string;
  patientName: string;
  /** Doctor-record id of the prescribing doctor. */
  doctorId: string;
  /** "38 years · Female" — shown under the patient name. */
  patientSummary?: string;
  /** "In-clinic · 12:00 pm" — the visit this prescription belongs to. */
  visitLabel?: string;
  /** Appointment status code, for the status tag. */
  visitStatus?: string;
  /** Notes the doctor wrote during the consultation; saved with the visit. */
  consultationNotes?: string;
  /** Defaults to "doctor". */
  mode?: PrescriptionAuthoringMode;
  /** "dialog" (default) or "page" for the full-page new / edit screens. */
  presentation?: "dialog" | "page";
  /** Starting values, for example the diagnosis written on the visit note, or a saved prescription. */
  initialValues?: PrescriptionFormValues;
  /** Edits this saved, not-yet-dispensed prescription (PATCH) instead of creating one. */
  editPrescriptionId?: string;
  onSaved?: (result: PrescriptionSavedResult) => void | Promise<void>;
}

/** The step that already succeeded, so a retry does not send the medicines twice. */
interface SaveProgress {
  pharmacy: { reference: string | null; medicineCount: number } | null;
  /** True once the note-only (advice / diagnosis) prescription was saved, so a retry skips it. */
  note?: boolean;
}

/** The longest text the complete-visit request accepts in one field. */
const VISIT_TEXT_LIMIT = 1000;

function QuickPrescriptionSession({
  isOpen,
  onClose,
  appointmentId,
  patientId,
  patientName,
  doctorId,
  patientSummary,
  visitLabel,
  visitStatus,
  consultationNotes,
  mode: authoringMode = "doctor",
  presentation = "dialog",
  initialValues,
  editPrescriptionId,
  onSaved,
}: QuickPrescriptionModalProps) {
  const isDraft = authoringMode === "assistantDraft" || authoringMode === "draft";
  const isEdit = Boolean(editPrescriptionId);
  const active = presentation === "page" || isOpen;
  const { clinicId } = useClinicContext();
  const [progress, setProgress] = useState<SaveProgress>({ pharmacy: null });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const completeAppointment = useCompleteAppointment();
  const createPharmacyPrescription = useCreatePrescription();
  const updatePrescription = useUpdatePrescription();
  const createEhrNote = useCreateEhrPrescriptionNote();
  const catalogue = usePrescriptionCatalogue(clinicId || "");

  // Shortcuts are per account (doctor or assistant). Recent medicines come from the doctor's own
  // prescriptions; the assistant cannot list prescriptions, so the tab stays empty for drafts.
  const favourites = useMedicineFavourites(catalogue.medicines, { enabled: active });
  const kits = useRxKits({ enabled: active });
  const ownPrescriptions = usePrescriptions(doctorId, undefined, { enabled: active && !isDraft });
  const recentIds = useMemo(() => recentMedicineIds(ownPrescriptions.data?.prescriptions), [ownPrescriptions.data]);

  const editorMode: PrescriptionEditorMode = isEdit ? "edit" : isDraft ? "draft" : appointmentId ? "complete" : "save";

  const handleEdit = async (form: PrescriptionFormValues): Promise<boolean> => {
    if (!editPrescriptionId) return false;
    const items = toPrescriptionItems(form.medications);
    if (items.length === 0) return false;
    setErrorMessage(null);
    try {
      await updatePrescription.mutateAsync({
        prescriptionId: editPrescriptionId,
        updates: {
          items,
          diagnosis: form.diagnosis.trim(),
          notes: form.advice.trim(),
          ...(form.followUpDate ? { validUntil: form.followUpDate } : {}),
        },
      });
      await onSaved?.({
        appointmentCompleted: false,
        patientName,
        pharmacyMedicineCount: items.length,
        outsideMedicineCount: 0,
        prescriptionNumber: null,
        prescriptionId: editPrescriptionId,
        isDraft,
        followUpDate: form.followUpDate || null,
      });
      return true;
    } catch (error) {
      console.error("Failed to update prescription:", error);
      setErrorMessage(
        "The changes could not be saved. The prescription may already be dispensed or cancelled; reload and check its status.",
      );
      return false;
    }
  };

  const handleCreate = async (form: PrescriptionFormValues): Promise<boolean> => {
    const cleanMedications = form.medications.reduce<PrescriptionMedicationRow[]>((acc, medication) => {
      const normalized = {
        ...medication,
        medicineId: medication.medicineId.trim(),
        name: medication.name.trim(),
        dosage: medication.dosage.trim(),
        frequency: medication.frequency.trim(),
        quantity: medication.quantity.trim(),
      };
      if (normalized.name || normalized.medicineId) acc.push(normalized);
      return acc;
    }, []);

    const diagnosis = form.diagnosis.trim();
    const advice = form.advice.trim();
    const notes = (consultationNotes || "").trim();
    const followUpDate = form.followUpDate;
    const followUpNotes = form.followUpNotes.trim();

    if (!diagnosis && !advice && cleanMedications.length === 0) {
      return false;
    }

    const structuredMedications = toPrescriptionItems(cleanMedications);
    const outsideMedicineCount = cleanMedications.length - structuredMedications.length;
    const prescriptionText = cleanMedications
      .flatMap((medication) => {
        const summary = formatMedicationSummary(medication);
        return summary ? [summary] : [];
      })
      .join("\n");

    setErrorMessage(null);
    let saved = progress;
    let savedId: string | null = null;
    let step: "pharmacy" | "note" | "complete" = "pharmacy";

    try {
      // No stock medicine: the diagnosis and advice would otherwise live only on the visit. They
      // are saved as a note-only prescription (POST /ehr/prescriptions) — listed as "Advice only",
      // printable as a PDF and visible to the patient, with no pharmacy stage. This holds with or
      // without a visit; a retry after a failed completion does not save it twice.
      if (!isDraft && structuredMedications.length === 0 && (diagnosis || advice) && !saved.note) {
        step = "note";
        await createEhrNote.mutateAsync({
          patientId,
          ...(doctorId ? { doctorId } : {}),
          ...(diagnosis ? { diagnosis } : {}),
          ...(advice ? { notes: advice } : {}),
        });
        saved = { ...saved, note: true };
        setProgress(saved);
      }

      // 1. The pharmacy prescription: only medicines picked from pharmacy stock go to the pharmacy.
      if (!saved.pharmacy && structuredMedications.length > 0) {
        if (!clinicId) {
          setErrorMessage("No clinic is selected, so the medicines cannot be sent to the pharmacy.");
          return false;
        }
        const created = await createPharmacyPrescription.mutateAsync({
          clinicId,
          patientId,
          doctorId,
          medications: structuredMedications,
          ...(diagnosis ? { diagnosis } : {}),
          ...(advice ? { notes: advice } : {}),
          ...(followUpDate ? { validUntil: followUpDate } : {}),
        });
        savedId = readPrescriptionId(created);
        saved = {
          ...saved,
          pharmacy: { reference: readPrescriptionReference(created), medicineCount: structuredMedications.length },
        };
        setProgress(saved);
      }

      // The visit record. The appointment has no diagnosis or prescription columns: the
      // backend keeps this text in the appointment metadata, and completing a visit merges
      // the metadata it is given. So the record is saved by the same request that completes
      // the visit, and there is no step in between that could fail on its own.
      const metadata = {
        prescriptionIssued: cleanMedications.length > 0,
        medicineSkipped: cleanMedications.length === 0,
        medicineCount: cleanMedications.length,
        sentToPharmacy: Boolean(saved.pharmacy),
        pharmacyMedicineCount: saved.pharmacy?.medicineCount ?? 0,
        ...(saved.pharmacy?.reference ? { pharmacyPrescriptionReference: saved.pharmacy.reference } : {}),
        consultationDraft: {
          diagnosis: diagnosis || null,
          notes: notes || null,
          treatmentPlan: advice || notes || null,
          prescription: prescriptionText || null,
          followUpDate: followUpDate || null,
          followUpNotes: followUpNotes || null,
          medicationCount: cleanMedications.length,
          savedAt: new Date().toISOString(),
          savedBy: doctorId,
        },
        source: "doctor-dashboard",
      };

      // No active appointment to attach consultation notes to when prescribing
      // directly from a patient record (e.g. a walk-in with no visit booked).
      if (appointmentId && !isDraft) {
        // 2. Complete the visit and save its record. Only fields the complete-visit request
        // accepts are sent; the follow-up note travels in the metadata above.
        step = "complete";
        await completeAppointment.mutateAsync({
          id: appointmentId,
          data: {
            ...(diagnosis ? { diagnosis } : {}),
            ...(notes || advice ? { notes: (notes || advice).slice(0, VISIT_TEXT_LIMIT) } : {}),
            ...(prescriptionText ? { prescription: prescriptionText.slice(0, VISIT_TEXT_LIMIT) } : {}),
            ...(followUpDate ? { followUpDate } : {}),
            metadata,
          },
        });
      }

      const result: PrescriptionSavedResult = {
        ...(appointmentId ? { appointmentId } : {}),
        appointmentCompleted: Boolean(appointmentId) && !isDraft,
        patientName,
        pharmacyMedicineCount: saved.pharmacy?.medicineCount ?? 0,
        outsideMedicineCount,
        prescriptionNumber: saved.pharmacy?.reference ?? null,
        prescriptionId: savedId,
        isDraft,
        followUpDate: followUpDate || null,
      };
      setProgress({ pharmacy: null });
      if (presentation === "dialog") onClose();
      await onSaved?.(result);
      return true;
    } catch (error) {
      console.error("Failed to save prescription:", { step, error });
      setErrorMessage(
        step === "note"
          ? "The prescription could not be saved to the patient's record. Nothing was saved. Please try again."
          : step === "pharmacy"
            ? "The medicines could not be sent to the pharmacy. Nothing was saved. Please try again."
            : saved.pharmacy
              ? "The medicines reached the pharmacy, but the visit is not completed yet. Press Save and complete again to finish."
              : saved.note
                ? "The advice was saved to the patient's prescriptions, but the visit is not completed yet. Press Save and complete again to finish."
              : "The visit could not be completed. Please try again.",
      );
      return false;
    }
  };

  const isSubmitting =
    createPharmacyPrescription.isPending || completeAppointment.isPending || createEhrNote.isPending || updatePrescription.isPending;

  return (
    <PrescriptionEditor
      presentation={presentation}
      isOpen={isOpen}
      onClose={onClose}
      patientName={patientName}
      {...(patientSummary ? { patientSummary } : {})}
      {...(visitLabel ? { visitLabel } : {})}
      {...(visitStatus ? { visitStatus } : {})}
      mode={editorMode}
      medicines={catalogue.medicines}
      isLoadingMedicines={catalogue.isLoading}
      stockMessage={catalogue.stockMessage}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      medicinesLocked={Boolean(progress.pharmacy)}
      {...(initialValues ? { initialValues } : {})}
      onSubmit={isEdit ? handleEdit : handleCreate}
      onSearchChange={catalogue.setSearchText}
      isSearching={catalogue.isSearching}
      shortcuts={{ favourites, kits, recentIds }}
    />
  );
}

/**
 * Prescribing screen (dialog by default, or a page). With an appointment, "Save and complete" sends
 * the stock medicines to the pharmacy, then completes the appointment and saves the visit record with
 * it. Without one (from a patient record) it saves the pharmacy prescription, or, with no stock
 * medicine, the diagnosis and advice as a prescription record in the patient's EHR. With
 * `editPrescriptionId` it edits that prescription. `mode="assistantDraft"` saves a draft for the
 * doctor to approve and never completes the visit.
 */
export function QuickPrescriptionModal(props: QuickPrescriptionModalProps) {
  // A new key per patient and visit gives each prescription its own empty form.
  return (
    <QuickPrescriptionSession
      key={`${props.editPrescriptionId || props.appointmentId || "direct"}:${props.patientId}`}
      {...props}
    />
  );
}
