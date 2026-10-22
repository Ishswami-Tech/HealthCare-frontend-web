"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, LoadError, Note, Pill, SectionTitle, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { useUpsertClassicalExamFindings, useVisitCaseSheet } from "@/hooks/query/usePatientVisits";
import { VisitCaseSheetSummary } from "@/components/patient/case-sheet/VisitCaseSheetSummary";
import {
  buildCaseSheetCompleteness,
  buildMarkEmptyFindings,
  type CaseSheetSectionKey,
  type CaseSheetSectionState,
} from "@/components/patient/case-sheet/case-sheet-summary-model";
import { useDoctorVisit } from "./useDoctorVisit";
import { VisitGate, VisitPatientCard } from "./VisitParts";
import { visitHref } from "./visit-routes";

const caseSheetHref = (patientId: string, key: CaseSheetSectionKey) =>
  `/doctor/patients/${encodeURIComponent(patientId)}#history/${key}`;

function RequiredRow({
  section,
  patientId,
  onMarkEmpty,
  pending,
}: {
  section: CaseSheetSectionState;
  patientId: string;
  onMarkEmpty: (key: CaseSheetSectionKey) => void;
  pending: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#fcd34d] bg-[#fffbeb] px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
      <span className="min-w-0 flex-1 text-sm font-bold text-ink">{section.label}</span>
      <Button size="compact" asChild>
        <Link href={caseSheetHref(patientId, section.key)}>Fill now</Link>
      </Button>
      {section.canMarkEmpty ? (
        <Button size="compact" variant="outline" disabled={pending} onClick={() => onMarkEmpty(section.key)}>
          Mark N/A
        </Button>
      ) : null}
    </li>
  );
}

/** DocCaseSummary: check the case sheet before the prescription; close empty exam sections in one tap. */
export function DocCaseSummaryView({ appointmentId }: { appointmentId: string }) {
  const visit = useDoctorVisit(appointmentId);
  const sheetQuery = useVisitCaseSheet(visit.clinicId, visit.visitId);
  const upsert = useUpsertClassicalExamFindings();
  const completeness = useMemo(() => (sheetQuery.data ? buildCaseSheetCompleteness(sheetQuery.data) : null), [sheetQuery.data]);
  const continueHref = `${visitHref(appointmentId)}?prescribe=1`;

  const markEmpty = (keys: CaseSheetSectionKey[]) => {
    const findings = buildMarkEmptyFindings(keys);
    if (findings.length === 0 || !visit.visitId) return;
    upsert.mutate({ clinicId: visit.clinicId, visitId: visit.visitId, findings });
  };

  return (
    <TbdPage
      title="Case sheet review"
      description="Check what is filled before you write the prescription"
      backHref={visitHref(appointmentId)}
      backLabel="Back to visit"
    >
      <VisitGate visit={visit}>
        <VisitPatientCard visit={visit} />
        {!visit.visitId ? (
          <Surface>
            <Note tone="amber">
              No OPD case sheet is open for this visit yet. Open the patient record to start one, or continue straight to the
              prescription.
            </Note>
            <div className="flex flex-wrap justify-end gap-2.5">
              <Button variant="outline" size="md" asChild>
                <Link href={`/doctor/patients/${encodeURIComponent(visit.patientId)}`}>Open patient record</Link>
              </Button>
              <Button size="md" asChild>
                <Link href={continueHref}>
                  Continue to prescription
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </Surface>
        ) : sheetQuery.isPending ? (
          <Surface flush aria-busy="true">
            <SkeletonRows rows={3} />
          </Surface>
        ) : sheetQuery.error || !completeness ? (
          <Surface flush>
            <LoadError title="The case sheet could not be loaded" onRetry={() => void sheetQuery.refetch()} />
          </Surface>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-5">
              <Surface>
                <SectionTitle
                  title="Case sheet complete"
                  icon={ClipboardCheck}
                  description={
                    completeness.requiredEmpty.length > 0
                      ? `${completeness.requiredEmpty.length} required ${completeness.requiredEmpty.length === 1 ? "section is" : "sections are"} empty`
                      : "All required sections are filled"
                  }
                  action={
                    <span className="text-lg font-extrabold text-ink">
                      {completeness.done.length} of {completeness.total}
                    </span>
                  }
                />
                {completeness.requiredEmpty.length > 0 ? (
                  <section aria-label="Required, still empty" className="flex flex-col gap-2">
                    <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">
                      Required, still empty · {completeness.requiredEmpty.length}
                    </h3>
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                      {completeness.requiredEmpty.map((section) => (
                        <RequiredRow
                          key={section.key}
                          section={section}
                          patientId={visit.patientId}
                          pending={upsert.isPending}
                          onMarkEmpty={(key) => markEmpty([key])}
                        />
                      ))}
                    </ul>
                  </section>
                ) : null}
                {completeness.optionalEmpty.length > 0 ? (
                  <section aria-label="Optional, not filled" className="flex flex-col gap-2">
                    <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">
                      Optional, not filled · {completeness.optionalEmpty.length}
                    </h3>
                    <p className="m-0 text-xs text-ink-muted">These do not block the prescription.</p>
                    <div className="flex flex-wrap gap-2">
                      {completeness.optionalEmpty.map((section) => (
                        <Link key={section.key} href={caseSheetHref(visit.patientId, section.key)}>
                          <Chip>{section.label}</Chip>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}
                <section aria-label="Done" className="flex flex-col gap-2">
                  <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">
                    Done · {completeness.done.length}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {completeness.done.map((section) => (
                      <Pill key={section.key} tone="green">
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                        {section.label}
                      </Pill>
                    ))}
                  </div>
                </section>
              </Surface>

              {completeness.markableOptional.length > 0 ? (
                <Surface className="bg-mint-soft">
                  <SectionTitle
                    title={`Mark the ${completeness.markableOptional.length} empty exam ${completeness.markableOptional.length === 1 ? "section" : "sections"} as normal / N/A`}
                    description="Ashtavidha, Dashavidha and Srotas are saved as “Normal”, the rest as “Not applicable”. You can reopen any of them later."
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="md"
                      disabled={upsert.isPending}
                      onClick={() => markEmpty(completeness.markableOptional.map((section) => section.key))}
                    >
                      Mark {completeness.markableOptional.length} as normal / N/A
                    </Button>
                  </div>
                </Surface>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col gap-5">
              <Surface>
                <SectionTitle title="Key findings" />
                <VisitCaseSheetSummary clinicId={visit.clinicId} visitId={visit.visitId} />
              </Surface>
              <Surface>
                <Button size="xl" asChild>
                  <Link href={continueHref}>
                    Continue to prescription
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button variant="outline" size="md" asChild>
                  <Link href={`/doctor/patients/${encodeURIComponent(visit.patientId)}#history`}>Back to case sheet</Link>
                </Button>
                {completeness.requiredEmpty.length > 0 ? (
                  <p className="m-0 text-xs text-ink-muted">
                    You can still continue and fill the empty sections after the prescription.
                  </p>
                ) : null}
              </Surface>
            </div>
          </div>
        )}
      </VisitGate>
    </TbdPage>
  );
}
