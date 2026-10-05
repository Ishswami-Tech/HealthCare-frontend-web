"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PatientMedicinesView } from "@/app/(dashboard)/patient/health/_components/PatientMedicinesView";
import {
  buildCurrentMedicines,
  buildPrescriptions,
  formatRupees,
  medicinesSourceLabel,
  type PatientPrescription,
} from "@/app/(dashboard)/patient/health/_components/patient-health.logic";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMedicationAdherence } from "@/hooks/query/useMedicalRecords";
import { usePrescriptions } from "@/hooks/query/usePharmacy";
import { showErrorToast } from "@/hooks/utils/use-toast";
import { clinicApiClient } from "@/lib/api/client";

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
  const [downloadingBillId, setDownloadingBillId] = useState<string | null>(null);

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

  // Same call the patient billing screen makes for an invoice PDF.
  const handleDownloadBill = async (invoiceId: string) => {
    try {
      setDownloadingBillId(invoiceId);
      const result = await clinicApiClient.get<Blob>(`/billing/invoices/${invoiceId}/download`);
      const blob = result.data;
      if (!(blob instanceof Blob)) throw new Error("The bill could not be downloaded");
      const url = window.URL.createObjectURL(blob);
      // An anchor click is not blocked as a popup after the wait.
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (downloadError) {
      showErrorToast(downloadError instanceof Error ? downloadError.message : "The bill could not be downloaded");
    } finally {
      setDownloadingBillId(null);
    }
  };

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
      onDownloadBill={(invoiceId) => void handleDownloadBill(invoiceId)}
      downloadingBillId={downloadingBillId}
      initialPrescriptionId={initialPrescriptionId}
    />
  );

  return embedded ? view : <DashboardPageShell>{view}</DashboardPageShell>;
}
