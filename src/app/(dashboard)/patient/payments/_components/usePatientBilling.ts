"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { showErrorToast } from "@/hooks/utils/use-toast";
import { clinicApiClient } from "@/lib/api/client";

/** Who is signed in and which clinic the billing data belongs to. */
export function usePatientBillingIdentity() {
  const { session } = useAuth();
  const currentClinicId = useCurrentClinicId();
  const user = session?.user;
  return {
    userId: user?.id || "",
    clinicId: user?.clinicId || currentClinicId || "",
    userName: user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "",
  };
}

/**
 * Opens an invoice PDF. Calls the backend directly via clinicApiClient (absolute baseURL,
 * Authorization header attached): `GET /billing/invoices/:id/download`, which the PATIENT role
 * may use for its own invoices.
 */
export function useInvoicePdfDownload() {
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  const downloadPdf = useCallback(async (invoiceId: string) => {
    try {
      setDownloadingPdfId(invoiceId);
      const result = await clinicApiClient.get<Blob>(`/billing/invoices/${invoiceId}/download`);
      const blob = result.data;
      if (!blob) throw new Error("Failed to download PDF");
      const url = window.URL.createObjectURL(blob);

      // Use an anchor tag click to bypass popup blockers after async fetch
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("PDF Download error:", error);
      showErrorToast("The invoice PDF could not be opened. Please try again.");
    } finally {
      setDownloadingPdfId(null);
    }
  }, []);

  return { downloadingPdfId, downloadPdf };
}
