"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/loading";
import { useAppointmentServices } from "@/hooks/query/useAppointments";
import { useUpdateClinic } from "@/hooks/query/useClinics";
import { showErrorToast } from "@/hooks/utils/use-toast";
import { plural } from "@/lib/utils/labels";
import type { AppointmentServiceDefinition } from "@/types/appointment.types";

/** Clinic setting key (backend bookable-services.util: appointmentSettings.bookableTreatmentTypes). */
const SETTING_KEY = "bookableTreatmentTypes";

interface BookableServicesSettingsProps {
  clinicId: string;
  /** `clinic.settings` as stored; the saved list is read from `appointmentSettings`. */
  clinicSettings: unknown;
  className?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The list saved on the clinic, or null when unset (the server then uses its default list). */
function storedTypes(clinicSettings: unknown): string[] | null {
  const appointmentSettings = isRecord(clinicSettings) ? clinicSettings.appointmentSettings : undefined;
  const value = isRecord(appointmentSettings) ? appointmentSettings[SETTING_KEY] : undefined;
  if (!Array.isArray(value)) return null;
  const types = value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  return types.length > 0 ? types : null;
}

function sameSet(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  return left.size === right.size && [...left].every((item) => right.has(item));
}

/**
 * "Services patients can book": which catalog services the patient booking dialog offers. The
 * list comes from GET /appointments/services/catalog (each entry carries `bookable` for this
 * clinic); saving writes `appointmentSettings.bookableTreatmentTypes` through PUT /clinics/:id,
 * and "Use default" sends null so the server removes the key and falls back to its default list.
 */
export function BookableServicesSettings({ clinicId, clinicSettings, className }: BookableServicesSettingsProps) {
  const queryClient = useQueryClient();
  const servicesQuery = useAppointmentServices(Boolean(clinicId));
  const updateClinic = useUpdateClinic();
  const services = useMemo<AppointmentServiceDefinition[]>(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const saved = useMemo(() => storedTypes(clinicSettings), [clinicSettings]);
  // What the server offers patients today: the saved list, or the default when nothing is saved.
  const current = useMemo(
    () =>
      new Set(
        saved ?? services.filter((service) => service.bookable === true).map((service) => service.treatmentType),
      ),
    [saved, services],
  );
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const selected = draft ?? current;
  const changed = draft !== null && !sameSet(draft, current);
  const busy = updateClinic.isPending;

  const toggle = (treatmentType: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(treatmentType);
    else next.delete(treatmentType);
    setDraft(next);
  };

  const persist = async (value: string[] | null) => {
    try {
      await updateClinic.mutateAsync({
        id: clinicId,
        data: { settings: { appointmentSettings: { [SETTING_KEY]: value } } },
      });
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["appointment-services"] });
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "The bookable services could not be saved");
    }
  };

  const noneSelected = selected.size === 0;
  // An empty list would silently fall back to the server default, so block it instead.
  const save = () => {
    if (noneSelected) {
      showErrorToast("Pick at least one service, or use the default list.");
      return;
    }
    void persist(services.map((s) => s.treatmentType).filter((t) => selected.has(t)));
  };
  const useDefault = () => void persist(null);

  return (
    <Card className={className}>
      <CardHeader className="px-4 sm:px-5">
        <CardTitle>Services patients can book</CardTitle>
        <CardDescription>
          Choose what patients see in the booking dialog. Staff can still book any service.
          {saved ? "" : " Nothing is saved yet, so the default list is in use."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 sm:px-5">
        {servicesQuery.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : servicesQuery.error ? (
          <p className="m-0 text-sm text-destructive">The service list could not be loaded. Reload the page to try again.</p>
        ) : services.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">No services are set up yet.</p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
            {services.map((service) => {
              const id = `bookable-${service.treatmentType}`;
              return (
                <li key={service.treatmentType} className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <Checkbox
                    id={id}
                    checked={selected.has(service.treatmentType)}
                    disabled={busy}
                    onCheckedChange={(value) => toggle(service.treatmentType, value === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor={id} className="flex min-w-0 flex-col gap-0.5 text-sm">
                    <span className="font-semibold text-foreground">{service.label}</span>
                    {service.description ? <span className="text-xs text-muted-foreground">{service.description}</span> : null}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={!changed || busy || noneSelected} onClick={save}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save services
          </Button>
          <Button size="sm" variant="outline" disabled={busy || (!saved && draft === null)} onClick={useDefault}>
            <RotateCcw className="size-4" />
            Use default
          </Button>
          {noneSelected ? (
            <span role="alert" className="text-xs font-semibold text-destructive">
              Pick at least one service. Patients need something to book.
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{plural(selected.size, "service")} offered to patients</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
