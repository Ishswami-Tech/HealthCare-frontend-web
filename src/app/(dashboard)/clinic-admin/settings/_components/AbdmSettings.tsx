"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateClinic } from "@/hooks/query/useClinics";
import { showErrorToast, showSuccessToast } from "@/hooks/utils/use-toast";

type Props = { clinicId: string; abdmHipId?: string };

/**
 * Phase 1 ABDM scaffolding: the clinic's own Health Information Provider (HIP) id.
 * Nothing here calls the ABDM gateway — this just stores the id for later phases.
 */
export function AbdmSettings({ clinicId, abdmHipId }: Props) {
  const updateClinic = useUpdateClinic();
  const [value, setValue] = useState(abdmHipId ?? "");

  useEffect(() => {
    setValue(abdmHipId ?? "");
  }, [abdmHipId]);

  const dirty = value.trim() !== (abdmHipId ?? "").trim();

  const save = async () => {
    try {
      await updateClinic.mutateAsync({ id: clinicId, data: { abdmHipId: value.trim() } });
      showSuccessToast("ABDM HIP id saved.");
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Unable to save the ABDM HIP id.");
    }
  };

  return (
    <Card className="border-cyan-200 bg-cyan-50/70 shadow-sm dark:border-cyan-900/70 dark:bg-cyan-950/20">
      <CardHeader className="gap-2 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>ABDM</CardTitle>
            <CardDescription>Ayushman Bharat Digital Mission identifiers for this clinic.</CardDescription>
          </div>
          <ShieldCheck className="size-5 text-cyan-700 dark:text-cyan-300" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 sm:px-5">
        <div className="grid gap-2">
          <Label htmlFor="abdm-hip-id">HIP id</Label>
          <Input
            id="abdm-hip-id"
            className="h-10"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Health Information Provider id"
          />
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={save} disabled={!dirty || updateClinic.isPending}>
            {updateClinic.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
