"use client";

import { runSave } from "./run-save";
import { useStableSnapshot } from "./use-stable-snapshot";
import { useEffect, useState, type ReactNode } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { AlertTriangle, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import { Chip, EmptyBlock, Surface } from "@/components/tbd";
import { HashTabs } from "@/hooks/navigation/HashTabs";
import { cn } from "@/lib/utils";
import {
  ASHTAVIDHA_PARIKSHA,
  DASHAVIDHA_PARIKSHA,
  PAIN_ASSESSMENT,
  PERSONAL_HISTORY,
  SAMPRAPTI_GHATAKA,
  SROTAS_PARIKSHA,
} from "@/lib/constants/ayurveda-classical-exam-categories";
import {
  useUpdatePatientVisit,
  useUpsertClassicalExamFindings,
  useUpsertVisitVitalsExamination,
  useVisitCaseSheet,
} from "@/hooks/query/usePatientVisits";
import type { PatientVisit, UpdatePatientVisitInput } from "@/types/patient-visit.types";
import { BasicDetailsPanel } from "./BasicDetailsPanel";
import { CaseSheetCard, FieldLabel, GroupLabel, SaveButton } from "./case-sheet-parts";
import { ClassicalExamSection } from "./ClassicalExamSection";
import { GeneralExaminationForm, PhysicalMeasurementForm } from "./ExaminationForms";
import { FamilyHistoryTable } from "./FamilyHistoryTable";
import { HabitGrid, NidraPanel } from "./HabitGrid";
import { MedicineHistoryTable } from "./MedicineHistoryTable";
import { PastHistoryChecklist } from "./PastHistoryChecklist";
import { PrakritiAssessmentPanel } from "./PrakritiAssessmentPanel";
import { TherapyPlanPanel } from "./TherapyPlanPanel";
import { TherapyProgressPanel } from "./TherapyProgressPanel";
import { DietChartPanel } from "./DietChartPanel";
import { PatientFilesPanel } from "./PatientFilesPanel";

const SECTION_TABS = [
  "basic",
  "complaints",
  "past-history",
  "habits",
  "family",
  "medicines",
  "general-exam",
  "measurements",
  "ashtavidha",
  "dashavidha",
  "srotas",
  "samprapti",
  "prakruti",
  "pain",
  "personal",
  "therapy",
  "diet",
  "investigation",
  "documents",
  "progress",
] as const;

const TAB_LABELS: Record<(typeof SECTION_TABS)[number], string> = {
  basic: "Basic Details",
  complaints: "Complaints",
  "past-history": "Past History",
  habits: "Habits & Nidra",
  family: "Family History",
  medicines: "Medicine History",
  "general-exam": "General Exam",
  measurements: "Measurements",
  ashtavidha: "Ashtavidha",
  dashavidha: "Dashavidha",
  srotas: "Srotas",
  samprapti: "Samprapti",
  prakruti: "Prakruti",
  pain: "Pain",
  personal: "Personal",
  therapy: "Therapy",
  diet: "Diet",
  investigation: "Investigation",
  documents: "Documents",
  progress: "Progress",
};

type SectionTab = (typeof SECTION_TABS)[number];

/** The 20 sections in the three groups the navigation shows. */
const SECTION_GROUPS: readonly { id: string; label: string; tabs: readonly SectionTab[] }[] = [
  {
    id: "history",
    label: "History",
    tabs: ["basic", "complaints", "past-history", "habits", "family", "medicines"],
  },
  {
    id: "examination",
    label: "Examination",
    tabs: [
      "general-exam",
      "measurements",
      "ashtavidha",
      "dashavidha",
      "srotas",
      "samprapti",
      "prakruti",
      "pain",
      "personal",
    ],
  },
  {
    id: "plan",
    label: "Plan and files",
    tabs: ["therapy", "diet", "investigation", "documents", "progress"],
  },
];

/** Every section is a column of cards with the page gap between them. */
const SECTION_CONTENT = "flex flex-col gap-5";

/**
 * Section navigation: one labelled row of tabs per group. Each row is its own
 * tab list, so the arrow keys move inside a group and Tab moves between groups.
 */
function CaseSheetSectionNav() {
  return (
    <Surface as="section" aria-label="Case sheet sections" className="gap-2 p-4">
      {SECTION_GROUPS.map((group) => (
        <div key={group.id} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3.5">
          <span className="shrink-0 whitespace-nowrap sm:w-[104px] sm:pt-[9px]">
            <GroupLabel id={`case-sheet-nav-${group.id}`}>{group.label}</GroupLabel>
          </span>
          <TabsPrimitive.List
            aria-labelledby={`case-sheet-nav-${group.id}`}
            className="flex min-w-0 flex-wrap gap-1.5"
          >
            {group.tabs.map((tab) => (
              <TabsPrimitive.Trigger
                key={tab}
                value={tab}
                className={cn(
                  "inline-flex min-h-[34px] items-center whitespace-nowrap rounded-[10px] bg-well px-3 text-[13px] font-semibold text-ink transition-colors",
                  "hover:bg-mint",
                  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                  "data-[state=active]:bg-primary data-[state=active]:font-bold data-[state=active]:text-primary-foreground",
                  "data-[state=active]:shadow-[0_6px_14px_rgba(4,120,87,0.22)] dark:data-[state=active]:shadow-none",
                )}
              >
                {TAB_LABELS[tab]}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>
        </div>
      ))}
    </Surface>
  );
}

/**
 * The case-sheet frame: hash tabs (#history/<section>) with the section
 * navigation on top. Children are the `TabsContent` panels.
 */
export function CaseSheetShell({ children }: { children: ReactNode }) {
  return (
    <HashTabs tabs={SECTION_TABS} defaultValue="basic" namespace="history" className="flex flex-col gap-5">
      <CaseSheetSectionNav />
      {children}
    </HashTabs>
  );
}

/** Placeholder while the case sheet loads. */
export function CaseSheetLoading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <span className="sr-only">Loading the case sheet</span>
      <Surface className="gap-2 p-4">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex flex-wrap gap-1.5">
            {[0, 1, 2, 3, 4].map((chip) => (
              <Skeleton key={chip} className="h-[34px] w-24 rounded-[10px]" />
            ))}
          </div>
        ))}
      </Surface>
      <Surface className="gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((tile) => (
            <Skeleton key={tile} className="h-[62px] rounded-[14px]" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </Surface>
    </div>
  );
}

