"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChoiceChip,
  DialogError,
  EmptyBlock,
  InitialsAvatar,
  LoadError,
  Pill,
  SectionTitle,
  SkeletonRows,
  Surface,
  TbdPage,
  statusLabel,
  statusTone,
} from "@/components/tbd";
import { DiagnosisPicker } from "@/components/doctor/rx/DiagnosisPicker";
import { DictationButton } from "@/components/doctor/rx/VoiceInput";
import { useRxPatientContext, visitNoteOf } from "@/components/doctor/rx/useRxPatientContext";
import { useUpdateAppointment } from "@/hooks/query/useAppointments";
import { useStaffRole } from "@/hooks/utils/useStaffRole";

const SYMPTOMS = ["Fever", "Sore throat", "Cough", "Cold", "Body ache", "Headache", "Loss of appetite", "Loose motions", "Vomiting", "Acidity", "Breathlessness", "Joint pain"] as const;
const DURATIONS = ["1 day", "2 days", "3 days", "1 week", "2 weeks", "1 month"] as const;
const ADVICE_SNIPPETS = [
  { label: "Fever advice", text: "Paracetamol only if fever is above 100 °F. Sponge with lukewarm water." },
  { label: "Hydration", text: "Drink plenty of warm fluids, 2–3 litres a day." },
  { label: "Rest 2–3 days", text: "Rest for 2–3 days." },
  { label: "Steam inhalation", text: "Steam inhalation twice a day." },
  { label: "Acidity diet", text: "Avoid spicy, fried and late-night meals; eat small meals on time." },
  { label: "Review in 3 days", text: "Review in 3 days, or earlier if the fever crosses 102 °F or breathing becomes difficult." },
] as const;

const DURATION_PREFIX = "Duration: ";

/**
 * DocDiagnosis: the complaint, diagnosis (ICD codes, provisional / final) and examination & advice of
 * one OPD visit. Saved on the appointment's visit note (PUT /appointments/:id, `consultationDraft`),
 * which the prescription screen and the visit completion carry into the EHR.
 */
export function DiagnosisContent() {
  const router = useRouter();
  const fieldId = useId();
  const context = useRxPatientContext();
  const { canRunVisit } = useStaffRole();
  const saveVisit = useUpdateAppointment();

  // The form starts from the saved note once the visit has loaded (see the key on DiagnosisForm).
  const saved = useMemo(() => visitNoteOf(context.appointment), [context.appointment]);
  if (!context.appointmentId) {
    return (
      <TbdPage title="Complaint & diagnosis" backHref="/doctor/appointments" backLabel="Appointments">
        <Surface flush>
          <EmptyBlock
            icon={Stethoscope}
            title="Open the diagnosis from a visit"
            description="The diagnosis belongs to one OPD visit. Start it from the patient's appointment or the queue."
            action={
              <Link href="/queue" className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-[13px] font-bold text-primary-foreground">
                Open the queue
              </Link>
            }
          />
        </Surface>
      </TbdPage>
    );
  }
  if (context.loading) {
    return (
      <TbdPage title="Complaint & diagnosis">
        <Surface flush>
          <SkeletonRows rows={4} />
        </Surface>
      </TbdPage>
    );
  }
  if (!context.appointment) {
    return (
      <TbdPage title="Complaint & diagnosis" backHref="/doctor/appointments" backLabel="Appointments">
        <Surface flush>
          <LoadError title="The visit could not be loaded" message="Check the connection and try again." onRetry={context.retry} />
        </Surface>
      </TbdPage>
    );
  }

  return (
    <DiagnosisForm
      key={context.appointmentId}
      fieldId={fieldId}
      context={context}
      saved={saved}
      readOnly={!canRunVisit}
      saving={saveVisit.isPending}
      onSave={async (values, next) => {
        const data = {
          ...(values.complaint.trim() ? { notes: values.complaint.trim().slice(0, 1000) } : {}),
          ...(values.diagnosis.trim() ? { diagnosis: values.diagnosis.trim().slice(0, 1000) } : {}),
          ...(values.symptoms.length ? { symptoms: values.symptoms } : {}),
          ...(values.advice.trim() ? { treatmentPlan: values.advice.trim().slice(0, 2000) } : {}),
        };
        if (Object.keys(data).length > 0) await saveVisit.mutateAsync({ id: context.appointmentId, data });
        if (next) {
          router.push(
            `/doctor/prescriptions/new?appointmentId=${encodeURIComponent(context.appointmentId)}&patientId=${encodeURIComponent(context.patientId)}`,
          );
        }
      }}
    />
  );
}

interface DiagnosisValues {
  complaint: string;
  diagnosis: string;
  symptoms: string[];
  advice: string;
}

