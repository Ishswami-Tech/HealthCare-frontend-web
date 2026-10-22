"use client";

import { useParams } from "next/navigation";
import { EditPrescriptionContent } from "./_components/EditPrescriptionContent";

// DocEditPrescription (B6): edit a saved, not-yet-dispensed prescription.
export default function DocEditPrescriptionPage() {
  const params = useParams<{ id?: string }>();
  const prescriptionId = String(params?.id || "").trim();
  return <EditPrescriptionContent key={prescriptionId} prescriptionId={prescriptionId} />;
}
