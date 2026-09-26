"use client";

import { runSave } from "./run-save";
import { useStableSnapshot } from "./use-stable-snapshot";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HashTabs } from "@/hooks/navigation/HashTabs";
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
import { ClassicalExamSection } from "./ClassicalExamSection";
import { GeneralExaminationForm, PhysicalMeasurementForm } from "./ExaminationForms";
import { FamilyHistoryTable } from "./FamilyHistoryTable";
import { HabitGrid, NidraPanel } from "./HabitGrid";
import { MedicineHistoryTable } from "./MedicineHistoryTable";
import { PastHistoryChecklist } from "./PastHistoryChecklist";
import { PrakritiAssessmentPanel } from "./PrakritiAssessmentPanel";

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
};

interface ComplaintsPanelProps {
  visit: PatientVisit;
  onSave: (input: UpdatePatientVisitInput) => Promise<unknown>;
  isSaving: boolean;
}

function ComplaintsPanel({ visit, onSave, isSaving }: ComplaintsPanelProps) {
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

  const field = (key: keyof typeof values, label: string, placeholder: string, rows = 3) => (
    <div className="flex flex-col gap-y-1">
      <Label htmlFor={`complaint-${key}`}>{label}</Label>
      <Textarea
        id={`complaint-${key}`}
        rows={rows}
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
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">Present Complaints</CardTitle>
          <p className="text-sm text-muted-foreground">Symptoms, known conditions and allergies</p>
        </div>
        <Button
          size="sm"
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
          disabled={isSaving || !dirty}
        >
          <Save className="mr-1 size-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {field("presentComplaints", "Symptoms", "Type symptoms")}
        {field("knownCaseOf", "Known case of", "e.g. Hypertension, Diabetes")}
        {field("foodAllergyNotes", "Food allergy", "Type here", 2)}
        {field("drugAllergyNotes", "Drug allergy", "Type here", 2)}
      </CardContent>
    </Card>
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
  if (caseSheetQuery.isPending || !caseSheet) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
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
    <HashTabs tabs={SECTION_TABS} defaultValue="basic" namespace="history" className="flex flex-col gap-y-4">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <TabsList className="inline-flex h-auto w-max flex-nowrap gap-1 p-1">
          {SECTION_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="whitespace-nowrap text-xs">
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="basic">
        <BasicDetailsPanel clinicId={clinicId} visit={visit} patient={patient} />
      </TabsContent>
      <TabsContent value="complaints">
        <ComplaintsPanel visit={visit} onSave={saveVisit} isSaving={updateVisit.isPending} />
      </TabsContent>
      <TabsContent value="past-history">
        <PastHistoryChecklist
          userId={patientUserId}
          notes={visit.pastHistoryNotes}
          onSaveNotes={(notes) => saveVisit({ pastHistoryNotes: notes.trim() || null })}
          isSavingNotes={updateVisit.isPending}
        />
      </TabsContent>
      <TabsContent value="habits" className="flex flex-col gap-y-4">
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
      <TabsContent value="family">
        <FamilyHistoryTable clinicId={clinicId} userId={patientUserId} />
      </TabsContent>
      <TabsContent value="medicines">
        <MedicineHistoryTable userId={patientUserId} />
      </TabsContent>
      <TabsContent value="general-exam" className="flex flex-col gap-y-4">
        <GeneralExaminationForm
          vitals={vitalsExamination}
          onSave={saveVitals}
          isSaving={upsertVitals.isPending}
        />
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-foreground">Lab Investigation</CardTitle>
            <p className="text-sm text-muted-foreground">
              {labReports.length === 0
                ? "No lab reports on file. Reports are managed in the Reports tab."
                : `${labReports.length} recent report${labReports.length === 1 ? "" : "s"} on file`}
            </p>
          </CardHeader>
          {labReports.length > 0 ? (
            <CardContent className="flex flex-wrap gap-2">
              {labReports.slice(0, 8).map((report, index) => (
                <span
                  key={String(report["id"] ?? index)}
                  className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-foreground"
                >
                  {String(report["testName"] ?? report["reportType"] ?? "Report")}
                </span>
              ))}
            </CardContent>
          ) : null}
        </Card>
      </TabsContent>
      <TabsContent value="measurements">
        <PhysicalMeasurementForm
          vitals={vitalsExamination}
          onSave={saveVitals}
          isSaving={upsertVitals.isPending}
        />
      </TabsContent>
      <TabsContent value="ashtavidha">{classical(ASHTAVIDHA_PARIKSHA)}</TabsContent>
      <TabsContent value="dashavidha">{classical(DASHAVIDHA_PARIKSHA)}</TabsContent>
      <TabsContent value="srotas">{classical(SROTAS_PARIKSHA)}</TabsContent>
      <TabsContent value="samprapti">{classical(SAMPRAPTI_GHATAKA)}</TabsContent>
      <TabsContent value="prakruti">
        <PrakritiAssessmentPanel clinicId={clinicId} patientId={patientId} />
      </TabsContent>
      <TabsContent value="pain">{classical(PAIN_ASSESSMENT)}</TabsContent>
      <TabsContent value="personal">{classical(PERSONAL_HISTORY)}</TabsContent>
    </HashTabs>
  );
}
