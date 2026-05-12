"use client";

import { useSearchParams } from "next/navigation";
import { DashboardPageHeader as PatientPageHeader, DashboardPageShell as PatientPageShell } from "@/components/dashboard/DashboardPageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PatientMedicalRecords from "@/components/patient/PatientMedicalRecordsContent";
import PatientPrescriptions from "@/components/patient/PatientPrescriptionsContent";

export default function PatientHealthPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "medicines" ? "medicines" : "records";

  return (
    <PatientPageShell className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <PatientPageHeader
        eyebrow="My Health"
        title="Health"
        description="Your records and medicines in one place."
      />

      <Tabs defaultValue={initialTab} className="space-y-4">
        <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-2">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="medicines">Medicines</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="records" className="space-y-4">
          <PatientMedicalRecords embedded />
        </TabsContent>

        <TabsContent value="medicines" className="space-y-4">
          <PatientPrescriptions embedded />
        </TabsContent>
      </Tabs>
    </PatientPageShell>
  );
}
