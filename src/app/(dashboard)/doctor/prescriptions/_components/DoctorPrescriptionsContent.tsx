"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHydrated } from "@/hooks/utils/useHydrated";
import { showErrorToast, showInfoToast } from "@/hooks/utils/use-toast";
import { downloadPrescriptionPdf } from "@/lib/utils/prescription-pdf-download";
import { usePrescriptionPage, usePrescriptionSummary } from "@/hooks/query/usePrescriptions";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import { DoctorPrescriptionsView, type DoctorRxTab } from "./DoctorPrescriptionsView";
import { isDraftPrescription, normalizeDoctorPrescriptions, type DoctorPrescriptionRow } from "./doctor-prescriptions.logic";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // "Today" is an IST day key; it only exists once the page runs in the browser.
  const isHydrated = useHydrated();
  const todayKey = isHydrated ? formatDateKeyInIST(new Date()) : "";

  // The screen has two views: the prescription list and the stock hand-over. The URL picks
  // one (`?tab=handover`), the same deep-link shape the Profile screen uses for its tabs.
  const activeTab: DoctorRxTab = searchParams?.get("tab") === "handover" ? "handover" : "prescriptions";

  const filterState = useDoctorPrescriptionFilters();
  const { filters, update } = filterState;

  /**
   * Switching the view keeps the list filters but drops the hand-over pre-fills (they belong to
   * the tab that was left), so the address never shows a patient from the other view.
   */
  const changeTab = useCallback(
    (tab: DoctorRxTab) => {
      const params = new URLSearchParams(window.location.search);
      params.delete("tab");
      params.delete("patientId");
      params.delete("appointmentId");
      params.delete("prescriptionId");
      if (tab === "handover") params.set("tab", "handover");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

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

  // Draft rows (assistant-prepared, awaiting the doctor) open the review screen with the
  // approve / return workflow; everything else opens the read-only prescription detail.
  const openDetail = (prescription: DoctorPrescriptionRow) => {
    if (!prescription.id) return;
    const href = isDraftPrescription(prescription)
      ? `/doctor/drafts/${encodeURIComponent(prescription.id)}`
      : `/doctor/prescriptions/${encodeURIComponent(prescription.id)}`;
    router.push(href);
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
      activeTab={activeTab}
      onTabChange={changeTab}
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
