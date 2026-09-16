"use client";

import { Suspense } from "react";
import { HeartPulse } from "lucide-react";
import { DashboardPageHeader as PatientPageHeader, DashboardPageShell as PatientPageShell } from "@/components/dashboard/DashboardPageShell";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HashTabs } from "@/hooks/navigation/HashTabs";

import PatientMedicalRecords from "@/components/patient/PatientMedicalRecordsContent";
import PatientPrescriptions from "@/components/patient/PatientPrescriptionsContent";

const HEALTH_TABS = ["records", "medicines"] as const;

function PatientHealthPageContent() {
  return (
    <PatientPageShell>
      <PatientPageHeader
        variant="clinical"
        icon={<HeartPulse className="size-4" />}
        eyebrow="Health"
        title="Health"
        description="Your medical records, visit notes and prescriptions in one place."
      />

      <HashTabs
        tabs={HEALTH_TABS}
        defaultValue="records"
        className="flex flex-col gap-y-4"
      >
        <TabsList>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="medicines">Medicines</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-0 flex flex-col gap-y-4">
          <PatientMedicalRecords embedded />
        </TabsContent>

        <TabsContent value="medicines" className="mt-0 flex flex-col gap-y-4">
          <PatientPrescriptions embedded />
        </TabsContent>
      </HashTabs>
    </PatientPageShell>
  );
}

export default function PatientHealthPage() {
  return (
    <Suspense fallback={null}>
      <PatientHealthPageContent />
    </Suspense>
  );
}
