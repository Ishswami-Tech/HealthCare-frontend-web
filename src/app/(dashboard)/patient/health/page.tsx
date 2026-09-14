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
    <PatientPageShell className="max-w-none gap-y-3 sm:gap-y-3">
      <PatientPageHeader
        variant="clinical"
        icon={<HeartPulse className="size-4" />}
        eyebrow="Clinical chart"
        title="Health"
        description="Your records and medicines in one place."
      />

      <HashTabs
        tabs={HEALTH_TABS}
        defaultValue="records"
        className="flex flex-col gap-y-3"
      >
        <div className="rounded-xl border border-violet-200/60 bg-violet-50/40 p-1 dark:border-violet-900/40 dark:bg-violet-950/20">
          <TabsList className="inline-flex h-9 w-full min-w-0 gap-1 bg-transparent p-0">
            <TabsTrigger
              value="records"
              className="flex-1 rounded-lg px-3 text-sm data-[state=active]:bg-card data-[state=active]:text-violet-700 data-[state=active]:shadow-sm dark:data-[state=active]:text-violet-300"
            >
              Records
            </TabsTrigger>
            <TabsTrigger
              value="medicines"
              className="flex-1 rounded-lg px-3 text-sm data-[state=active]:bg-card data-[state=active]:text-violet-700 data-[state=active]:shadow-sm dark:data-[state=active]:text-violet-300"
            >
              Medicines
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="records" className="mt-0 flex flex-col gap-y-3">
          <PatientMedicalRecords embedded />
        </TabsContent>

        <TabsContent value="medicines" className="mt-0 flex flex-col gap-y-3">
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
