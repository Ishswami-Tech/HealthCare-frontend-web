"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardPageHeader as PatientPageHeader, DashboardPageShell as PatientPageShell } from "@/components/dashboard/DashboardPageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PatientMedicalRecords from "@/components/patient/PatientMedicalRecordsContent";
import PatientPrescriptions from "@/components/patient/PatientPrescriptionsContent";

function PatientHealthPageContent() {
  const searchParams = useSearchParams();
  const getSearchParam = useMemo(() => searchParams.get.bind(searchParams), [searchParams]);
  const initialTab = getSearchParam("tab") === "medicines" ? "medicines" : "records";

  return (
    <PatientPageShell className="mx-auto max-w-7xl">
      <PatientPageHeader
        eyebrow="My Health"
        title="Health"
        description="Your records and medicines in one place."
      />

      <Tabs defaultValue={initialTab} className="flex flex-col gap-y-4">
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
      </Tabs>
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