/** Shown when the case sheet could not be loaded. */
export function CaseSheetLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Surface>
      <EmptyBlock
        icon={AlertTriangle}
        tone="rose"
        title="Could not load the case sheet"
        description="Check the connection and try again."
        action={
          <Button variant="outline" size="md" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    </Surface>
  );
}

export interface ComplaintsPanelProps {
  visit: PatientVisit;
  onSave: (input: UpdatePatientVisitInput) => Promise<unknown>;
  isSaving: boolean;
}

export function ComplaintsPanel({ visit, onSave, isSaving }: ComplaintsPanelProps) {
  // Snapshot so a background refetch with identical data doesn't reset the draft.
  const saved = useStableSnapshot({
    presentComplaints: visit.presentComplaints ?? "",
    knownCaseOf: visit.knownCaseOf ?? "",
    foodAllergyNotes: visit.foodAllergyNotes ?? "",
    drugAllergyNotes: visit.drugAllergyNotes ?? "",
  });
  const [values, setValues] = useState(saved);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setValues(saved);
    setDirty(false);
  }, [saved]);

  const field = (key: keyof typeof values, label: string, placeholder: string, tall = true) => (
    <div className="flex min-w-0 flex-col gap-1.5">
      <FieldLabel htmlFor={`complaint-${key}`}>{label}</FieldLabel>
      <Textarea
        id={`complaint-${key}`}
        rows={tall ? 3 : 2}
        className={tall ? "min-h-[100px]" : "min-h-[72px]"}
        placeholder={placeholder}
        value={values[key]}
        onChange={(event) => {
          setValues((prev) => ({ ...prev, [key]: event.target.value }));
          setDirty(true);
        }}
      />
    </div>
  );

  return (
    <CaseSheetCard
      title="Present Complaints"
      description="Symptoms, known conditions and allergies"
      action={
        <SaveButton
          saving={isSaving}
          disabled={isSaving || !dirty}
          onClick={async () => {
            const saved = await runSave(() =>
              onSave({
                presentComplaints: values.presentComplaints.trim() || null,
                knownCaseOf: values.knownCaseOf.trim() || null,
                foodAllergyNotes: values.foodAllergyNotes.trim() || null,
                drugAllergyNotes: values.drugAllergyNotes.trim() || null,
              }),
            );
            if (saved) setDirty(false);
          }}
        />
      }
    >
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {field("presentComplaints", "Symptoms", "Type symptoms")}
        {field("knownCaseOf", "Known case of", "e.g. Hypertension, Diabetes")}
        {field("foodAllergyNotes", "Food allergy", "Type here", false)}
        {field("drugAllergyNotes", "Drug allergy", "Type here", false)}
      </div>
    </CaseSheetCard>
  );
}

