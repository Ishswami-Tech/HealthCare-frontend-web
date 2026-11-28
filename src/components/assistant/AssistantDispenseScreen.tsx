"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadError, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import { DirectDispenseWorkspace } from "@/components/dispense/DirectDispenseWorkspace";
import { useDoctorPrescriptionDetail } from "@/app/(dashboard)/doctor/prescriptions/_components/useDoctorPrescriptionDetail";
import { todayKeyIST } from "@/components/doctor/visit/useDoctorVisit";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePrescriberDoctor } from "@/hooks/query/usePrescriberDoctor";
import { ASSISTANT_ROUTES } from "./assistant-routes";

/**
 * The shared hand-over workspace (`DirectDispenseWorkspace`, also used by DocDispense) as the
 * assistant doctor uses it: their hand-overs are visible to the doctor, then the success screen.
 */
function AssistantDispenseWorkspace({ patientId, prescriptionId }: { patientId?: string; prescriptionId?: string }) {
  const router = useRouter();
  const { clinicId } = useClinicContext();
  const { session } = useAuth();
  if (!clinicId) return null;
  return (
    <DirectDispenseWorkspace
      clinicId={clinicId}
      currentUserId={String(session?.user?.id ?? "")}
      todayKey={todayKeyIST()}
      dispenserRole="ASSISTANT_DOCTOR"
      {...(patientId ? { initialPatientId: patientId } : {})}
      {...(prescriptionId ? { prescriptionId } : {})}
      onDispensed={(dispense) => router.push(ASSISTANT_ROUTES.dispenseSuccess(dispense.id))}
    />
  );
}

function StockLink() {
  return (
    <Button asChild variant="outline" size="md">
      <Link href={ASSISTANT_ROUTES.stock}>
        <Package />
        View clinic stock
      </Link>
    </Button>
  );
}

/** AsDispense: hand medicine from clinic stock to any patient, with or without a prescription (`?patientId=`). */
export function AssistantDispenseScreen() {
  const params = useSearchParams();
  const patientId = params?.get("patientId") ?? "";
  const { clinicId } = useClinicContext();
  const { doctorName } = usePrescriberDoctor(clinicId || "");

  return (
    <TbdPage
      title="Dispense from clinic stock"
      description={`Hand medicine to any patient, with or without a prescription. ${doctorName || "The doctor"} sees every hand-over; billing picks it up on its own.`}
      actions={<StockLink />}
    >
      <AssistantDispenseWorkspace key={patientId || "new"} {...(patientId ? { patientId } : {})} />
    </TbdPage>
  );
}

/** AsDispense for an approved prescription (`[id]` = prescription id): its patient is preselected. */
export function AssistantDispensePrescriptionScreen({ prescriptionId }: { prescriptionId: string }) {
  const { detail, loading, error, retry } = useDoctorPrescriptionDetail(prescriptionId);

  return (
    <TbdPage
      title="Dispense medicines"
      description="Hand over the medicines of an approved prescription from clinic stock. Use “Load from prescription” to fill the list."
      backHref={ASSISTANT_ROUTES.dispense}
      backLabel="Dispense"
      actions={<StockLink />}
    >
      {error && !detail ? (
        <Surface flush>
          <LoadError title="This prescription could not be opened" message="A draft cannot be dispensed until the doctor approves it." onRetry={retry} />
        </Surface>
      ) : loading && !detail ? (
        <Surface flush>
          <SkeletonRows rows={4} />
        </Surface>
      ) : (
        <AssistantDispenseWorkspace
          key={prescriptionId}
          prescriptionId={prescriptionId}
          {...(detail?.patientId ? { patientId: detail.patientId } : {})}
        />
      )}
    </TbdPage>
  );
}
