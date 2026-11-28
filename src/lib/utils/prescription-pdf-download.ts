"use client";

/** Keeps letters, digits and dashes; everything else becomes "_" (safe on every OS). */
function sanitizeFilePart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);
}

/** `<RxNumber>_<PatientName>.pdf`, sanitised; "prescription.pdf" when neither is known. */
export function prescriptionPdfFileName(reference: string | null | undefined, patientName?: string | null): string {
  const parts = [sanitizeFilePart(String(reference ?? "")), sanitizeFilePart(String(patientName ?? ""))].filter(Boolean);
  return `${parts.length > 0 ? parts.join("_") : "prescription"}.pdf`;
}

/**
 * `<InvoiceNumber>_<PatientName>.pdf` (e.g. `INV-2026-0042_Asha_Patil.pdf`), sanitised; "receipt.pdf"
 * when neither is known. Used for invoice receipts so they do not download as `<uuid>.pdf`.
 */
export function invoiceReceiptFileName(invoiceNumber: string | null | undefined, patientName?: string | null): string {
  const parts = [sanitizeFilePart(String(invoiceNumber ?? "")), sanitizeFilePart(String(patientName ?? ""))].filter(Boolean);
  return `${parts.length > 0 ? parts.join("_") : "receipt"}.pdf`;
}

/**
 * The file name from a Content-Disposition header (RFC 6266 `filename*=UTF-8''...` preferred over
 * `filename="..."`), reduced to its last path segment with unsafe characters removed; null when the
 * header carries no usable name.
 */
export function fileNameFromContentDisposition(header: string | null | undefined): string | null {
  if (!header) return null;
  const extended = /filename\*\s*=\s*(?:UTF-8|utf-8)?''([^;]+)/.exec(header)?.[1];
  const plain = /filename\s*=\s*"?([^";]+)"?/.exec(header)?.[1];
  let raw = (extended ?? plain ?? "").trim();
  if (extended) {
    try {
      raw = decodeURIComponent(raw);
    } catch {
      // Keep the raw value when it is not valid percent-encoding.
    }
  }
  const lastSegment = raw.split(/[/\\]/).pop() ?? "";
  const safe = lastSegment.replace(/[<>:"|?*\u0000-\u001f]/g, "").trim().slice(0, 120);
  return safe && safe !== "." && safe !== ".." ? safe : null;
}

/**
 * Downloads a prescription PDF (same-origin `/api/pharmacy/prescriptions/:id/pdf`) under a readable
 * name instead of the generic one the browser would pick. Throws with a user-facing message on failure.
 */
export async function downloadPrescriptionPdf(
  url: string,
  names: { reference?: string | null; patientName?: string | null },
): Promise<void> {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) {
    throw new Error(response.status === 404 ? "This prescription PDF is not available." : "The prescription PDF could not be downloaded.");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = prescriptionPdfFileName(names.reference, names.patientName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Give the browser a moment to start the download before the blob URL goes away.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  }
}
