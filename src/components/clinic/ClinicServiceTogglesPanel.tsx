"use client";

import { useMemo, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading";
import { OpdServiceToggleList } from "@/components/clinic/OpdServiceToggleList";
import { useClinic, useUpdateClinic } from "@/hooks/query/useClinics";
import {
  buildOpdServiceTogglesPatch,
  OPD_SERVICE_TOGGLE_KEYS,
  readOpdServiceToggles,
  type OpdServiceToggleKey,
  type OpdServiceToggles,
} from "@/lib/clinics/opd-controls.logic";

/**
 * View and set one clinic's QR self check-in / video / in-person switches, saved on its own
 * through `PUT /clinics/:id`. Used by super admins for any clinic.
 */
export function ClinicServiceTogglesPanel({ clinicId }: { clinicId: string }) {
  const clinicQuery = useClinic(clinicId);
  const updateClinic = useUpdateClinic();
  // Drafts are kept per clinic so switching the picker never carries edits across clinics.
  const [drafts, setDrafts] = useState<Record<string, Partial<OpdServiceToggles>>>({});

  const saved = useMemo(() => readOpdServiceToggles(clinicQuery.data?.settings), [clinicQuery.data]);
  const draft = drafts[clinicId] ?? {};
  const value: OpdServiceToggles = { ...saved, ...draft };
  const isDirty = OPD_SERVICE_TOGGLE_KEYS.some((key) => key in draft && draft[key] !== saved[key]);

  const setToggle = (key: OpdServiceToggleKey, checked: boolean) =>
    setDrafts((previous) => ({ ...previous, [clinicId]: { ...previous[clinicId], [key]: checked } }));
  const reset = () => setDrafts((previous) => ({ ...previous, [clinicId]: {} }));

  const save = async () => {
    // Merge into the latest stored settings, not a possibly stale cache, so other opdControls
    // keys (pause, emergency mode, location requirement) survive.
    // Only the switches changed here are written, so a flip made meanwhile by someone else stays.
    const latest = await clinicQuery.refetch();
    const latestSettings = (latest?.data as { settings?: unknown } | undefined)?.settings ?? clinicQuery.data?.settings;
    try {
      await updateClinic.mutateAsync({
        id: clinicId,
        data: { settings: buildOpdServiceTogglesPatch(latestSettings, draft) },
      });
      reset();
    } catch {
      // The mutation hook reports the failure; the draft stays so the admin can retry.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinic services</CardTitle>
        <CardDescription>
          {clinicQuery.data?.name ? `${clinicQuery.data.name}: ` : ""}
          turn patient QR check-in and each consultation type on or off. Reception can always check
          patients in by hand.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {clinicQuery.isPending ? (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading clinic services">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : clinicQuery.error || !clinicQuery.data ? (
          <p role="alert" className="text-sm text-destructive">
            Could not load this clinic&apos;s settings. {clinicQuery.error?.message ?? ""}
          </p>
        ) : (
          <>
            <OpdServiceToggleList value={value} onChange={setToggle} disabled={updateClinic.isPending} />
            {!value.videoConsultationEnabled && !value.generalConsultationEnabled ? (
              <p role="status" className="text-sm text-amber-700 dark:text-amber-400">
                Both consultation types are off: patients will see that online booking is paused.
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={reset} disabled={!isDirty || updateClinic.isPending}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Discard
              </Button>
              <Button onClick={() => void save()} disabled={!isDirty || updateClinic.isPending}>
                {updateClinic.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                Save services
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
