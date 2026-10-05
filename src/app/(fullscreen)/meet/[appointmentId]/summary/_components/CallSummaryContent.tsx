"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAppointment } from "@/hooks/query/useAppointments";
import { useGeneratePrescriptionPDF, usePatientPrescriptions } from "@/hooks/query/useMedicalRecords";
import {
  useConsultationSummary,
  useRateConsultation,
  type VideoConsultationSummary,
  type VideoConsultationSummaryNote,
} from "@/hooks/query/useVideoAppointments";
import { getDashboardByRole } from "@/lib/config/routes";
import { formatDoctorDisplayName } from "@/lib/utils/appointmentUtils";
import { formatDateInIST, formatISODateInIST } from "@/lib/utils/date-time";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { buildVideoSessionMeetRoute } from "@/lib/utils/video-session-route";
import { statusLabel } from "@/components/tbd";
import { videoPortalLabel } from "@/components/video/lobby/VideoStageShell";
import {
  getAppointmentDoctorPhoto,
  normalizeVideoViewerRole,
  videoAppointmentsRoute,
} from "@/components/video/lobby/videoVisitPeople";
import {
  CallSummaryView,
  type SummaryMedicine,
  type SummaryNoteBlock,
  type SummaryPrescription,
  type SummaryRating,
} from "./CallSummaryView";

type Row = Record<string, unknown>;

/** Appointment statuses in which the visit is still open (not completed, cancelled or expired). */
const OPEN_VISIT_STATUSES = ["SCHEDULED", "CONFIRMED", "WAITING", "IN_PROGRESS"];
/** The backend accepts a rating once the visit has taken place. */
const RATEABLE_STATUSES = ["COMPLETED", "IN_PROGRESS"];

const NOTE_HEADINGS: Record<string, string> = {
  GENERAL: "Note",
  DIAGNOSIS: "Diagnosis",
  SYMPTOM: "Symptoms",
  TREATMENT: "Treatment plan",
  TREATMENT_PLAN: "Treatment plan",
  PRESCRIPTION: "Prescription note",
};

