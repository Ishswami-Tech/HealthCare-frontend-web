"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { ClinicServiceTogglesPanel } from "@/components/clinic/ClinicServiceTogglesPanel";
import { useClinics } from "@/hooks/query/useClinics";
import type { ClinicWithRelations } from "@/types/clinic.types";

/** Super admin: QR self check-in / video / in-person switches for any clinic. */
export default function SuperAdminClinicServicesPage() {
  const { data: clinicsData, isPending } = useClinics();
  const [selectedClinicId, setSelectedClinicId] = useState("");

  const clinics = useMemo(() => {
    const data = clinicsData as { clinics?: ClinicWithRelations[]; data?: ClinicWithRelations[] } | ClinicWithRelations[] | undefined;
    const list = Array.isArray(data) ? data : data?.clinics || data?.data || [];
    return list.filter((clinic): clinic is ClinicWithRelations => Boolean(clinic?.id));
  }, [clinicsData]);
  const clinicId = selectedClinicId || clinics[0]?.id || "";

  return (
    <DashboardPageShell className="p-4 md:p-6">
      <DashboardPageHeader
        eyebrow="Super Admin"
        title="Clinic services"
        description="Turn QR self check-in, video consultations and in-person consultations on or off for any clinic. Clinic admins can change the same switches for their own clinic."
      />
      <div className="flex max-w-3xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="clinic-services-clinic">Clinic</Label>
          {isPending ? (
            <Skeleton className="h-9 w-full sm:w-[320px]" />
          ) : clinics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clinics found.</p>
          ) : (
            <Select value={clinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger id="clinic-services-clinic" className="w-full sm:w-[320px]">
                <SelectValue placeholder="Select clinic" />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name || clinic.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {clinicId ? <ClinicServiceTogglesPanel key={clinicId} clinicId={clinicId} /> : null}
      </div>
    </DashboardPageShell>
  );
}
