"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { PatientMedicinesView } from "@/components/patient/health/PatientMedicinesView";
import {
  buildCurrentMedicines,
  buildPrescriptions,
  medicinesSourceLabel,
  type PatientPrescription,
} from "@/components/patient/health/patient-health.logic";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMedicationAdherence } from "@/hooks/query/useMedicalRecords";
import { usePrescriptions } from "@/hooks/query/usePharmacy";
import { formatRupees } from "@/lib/utils/currency";
import { useInvoicePdfDownload } from "@/hooks/query/useInvoicePdfDownload";

type PatientPrescriptionsProps = {
  /** True when a page already provides the page column (the screen is drawn without its own shell). */
  embedded?: boolean;
};

/**
 * Medicines (`/patient/health/medicines`): the patient's prescriptions from the pharmacy list,
 * the medicines they are on now, what is waiting at the medicine desk, and the Pay action for
 * a prescription that still has an amount due.
 */
export default function PatientPrescriptions({ embedded = false }: PatientPrescriptionsProps) {
  const { session, isPending: authLoading } = useAuth();
  const user = session?.user;
  const searchParams = useSearchParams();
  const { downloadingPdfId: downloadingBillId, downloadPdf: downloadBill } = useInvoicePdfDownload(
    "The bill could not be opened. Please try again.",
  );

  const {
    data: prescriptionsData,
    isPending,
    error,
    refetch,
  } = usePrescriptions(user?.clinicId || "", {
    ...(user?.id ? { patientId: user.id } : {}),
    enabled: !!user?.clinicId && !!user?.id,
  });
  // Active medicines from the health record. The endpoint returns the list, not a score.
  const { data: adherenceData } = useMedicationAdherence(user?.id || "");

  const prescriptions = useMemo(() => buildPrescriptions(prescriptionsData), [prescriptionsData]);
  const medicines = useMemo(() => buildCurrentMedicines(prescriptions, adherenceData), [prescriptions, adherenceData]);

  // Paying always goes through PaymentButton (prescription id + the amount still due).
  const renderPay = (prescription: PatientPrescription, placement: "card" | "dialog") => (
    <PaymentButton
      prescriptionId={prescription.id}
      amount={prescription.pendingAmount}
      size="md"
      {...(placement === "card" ? { className: "h-12 w-full" } : {})}
    >
      Pay {formatRupees(prescription.pendingAmount)}
    </PaymentButton>
  );

  // Old links carried `?id=`; reports link with `?prescriptionId=`.
  const initialPrescriptionId = searchParams.get("prescriptionId") || searchParams.get("id");
  const canLoad = !!user?.id && !!user?.clinicId;

  const view = (
    <PatientMedicinesView
      sourceLabel={medicinesSourceLabel(prescriptions)}
      medicines={medicines}
      prescriptions={prescriptions}
      isLoading={!error && prescriptionsData === undefined && (authLoading || (canLoad && isPending))}
      // A failed background refresh keeps the list that is already on screen.
      failed={Boolean(error) && prescriptionsData === undefined}
      onRetry={() => void refetch()}
      renderPay={renderPay}
      onDownloadBill={(invoiceId) => void downloadBill(invoiceId)}
      downloadingBillId={downloadingBillId}
      initialPrescriptionId={initialPrescriptionId}
    />
  );

  return embedded ? view : <DashboardPageShell>{view}</DashboardPageShell>;
}
