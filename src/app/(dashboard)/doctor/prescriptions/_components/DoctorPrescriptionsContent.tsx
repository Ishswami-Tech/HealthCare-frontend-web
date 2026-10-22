"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHydrated } from "@/hooks/utils/useHydrated";
import { showErrorToast, showInfoToast } from "@/hooks/utils/use-toast";
import { downloadPrescriptionPdf } from "@/lib/utils/prescription-pdf-download";
import { usePrescriptionPage, usePrescriptionSummary } from "@/hooks/query/usePrescriptions";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import { DoctorPrescriptionsView } from "./DoctorPrescriptionsView";
import { normalizeDoctorPrescriptions, type DoctorPrescriptionRow } from "./doctor-prescriptions.logic";
import {
  applyClientQuery,
  hasNonDefaultFilters,
  resolveDateRange,
  summarizeRows,
  toListParams,
} from "./doctor-prescriptions.filters";
import { useDoctorPrescriptionFilters } from "./useDoctorPrescriptionFilters";

/** Data container for the doctor's prescriptions screen: hooks and handlers here, layout in the view. */
export function DoctorPrescriptionsContent() {
  const { session } = useAuth();
  const doctorId = session?.user?.id || "";
  const router = useRouter();

  // "Today" is an IST day key; it only exists once the page runs in the browser.
  const isHydrated = useHydrated();
  const todayKey = isHydrated ? formatDateKeyInIST(new Date()) : "";

  const filterState = useDoctorPrescriptionFilters();
  const { filters, update } = filterState;

  const listParams = useMemo(() => toListParams(filters, todayKey), [filters, todayKey]);
  const range = useMemo(() => resolveDateRange(filters, todayKey), [filters, todayKey]);

  const pageQuery = usePrescriptionPage(doctorId, listParams, { enabled: isHydrated });
  const summaryQuery = usePrescriptionSummary(doctorId, range, { enabled: isHydrated });

  // New-prescription and dispense events invalidate every `['prescriptions', …]` key (see
  // useWebSocketIntegration), which refetches the page and the summary on screen.
  useWebSocketQuerySync();

  const page = pageQuery.data;
  const isLegacy = page?.mode === "legacy";

  // A backend without paging answers every prescription: page, filter and count them here.
  const allLegacyRows = useMemo(
    () => (isLegacy ? normalizeDoctorPrescriptions(page?.rows) : []),
    [isLegacy, page?.rows],
  );
  const view = useMemo(() => {
    if (!page) return { rows: [] as DoctorPrescriptionRow[], total: 0 };
    if (isLegacy) return applyClientQuery(allLegacyRows, listParams);
    return { rows: normalizeDoctorPrescriptions(page.rows), total: page.total };
  }, [page, isLegacy, allLegacyRows, listParams]);

  const summary = useMemo(() => {
    if (summaryQuery.data) return summaryQuery.data;
    if (isLegacy) return summarizeRows(allLegacyRows, range, todayKey);
    return null;
  }, [summaryQuery.data, isLegacy, allLegacyRows, range, todayKey]);

  // A page past the end (rows deleted, or a stale link) moves to the last page that has rows.
  const pageCount = Math.max(1, Math.ceil(view.total / filters.size));
  const pastTheEnd = Boolean(page) && !pageQuery.isFetching && view.total > 0 && filters.page > pageCount;
  useEffect(() => {
    if (pastTheEnd) update({ page: pageCount });
  }, [pastTheEnd, pageCount, update]);

  const openCreate = () => {
    router.push("/doctor/prescriptions/new");
  };

  const openDetail = (prescription: DoctorPrescriptionRow) => {
    if (prescription.id) router.push(`/doctor/prescriptions/${encodeURIComponent(prescription.id)}`);
  };

  const handleDownload = (prescription: DoctorPrescriptionRow) => {
    if (prescription.pdfUrl) {
      // Saved as "<RxNumber>_<PatientName>.pdf" rather than a generic "prescription.pdf".
      void downloadPrescriptionPdf(prescription.pdfUrl, {
        reference: prescription.reference,
        patientName: prescription.patientName,
      }).catch((error: unknown) => {
        showErrorToast(error instanceof Error ? error.message : "The prescription PDF could not be downloaded.");
      });
    } else {
      showInfoToast("PDF not available for this prescription");
    }
  };

  const waitingForSession = !isHydrated || (!doctorId && !page);

  return (
    <DoctorPrescriptionsView
      filterState={filterState}
      filtersActive={hasNonDefaultFilters(filters)}
      todayKey={todayKey}
      rows={view.rows}
      total={view.total}
      isLoading={waitingForSession || (pageQuery.isPending && !page)}
      isRefreshing={pageQuery.isFetching && Boolean(page)}
      loadFailed={Boolean(pageQuery.error) && !page}
      refreshFailed={Boolean(pageQuery.error) && Boolean(page)}
      onRetry={() => void pageQuery.refetch()}
      summary={summary}
      summaryLoading={summaryQuery.isPending && !summary}
      onCreate={openCreate}
      onOpen={openDetail}
      onDownload={handleDownload}
    />
  );
}
