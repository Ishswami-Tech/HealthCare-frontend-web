"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TbdPage } from "@/components/tbd";
import { DirectDispenseWorkspace } from "@/components/dispense/DirectDispenseWorkspace";
import { todayKeyIST } from "@/components/doctor/visit/useDoctorVisit";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";

// PhDispense: the pharmacist hands medicine from clinic stock to any patient, with or without a
// prescription (backend POST /direct-dispense allows PHARMACIST). Optional `?patientId=` preselects.
function PharmacistDispenseScreen() {
  const params = useSearchParams();
  const patientId = params?.get("patientId") ?? "";
  const { clinicId } = useClinicContext();
  const { session } = useAuth();

  return (
    <TbdPage
      title="Dispense from clinic stock"
      description="Hand medicine to any patient, with or without a prescription. Stock is deducted (soonest expiry first) and the record goes to billing automatically."
    >
      {clinicId ? (
        <DirectDispenseWorkspace
          key={patientId || "new"}
          clinicId={clinicId}
          currentUserId={String(session?.user?.id ?? "")}
          todayKey={todayKeyIST()}
          dispenserRole="PHARMACIST"
          {...(patientId ? { initialPatientId: patientId } : {})}
        />
      ) : null}
    </TbdPage>
  );
}

export default function PharmacistDispensePage() {
  return (
    <Suspense fallback={null}>
      <PharmacistDispenseScreen />
    </Suspense>
  );
}