function DiagnosisForm({
  fieldId,
  context,
  saved,
  readOnly,
  saving,
  onSave,
}: {
  fieldId: string;
  context: ReturnType<typeof useRxPatientContext>;
  saved: ReturnType<typeof visitNoteOf>;
  readOnly: boolean;
  saving: boolean;
  onSave: (values: DiagnosisValues, continueToRx: boolean) => Promise<void>;
}) {
  const [complaint, setComplaint] = useState(saved.complaint);
  const [diagnosis, setDiagnosis] = useState(saved.diagnosis);
  const [advice, setAdvice] = useState(saved.advice);
  const [symptoms, setSymptoms] = useState<string[]>(saved.symptoms.filter((item) => !item.startsWith(DURATION_PREFIX)));
  const [duration, setDuration] = useState(
    saved.symptoms.find((item) => item.startsWith(DURATION_PREFIX))?.slice(DURATION_PREFIX.length) ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const append = (current: string, text: string) => (current.trim() ? `${current.trim()} ${text}` : text);
  const toggleSymptom = (symptom: string) =>
    setSymptoms((current) => (current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom]));

  const submit = async (next: boolean) => {
    setError(null);
    try {
      await onSave(
        { complaint, diagnosis, advice, symptoms: duration ? [...symptoms, `${DURATION_PREFIX}${duration}`] : symptoms },
        next,
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The visit note could not be saved.");
    }
  };

  const hasContent = Boolean(complaint.trim() || diagnosis.trim() || advice.trim() || symptoms.length);

  return (
    <TbdPage
      title="Complaint & diagnosis"
      description="Saved to this OPD visit; the prescription and the patient record use it."
      backHref="/doctor/appointments"
      backLabel="Appointments"
      actions={
        context.patientId ? (
          <Link
            href={`/doctor/patients/${encodeURIComponent(context.patientId)}`}
            className="inline-flex min-h-10 items-center rounded-xl border border-line bg-card px-4 text-[13px] font-bold text-ink hover:bg-mint-soft"
          >
            Open EHR
          </Link>
        ) : null
      }
    >
      <Surface className="flex-row flex-wrap items-center gap-3">
        <InitialsAvatar name={context.patientName} size={42} />
        <span className="flex min-w-[160px] flex-1 flex-col">
          <span className="text-base font-extrabold text-ink">{context.patientName}</span>
          {context.patientSummary ? <span className="text-xs text-ink-muted">{context.patientSummary}</span> : null}
        </span>
        {context.visitLabel ? <Pill tone={/video/i.test(context.visitLabel) ? "video" : "clinic"}>{context.visitLabel}</Pill> : null}
        {context.visitStatus ? (
          <Pill tone={statusTone(context.visitStatus)} dot>
            {statusLabel(context.visitStatus)}
          </Pill>
        ) : null}
      </Surface>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Surface>
          <SectionTitle
            icon={ClipboardList}
            title="Chief complaint"
            description="What the patient says, in their words."
            action={readOnly ? null : <DictationButton onText={(text) => setComplaint((current) => append(current, text))} />}
          />
          <Textarea
            id={`${fieldId}-complaint`}
            aria-label="Chief complaint"
            value={complaint}
            maxLength={1000}
            disabled={readOnly}
            className="min-h-[110px] border-line"
            placeholder="Fever since 2 days with sore throat and body ache..."
            onChange={(event) => setComplaint(event.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-ink-soft">Symptoms</span>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOMS.map((symptom) => (
                <ChoiceChip key={symptom} size="sm" disabled={readOnly} active={symptoms.includes(symptom)} onClick={() => toggleSymptom(symptom)}>
                  {symptom}
                </ChoiceChip>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-ink-soft">Since</span>
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map((option) => (
                <ChoiceChip key={option} size="sm" shape="box" disabled={readOnly} active={duration === option} onClick={() => setDuration(duration === option ? "" : option)}>
                  {option}
                </ChoiceChip>
              ))}
            </div>
          </div>
        </Surface>

        <Surface>
          <SectionTitle icon={Stethoscope} title="Diagnosis" description="Search by name or ICD code, or dictate it. The first one is primary." />
          <DiagnosisPicker value={diagnosis} onChange={setDiagnosis} disabled={readOnly} label="Diagnoses for this visit" />
        </Surface>
      </div>

      <Surface>
        <SectionTitle
          title="Examination & advice"
          description="Goes onto the prescription and the patient's record."
          action={readOnly ? null : <DictationButton onText={(text) => setAdvice((current) => append(current, text))} />}
        />
        <Textarea
          aria-label="Examination and advice"
          value={advice}
          maxLength={2000}
          disabled={readOnly}
          className="min-h-[110px] border-line"
          placeholder="Throat congested, chest clear. Warm fluids, rest for 2–3 days..."
          onChange={(event) => setAdvice(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-ink-muted">Quick add</span>
          {ADVICE_SNIPPETS.map((snippet) => (
            <ChoiceChip key={snippet.label} size="sm" active={false} disabled={readOnly} onClick={() => setAdvice((current) => append(current, snippet.text))}>
              {snippet.label}
            </ChoiceChip>
          ))}
        </div>
      </Surface>

      <DialogError lead="Not saved." message={error} />

      {readOnly ? null : (
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Button size="md" variant="outline" disabled={saving || !hasContent} onClick={() => void submit(false)}>
            {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Save note
          </Button>
          <Button size="md" disabled={saving} onClick={() => void submit(true)}>
            Continue to prescription
          </Button>
        </div>
      )}
    </TbdPage>
  );
}