interface VisitCaseSheetProps {
  clinicId: string;
  patientId: string;
  patientUserId: string;
  visitId: string;
}

/**
 * The OPD case-sheet for one visit: Basic Details plus every History
 * sub-section, as nested hash tabs (#history/<section>) so the top-level EHR
 * tab bar stays small.
 */
export function VisitCaseSheet({ clinicId, patientId, patientUserId, visitId }: VisitCaseSheetProps) {
  const caseSheetQuery = useVisitCaseSheet(clinicId, visitId);
  const updateVisit = useUpdatePatientVisit();
  const upsertVitals = useUpsertVisitVitalsExamination();
  const upsertExams = useUpsertClassicalExamFindings();

  const caseSheet = caseSheetQuery.data;
  if (!caseSheet) {
    return caseSheetQuery.error && !caseSheetQuery.isFetching ? (
      <CaseSheetLoadError onRetry={() => void caseSheetQuery.refetch()} />
    ) : (
      <CaseSheetLoading />
    );
  }

  const { visit, patient, vitalsExamination, classicalExams, labReports } = caseSheet;
  const saveVisit = (input: UpdatePatientVisitInput) =>
    updateVisit.mutateAsync({ clinicId, visitId, input });
  const saveExams = (findings: Parameters<typeof upsertExams.mutateAsync>[0]["findings"]) =>
    upsertExams.mutateAsync({ clinicId, visitId, findings });
  const saveVitals = (input: Parameters<typeof upsertVitals.mutateAsync>[0]["input"]) =>
    upsertVitals.mutateAsync({ clinicId, visitId, input });

  const classical = (section: typeof ASHTAVIDHA_PARIKSHA) => (
    <ClassicalExamSection
      section={section}
      findings={classicalExams}
      onSave={saveExams}
      isSaving={upsertExams.isPending}
    />
  );

  return (
    <CaseSheetShell>
      <TabsContent value="basic" className={SECTION_CONTENT}>
        <BasicDetailsPanel clinicId={clinicId} visit={visit} patient={patient} />
      </TabsContent>
      <TabsContent value="complaints" className={SECTION_CONTENT}>
        <ComplaintsPanel visit={visit} onSave={saveVisit} isSaving={updateVisit.isPending} />
      </TabsContent>
      <TabsContent value="past-history" className={SECTION_CONTENT}>
        <PastHistoryChecklist
          userId={patientUserId}
          notes={visit.pastHistoryNotes}
          onSaveNotes={(notes) => saveVisit({ pastHistoryNotes: notes.trim() || null })}
          isSavingNotes={updateVisit.isPending}
        />
      </TabsContent>
      <TabsContent value="habits" className={SECTION_CONTENT}>
        <HabitGrid
          habits={visit.habits}
          onSave={(habits) => saveVisit({ habits })}
          isSaving={updateVisit.isPending}
        />
        <NidraPanel
          nidra={visit.nidra}
          nidraNotes={visit.nidraNotes}
          onSave={({ nidra, nidraNotes }) =>
            saveVisit({ nidra, nidraNotes: nidraNotes.trim() || null })
          }
          isSaving={updateVisit.isPending}
        />
      </TabsContent>
      <TabsContent value="family" className={SECTION_CONTENT}>
        <FamilyHistoryTable clinicId={clinicId} userId={patientUserId} />
      </TabsContent>
      <TabsContent value="medicines" className={SECTION_CONTENT}>
        <MedicineHistoryTable userId={patientUserId} />
      </TabsContent>
      <TabsContent value="general-exam" className={SECTION_CONTENT}>
        <GeneralExaminationForm
          vitals={vitalsExamination}
          onSave={saveVitals}
          isSaving={upsertVitals.isPending}
        />
        <CaseSheetCard
          title="Lab Investigation"
          description={
            labReports.length === 0
              ? "No lab reports on file. Reports are managed in the Reports tab."
              : `${labReports.length} recent report${labReports.length === 1 ? "" : "s"} on file`
          }
        >
          {labReports.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {labReports.slice(0, 8).map((report, index) => (
                <Chip key={String(report["id"] ?? index)} icon={FlaskConical}>
                  {String(report["testName"] ?? report["reportType"] ?? "Report")}
                </Chip>
              ))}
            </div>
          ) : null}
        </CaseSheetCard>
      </TabsContent>
      <TabsContent value="measurements" className={SECTION_CONTENT}>
        <PhysicalMeasurementForm
          vitals={vitalsExamination}
          onSave={saveVitals}
          isSaving={upsertVitals.isPending}
        />
      </TabsContent>
      <TabsContent value="ashtavidha" className={SECTION_CONTENT}>
        {classical(ASHTAVIDHA_PARIKSHA)}
      </TabsContent>
      <TabsContent value="dashavidha" className={SECTION_CONTENT}>
        {classical(DASHAVIDHA_PARIKSHA)}
      </TabsContent>
      <TabsContent value="srotas" className={SECTION_CONTENT}>
        {classical(SROTAS_PARIKSHA)}
      </TabsContent>
      <TabsContent value="samprapti" className={SECTION_CONTENT}>
        {classical(SAMPRAPTI_GHATAKA)}
      </TabsContent>
      <TabsContent value="prakruti" className={SECTION_CONTENT}>
        <PrakritiAssessmentPanel clinicId={clinicId} patientId={patientId} />
      </TabsContent>
      <TabsContent value="pain" className={SECTION_CONTENT}>
        {classical(PAIN_ASSESSMENT)}
      </TabsContent>
      <TabsContent value="personal" className={SECTION_CONTENT}>
        {classical(PERSONAL_HISTORY)}
      </TabsContent>
      <TabsContent value="therapy" className={SECTION_CONTENT}>
        <TherapyPlanPanel clinicId={clinicId} patientId={patientId} visitId={visitId} />
      </TabsContent>
      <TabsContent value="diet" className={SECTION_CONTENT}>
        <DietChartPanel clinicId={clinicId} patientId={patientId} visitId={visitId} />
      </TabsContent>
      <TabsContent value="investigation" className={SECTION_CONTENT}>
        <PatientFilesPanel clinicId={clinicId} patientId={patientId} visitId={visitId} category="INVESTIGATION" />
      </TabsContent>
      <TabsContent value="documents" className={SECTION_CONTENT}>
        <PatientFilesPanel clinicId={clinicId} patientId={patientId} visitId={visitId} category="DOCUMENT" />
      </TabsContent>
      <TabsContent value="progress" className={SECTION_CONTENT}>
        <TherapyProgressPanel clinicId={clinicId} patientId={patientId} />
      </TabsContent>
    </CaseSheetShell>
  );
}
