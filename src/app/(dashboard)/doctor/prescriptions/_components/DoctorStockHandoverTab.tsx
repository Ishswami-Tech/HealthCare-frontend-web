"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Chip, TbdPage } from "@/components/tbd";
import { DirectDispenseWorkspace } from "@/components/dispense/DirectDispenseWorkspace";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useAppointment } from "@/hooks/query/useAppointments";
import { todayKeyIST } from "@/components/doctor/visit/useDoctorVisit";
import { visitHref } from "@/components/doctor/visit/visit-routes";

type Raw = Record<string, unknown>;
const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/**
 * The "Stock hand-over" tab of the Prescriptions screen: hand medicines over from clinic stock,
 * with or without a prescription (SPEC2 §5). Stock is deducted (earliest expiry first) and the
 * record goes to billing automatically — the same wiring the old standalone /doctor/dispense
 * screen had before it was folded in here as a tab.
 *
 * Deep links pre-fill the form: `?patientId=` selects the patient, `?prescriptionId=` offers
 * "Load from prescription", and `?appointmentId=` derives the stock-location chip and the
 * "Complete visit" action (visible only with an appointment).
 */
export function DoctorStockHandoverTab() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams?.get("appointmentId") ?? "";
  const patientId = searchParams?.get("patientId") ?? "";
  const prescriptionId = searchParams?.get("prescriptionId") ?? "";
  const clinicId = useCurrentClinicId() || "";
  const { session } = useAuth();
  const appointment = asRecord(useAppointment(appointmentId).data);
  const locationId = asText(appointment.locationId) || asText(asRecord(appointment.location).id);
  const locationName = asText(asRecord(appointment.location).name);

  return (
    <TbdPage
      title="Stock hand-over"
      description="Hand medicines from clinic stock to any patient, with or without a prescription. Stock is deducted and the record goes to billing automatically."
      {...(appointmentId ? { backHref: visitHref(appointmentId), backLabel: "Back to visit" } : {})}
      actions={
        <>
          {locationName ? <Chip>Stock location · {locationName}</Chip> : null}
          {appointmentId ? (
            <Button variant="outline" size="md" asChild>
              <Link href={visitHref(appointmentId, "complete")}>Complete visit</Link>
            </Button>
          ) : null}
        </>
      }
    >
      {clinicId ? (
        <DirectDispenseWorkspace
          clinicId={clinicId}
          currentUserId={String(session?.user?.id ?? "")}
          todayKey={todayKeyIST()}
          dispenserRole="DOCTOR"
          {...(patientId ? { initialPatientId: patientId } : {})}
          {...(prescriptionId ? { prescriptionId } : {})}
          {...(locationId ? { locationId } : {})}
          {...(locationName ? { locationLabel: locationName } : {})}
        />
      ) : null}
    </TbdPage>
  );
}
