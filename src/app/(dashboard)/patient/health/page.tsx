"use client";

import { Suspense } from "react";
import { DashboardPageHeader as PatientPageHeader, DashboardPageShell as PatientPageShell } from "@/components/dashboard/DashboardPageShell";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HashTabs } from "@/hooks/navigation/HashTabs";

import PatientMedicalRecords from "@/components/patient/PatientMedicalRecordsContent";
import PatientPrescriptions from "@/components/patient/PatientPrescriptionsContent";

const HEALTH_TABS = ["records", "medicines"] as const;

function PatientHealthPageContent() {
  return (
    <PatientPageShell className="mx-auto max-w-7xl">
      <PatientPageHeader
        eyebrow="My Health"
        title="Health"
        description="Your records and medicines in one place."
      />

      <HashTabs
        tabs={HEALTH_TABS}
        defaultValue="records"
        className="flex flex-col gap-y-4"
      >
        <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max min-w-full sm:flex sm:w-full">
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="medicines">Medicines</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="records" className="flex flex-col gap-y-4">
          <PatientMedicalRecords embedded />
        </TabsContent>

        <TabsContent value="medicines" className="flex flex-col gap-y-4">
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