function asRow(value: unknown): Row | null {
  return value && typeof value === "object" ? (value as Row) : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function joinParts(...parts: unknown[]): string {
  return parts.map(text).filter(Boolean).join(" · ");
}

/** The list the prescriptions endpoint returned, whatever envelope it came in. */
function prescriptionRows(data: unknown): Row[] {
  const record = asRow(data);
  const list = Array.isArray(data)
    ? data
    : Array.isArray(record?.prescriptions)
      ? record.prescriptions
      : Array.isArray(record?.data)
        ? record.data
        : [];
  return list.map(asRow).filter((row): row is Row => row !== null);
}

/**
 * The prescription written for this visit. Prescriptions carry no appointment id, so it is the
 * newest one from the same doctor dated on the day of the visit.
 */
function findVisitPrescription(rows: Row[], summary: VideoConsultationSummary): Row | null {
  const doctorUserId = summary.participants.find((person) => person.role === "doctor")?.userId ?? "";
  const visitDays = new Set(
    [summary.startTime, summary.endTime, summary.appointmentDate]
      .filter((value): value is string => Boolean(value))
      .map((value) => formatISODateInIST(value))
      .filter(Boolean),
  );
  if (visitDays.size === 0) return null;
  return (
    rows.find((row) => {
      const written = text(row.date) || text(row.createdAt);
      if (!written || !visitDays.has(formatISODateInIST(written))) return false;
      const doctor = asRow(row.doctor);
      const rowDoctorUserId = text(doctor?.userId) || text(asRow(doctor?.user)?.id);
      return !doctorUserId || !rowDoctorUserId || rowDoctorUserId === doctorUserId;
    }) ?? null
  );
}

function prescriptionMedicines(prescription: Row): SummaryMedicine[] {
  const items = Array.isArray(prescription.items)
    ? prescription.items
    : Array.isArray(prescription.medications)
      ? prescription.medications
      : [];
  return items
    .map(asRow)
    .filter((item): item is Row => item !== null)
    .map((item, index) => ({
      id: text(item.id) || `item-${index}`,
      name: text(asRow(item.medicine)?.name) || text(item.medicineName) || text(item.name) || "Medicine",
      detail: joinParts(item.dosage, item.frequency, item.duration, item.instructions),
    }));
}

function noteMedicines(notes: VideoConsultationSummaryNote[]): SummaryMedicine[] {
  return notes.flatMap((note) =>
    (note.prescription?.medications ?? [])
      .filter((medicine) => text(medicine?.name))
      .map((medicine, index) => ({
        id: `${note.id}-${index}`,
        name: text(medicine.name),
        detail: joinParts(medicine.dosage, medicine.frequency, medicine.duration, medicine.instructions),
      })),
  );
}

function noteBlocks(notes: VideoConsultationSummaryNote[]): SummaryNoteBlock[] {
  const blocks: SummaryNoteBlock[] = [];
  for (const note of notes) {
    const plan = note.treatmentPlan ?? null;
    const lines = [
      { label: "Diagnosis", value: text(plan?.diagnosis) },
      { label: "Treatment", value: text(plan?.treatment) },
    ].filter((line) => line.value);
    const list = [
      ...(plan?.recommendations ?? []).map(text),
      ...(note.symptoms ?? []).map((symptom) => {
        const name = text(symptom?.symptom);
        const extra = [text(symptom?.severity), text(symptom?.duration)].filter(Boolean).join(", ");
        return name ? `${name}${extra ? ` (${extra})` : ""}` : "";
      }),
    ].filter(Boolean);
    const body = text(note.content);
    if (!body && lines.length === 0 && list.length === 0) continue;
    blocks.push({
      id: note.id,
      heading: text(note.title) || NOTE_HEADINGS[String(note.noteType ?? "").toUpperCase()] || "Note",
      ...(body ? { text: body } : {}),
      ...(lines.length ? { lines } : {}),
      ...(list.length ? { list } : {}),
    });
  }
  return blocks;
}

function bannerTitleFor(status: string): string {
  if (status === "COMPLETED") return "Consultation completed";
  if (status === "IN_PROGRESS") return "Visit in progress";
  if (OPEN_VISIT_STATUSES.includes(status)) return "Visit not completed yet";
  return status ? `Visit ${statusLabel(status).toLowerCase()}` : "Video visit";
}

/**
 * Consultation Summary for one video visit: what the summary endpoint returns (who, when, how long,
 * the doctor's notes, the rating) plus the prescription written that day, with its PDF.
 */
export function CallSummaryContent({ appointmentId }: { appointmentId: string }) {
  const { session } = useAuth();
  const role = normalizeVideoViewerRole(session?.user?.role);
  const viewerIsPatient = role === "" || role === "PATIENT";

  const summaryQuery = useConsultationSummary(appointmentId);
  const summary = summaryQuery.data ?? null;
  // Only for the doctor's photo; the page does not wait for it.
  const { data: appointmentData } = useAppointment(appointmentId);

  const patientUserId = viewerIsPatient
    ? String(session?.user?.id ?? "")
    : (summary?.participants.find((person) => person.role === "patient")?.userId ?? "");
  const prescriptionsQuery = usePatientPrescriptions(summary ? patientUserId : "");
  const pdf = useGeneratePrescriptionPDF();
  const rate = useRateConsultation();

  const [savedRating, setSavedRating] = useState(0);
  const [ratingSaved, setRatingSaved] = useState(false);
  const [ratingError, setRatingError] = useState("");

  const appointmentStatus = String(summary?.appointmentStatus ?? "").toUpperCase();
  const visitOpen = OPEN_VISIT_STATUSES.includes(appointmentStatus);

  const notes = useMemo(() => summary?.notes ?? [], [summary]);
  const visitPrescription = useMemo(
    () => (summary ? findVisitPrescription(prescriptionRows(prescriptionsQuery.data), summary) : null),
    [prescriptionsQuery.data, summary],
  );
  const visitPrescriptionId = text(visitPrescription?.id);

  const downloadPdf = pdf.mutate;
  const handleDownload = useCallback(() => {
    if (!visitPrescriptionId) return;
    downloadPdf(visitPrescriptionId, {
      onSuccess: (result: { pdfUrl?: string } | undefined) => {
        if (!result?.pdfUrl) return;
        const opened = window.open(result.pdfUrl, "_blank", "noopener,noreferrer");
        if (!opened) window.location.assign(result.pdfUrl);
      },
    });
  }, [downloadPdf, visitPrescriptionId]);

  const prescription: SummaryPrescription = useMemo(() => {
    if (visitPrescription) {
      return {
        state: "ready",
        ...(visitPrescriptionId ? { number: `RX-${visitPrescriptionId.slice(0, 8).toUpperCase()}` } : {}),
        medicines: prescriptionMedicines(visitPrescription),
        ...(visitPrescriptionId ? { onDownload: handleDownload } : {}),
        isDownloading: pdf.isPending,
      };
    }
    const fromNotes = noteMedicines(notes);
    if (fromNotes.length > 0) return { state: "ready", medicines: fromNotes, fromNotes: true };
    if (patientUserId && prescriptionsQuery.isPending) return { state: "loading", medicines: [] };
    if (prescriptionsQuery.error) return { state: "error", medicines: [] };
    return { state: "empty", medicines: [] };
  }, [
    handleDownload,
    notes,
    patientUserId,
    pdf.isPending,
    prescriptionsQuery.error,
    prescriptionsQuery.isPending,
    visitPrescription,
    visitPrescriptionId,
  ]);

  const blocks = useMemo(() => {
    const fromPrescription: SummaryNoteBlock[] = [];
    const diagnosis = text(visitPrescription?.diagnosis);
    const advice = text(visitPrescription?.notes);
    if (diagnosis) fromPrescription.push({ id: "rx-diagnosis", heading: "Diagnosis", text: diagnosis });
    if (advice) fromPrescription.push({ id: "rx-advice", heading: "Advice", text: advice });
    return [...fromPrescription, ...noteBlocks(notes)];
  }, [notes, visitPrescription]);
  const followUp = useMemo(
    () => notes.map((note) => text(note.treatmentPlan?.followUp)).find(Boolean) ?? "",
    [notes],
  );

  const rateAsync = rate.mutateAsync;
  const consultationId = summary?.consultationId ?? "";
  const handleRate = useCallback(
    (stars: number) => {
      if (!appointmentId) return;
      setRatingError("");
      rateAsync({ appointmentId, rating: stars, ...(consultationId ? { consultationId } : {}) })
        .then((result) => {
          setSavedRating(Number(result?.rating) || stars);
          setRatingSaved(true);
        })
        .catch((error: unknown) => {
          setRatingSaved(false);
          const reason = sanitizeErrorMessage(error);
          setRatingError(`Your rating was not saved. ${reason || "Please try again."}`);
        });
    },
    [appointmentId, consultationId, rateAsync],
  );

  const ratingValue = savedRating || summary?.myRating?.rating || 0;
  const rating: SummaryRating = {
    mode: viewerIsPatient
      ? RATEABLE_STATUSES.includes(appointmentStatus)
        ? "rate"
        : "hidden"
      : ratingValue || appointmentStatus === "COMPLETED"
        ? "readonly"
        : "hidden",
    value: ratingValue,
    pending: rate.isPending,
    saved: ratingSaved,
    ...(ratingError ? { error: ratingError } : {}),
    onRate: handleRate,
  };

  const doctorName =
    summary?.doctorName && summary.doctorName !== "Doctor" ? formatDoctorDisplayName(summary.doctorName) : "";
  const patientName = summary?.patientName && summary.patientName !== "Patient" ? summary.patientName : "";
  const personName = viewerIsPatient ? doctorName || "Your doctor" : patientName || "Patient";
  const visitDate = summary?.startTime || summary?.appointmentDate || "";
  const sameYear = visitDate ? formatISODateInIST(visitDate).slice(0, 4) === formatISODateInIST(new Date()).slice(0, 4) : true;
  const bannerLine = [
    personName,
    summary && summary.durationSeconds > 0 ? `${Math.max(1, Math.round(summary.durationSeconds / 60))} min` : "",
    visitDate
      ? formatDateInIST(visitDate, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) })
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const appointmentRecord = asRow(appointmentData);
  const doctorPhotoUrl = viewerIsPatient
    ? getAppointmentDoctorPhoto(asRow(appointmentRecord?.appointment) ?? asRow(appointmentRecord?.data) ?? appointmentRecord)
    : undefined;

  const appointmentsHref = videoAppointmentsRoute(role);
  const state = !appointmentId
    ? "missing"
    : summaryQuery.isPending
      ? "loading"
      : summaryQuery.error
        ? "error"
        : summary
          ? "ready"
          : "missing";

  return (
    <CallSummaryView
      portalLabel={videoPortalLabel(role)}
      backHref={appointmentsHref}
      backLabel="Back to appointments"
      closeHref={appointmentsHref}
      homeHref={role ? getDashboardByRole(role) : "/patient/dashboard"}
      viewerIsPatient={viewerIsPatient}
      state={state}
      {...(summaryQuery.error ? { errorMessage: sanitizeErrorMessage(summaryQuery.error) } : {})}
      onRetry={() => void summaryQuery.refetch()}
      personName={personName}
      {...(doctorPhotoUrl ? { personPhotoUrl: doctorPhotoUrl } : {})}
      bannerTitle={bannerTitleFor(appointmentStatus)}
      bannerLine={bannerLine}
      statusCode={appointmentStatus}
      {...(visitOpen ? { rejoinHref: buildVideoSessionMeetRoute(appointmentId) } : {})}
      prescription={prescription}
      {...(viewerIsPatient ? { medicinesHref: "/patient/health/medicines" } : {})}
      notes={blocks}
      {...(followUp ? { followUp } : {})}
      {...(viewerIsPatient ? { followUpHref: "/patient/appointments?openBooking=1&mode=VIDEO" } : {})}
      rating={rating}
    />
  );
}
