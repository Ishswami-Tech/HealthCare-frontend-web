"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDoctors } from "@/hooks/query/useDoctors";
import { useAssistantDoctorCoverage } from "@/hooks/query/useAppointments";
import { ShieldCheck, Users, Activity, ArrowRight } from "lucide-react";

type DoctorListItem = {
  id: string;
  name: string;
  role: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export default function AssistantDoctorCoveragePage() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const clinicId = user?.clinicId || "";
  const userId = user?.id || "";

  const { data: assistantCoverageData = [] } = useAssistantDoctorCoverage();
  const { data: doctorsData } = useDoctors(clinicId, { limit: 200 });

  const doctors = useMemo<DoctorListItem[]>(() => {
    const raw = doctorsData as unknown;
    const arr = Array.isArray(raw)
      ? raw
      : isRecord(raw) && Array.isArray(raw.data)
        ? raw.data
        : isRecord(raw) && isRecord(raw.data) && Array.isArray(raw.data.doctors)
          ? raw.data.doctors
          : [];

    return arr
      .map((doctorValue) => {
        const doctorRecord = isRecord(doctorValue) ? doctorValue : {};
        const nestedDoctor = isRecord(doctorRecord.doctor) ? doctorRecord.doctor : {};
        const nestedUser = isRecord(nestedDoctor.user) ? nestedDoctor.user : {};

        return {
          id: String(nestedDoctor.id ?? doctorRecord.id ?? ""),
          name: String(doctorRecord.name ?? nestedUser.name ?? "Doctor"),
          role: String(doctorRecord.role ?? nestedUser.role ?? "").toUpperCase(),
        };
      })
      .filter((doctor) => !!doctor.id);
  }, [doctorsData]);

  const primaryDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.role === "DOCTOR"),
    [doctors]
  );

  const assistantCoverage = useMemo(() => {
    if (!userId) return null;
    return assistantCoverageData.find((entry) => entry.assistantDoctorId === userId) ?? null;
  }, [assistantCoverageData, userId]);

  const coveredPrimaryDoctors = useMemo(() => {
    if (!assistantCoverage) return [];

    return assistantCoverage.primaryDoctorIds
      .map((primaryDoctorId) => primaryDoctors.find((doctor) => doctor.id === primaryDoctorId))
      .filter((doctor): doctor is DoctorListItem => Boolean(doctor));
  }, [assistantCoverage, primaryDoctors]);

  const isCoverageActive = Boolean(assistantCoverage?.isActive);

  return (
    <DashboardPageShell className="p-4 sm:p-6">
      <DashboardPageHeader
        eyebrow="Assistant Doctor"
        title="Coverage and support lane"
        description="Assistant-doctor coverage is read from the clinic configuration so handoffs stay aligned with the supervising doctors."
        meta={
          <Badge
            variant="outline"
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isCoverageActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {isCoverageActive ? "Coverage active" : "Coverage inactive"}
          </Badge>
        }
        actionsSlot={
          <Button className="gap-2" onClick={() => router.push("/assistant-doctor/dashboard")}>
            <ArrowRight className="h-4 w-4" />
            Back to dashboard
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200/70 bg-emerald-50/60 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Current coverage
            </CardTitle>
            <CardDescription>Coverage comes from the clinic admin configuration.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isCoverageActive ? "Active" : "Inactive"}</div>
            <p className="mt-2 text-sm text-muted-foreground">
              {isCoverageActive
                ? "This assistant doctor is available for delegated work under the configured primary doctors."
                : "No active coverage assignment is configured for this assistant doctor yet."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200/70 bg-blue-50/60 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-blue-600" />
              Primary doctors
            </CardTitle>
            <CardDescription>Doctors this assistant can cover in the clinic.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{coveredPrimaryDoctors.length}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {coveredPrimaryDoctors.length > 0 ? (
                coveredPrimaryDoctors.map((doctor) => (
                  <Badge key={doctor.id} variant="secondary" className="rounded-full bg-blue-100 text-blue-700">
                    {doctor.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No primary doctors are linked yet.</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/70 bg-purple-50/60 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-purple-600" />
              Support lane
            </CardTitle>
            <CardDescription>Use the live queue and shared doctor views for handoffs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-between gap-2" onClick={() => router.push("/queue")}>
              Open queue
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between gap-2" onClick={() => router.push("/assistant-doctor/appointments")}>
              Open appointments
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardPageShell>
  );
}
