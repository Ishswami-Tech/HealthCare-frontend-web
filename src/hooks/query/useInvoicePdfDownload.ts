"use client";

import { useCallback, useState } from "react";
import { showErrorToast } from "@/hooks/utils/use-toast";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import { logger } from "@/lib/utils/logger";
import { fileNameFromContentDisposition } from "@/lib/utils/prescription-pdf-download";

const DEFAULT_ERROR_MESSAGE = "The invoice PDF could not be opened. Please try again.";

/**
 * Opens an invoice PDF in a new tab. Calls the backend directly through `clinicApiClient`
 * (absolute base URL, Authorization header attached): `GET /billing/invoices/:id/download`,
 * which the PATIENT role may use for its own invoices.
 *
 * `downloadingPdfId` is the invoice being fetched, for the busy state of its button.
 * With a `fileName` the PDF is saved under that name (a blob opened in a tab can only be saved as
 * `<uuid>.pdf`); without one it opens in a new tab.
 */
export function useInvoicePdfDownload(errorMessage: string = DEFAULT_ERROR_MESSAGE) {
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  const downloadPdf = useCallback(
    async (invoiceId: string, fileName?: string) => {
      try {
        setDownloadingPdfId(invoiceId);
        const result = await clinicApiClient.get<Blob>(API_ENDPOINTS.BILLING.INVOICES.DOWNLOAD_PDF(invoiceId));
        const blob = result.data;
        if (!(blob instanceof Blob)) throw new Error("The invoice PDF was not returned");
        const url = window.URL.createObjectURL(blob);
        // The caller's name wins; otherwise the name the server put in Content-Disposition, so a
        // bill / receipt never saves as `<uuid>.pdf`.
        const saveAs = fileName || fileNameFromContentDisposition(result.contentDisposition);

        // An anchor click is not blocked as a popup after the wait.
        const link = document.createElement("a");
        link.href = url;
        if (saveAs) {
          link.download = saveAs;
        } else {
          link.target = "_blank";
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      } catch (error) {
        logger.error("Invoice PDF download failed", error instanceof Error ? error : undefined, { invoiceId });
        showErrorToast(errorMessage);
      } finally {
        setDownloadingPdfId(null);
      }
    },
    [errorMessage],
  );

  return { downloadingPdfId, downloadPdf };
}
