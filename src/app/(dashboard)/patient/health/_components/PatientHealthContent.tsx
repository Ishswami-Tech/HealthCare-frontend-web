"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import PatientMedicalRecords from "@/components/patient/PatientMedicalRecordsContent";
import { toLibraryItem } from "@/components/patient/home/homeData";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHealthLibrary } from "@/hooks/query/useHealthLibrary";
import { useComprehensiveHealthRecord } from "@/hooks/query/useMedicalRecords";
import { useMyFamilyMembers } from "@/hooks/query/useMyFamilyMembers";
import type { HealthLibraryListFilters } from "@/lib/actions/health-library.server";
import { useFamilyIdentity } from "../../family/_components/useFamilyIdentity";
import { PatientHealthHubView, type HealthHubCard } from "./PatientHealthHubView";
import {
  asList,
  asRecord,
  buildPrescriptions,
  buildReportRows,
  buildVitalTiles,
  latestPrescriptionLabel,
  reportsSummaryLabel,
  vitalsUpdatedLabel,
} from "./patient-health.logic";
import { usePatientUploads } from "./usePatientUploads";

const LIBRARY_STRIP_SIZE = 3;
const LIBRARY_FILTERS: HealthLibraryListFilters = { limit: LIBRARY_STRIP_SIZE };

/** My Health hub: loads the health record once and feeds the tiles, the cards and Records. */
export default function PatientHealthContent() {
  const router = useRouter();
  const { session, isPending: authLoading } = useAuth();
  const userId = session?.user?.id || "";
  // Read before any child touches the URL: the Records tabs write `#records/<tab>` on mount.
  const [initialHash] = useState(() => (typeof window === "undefined" ? "" : window.location.hash));

  const { data: healthData, isPending, error, refetch } = useComprehensiveHealthRecord(userId);
  const { data: uploadsData } = usePatientUploads(session?.user?.clinicId || "", userId);
  const { data: libraryData, isFetching: isFetchingLibrary } = useHealthLibrary(LIBRARY_FILTERS, {
    enabled: !!userId,
  });
  // Same clinic id as the Family Members pages, so both read one cached list.
  const { clinicId: familyClinicId } = useFamilyIdentity();
  const { data: familyMembers } = useMyFamilyMembers(familyClinicId, { enabled: !!userId });

  useEffect(() => {
    const section = initialHash.replace(/^#/, "").toLowerCase().split("/")[0];
    const params = new URLSearchParams(window.location.search);
    const tab = (params.get("tab") || "").toLowerCase();
    // Medicines used to be a tab of this page (`#medicines`, `?tab=medicines&id=…`).
    if (section === "medicines" || tab === "medicines") {
      const id = params.get("id") || params.get("prescriptionId");
      router.replace(`/patient/health/medicines${id ? `?prescriptionId=${encodeURIComponent(id)}` : ""}`);
      return;
    }
    if (section === "records" || tab === "records") {
      document.getElementById("records")?.scrollIntoView({ block: "start" });
    }
  }, [initialHash, router]);

  const model = useMemo(() => {
    const record = asRecord(healthData);
    const vitals = buildVitalTiles(record.vitals);
    const reports = buildReportRows({
      labReports: record.labReports,
      radiologyReports: record.radiologyReports,
      uploads: [...asList(record.documents), ...asList(uploadsData)],
      prescriptions: buildPrescriptions(record.prescriptions),
      userId,
    });
    return {
      vitals,
      vitalsUpdated: vitalsUpdatedLabel(vitals),
      reportsDetail: reportsSummaryLabel(reports),
      medicinesDetail: latestPrescriptionLabel(record.prescriptions),
    };
  }, [healthData, uploadsData, userId]);

  // A failed background refresh keeps the record that is already on screen.
  const failed = Boolean(error) && healthData === undefined;
  const isLoading = !error && healthData === undefined && (authLoading || (!!userId && isPending));
  // The count shows once the list has loaded; until then (or if it fails) the card keeps its plain line.
  const familyCount = familyMembers?.length;
  const familyDetail =
    familyCount === undefined
      ? "Family members and their care"
      : familyCount === 0
        ? "No family members yet"
        : familyCount === 1
          ? "1 family member"
          : `${familyCount} family members`;
  const cards: HealthHubCard[] = [
    { key: "reports", detail: isLoading ? null : failed ? "Lab, imaging and your files" : model.reportsDetail },
    { key: "medicines", detail: isLoading ? null : failed ? "Medicines and prescriptions" : model.medicinesDetail },
    { key: "family", detail: familyDetail },
  ];

  const libraryItems = (Array.isArray(libraryData?.items) ? libraryData.items : [])
    .slice(0, LIBRARY_STRIP_SIZE)
    .map(toLibraryItem);

  return (
    <DashboardPageShell>
      <PatientHealthHubView
        vitals={model.vitals}
        vitalsUpdatedLabel={model.vitalsUpdated}
        isVitalsLoading={isLoading}
        vitalsFailed={failed}
        onRetry={() => void refetch()}
        cards={cards}
        library={{ items: libraryItems, isLoading: isFetchingLibrary && libraryItems.length === 0 }}
      >
        <PatientMedicalRecords embedded />
      </PatientHealthHubView>
    </DashboardPageShell>
  );
}
