"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateClinic } from "@/hooks/query/useClinics";
import { invalidateDoctorAvailabilityQueryFamilies } from "@/hooks/realtime/useWebSocketIntegration";
import { showErrorToast } from "@/hooks/utils/use-toast";

/**
 * Clinic working days + the plan-less walk-in rule. Both live in `clinic.settings.appointmentSettings`
 * and are applied by the server (backend clinic-working-days.util / walk-in-plan-policy.util):
 *   workingDays        weekday names; unset = Monday to Friday
 *   walkInWithoutPlan  REQUIRE_PLAN (unset) | ALLOW_WITH_DESK_FEE | ALLOW_FREE
 *   walkInDeskFee      rupees, for ALLOW_WITH_DESK_FEE
 * Saved through PUT /clinics/:id (merged into the stored settings); `null` resets a key to the default.
 */

const WEEK_DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;
type WeekDay = (typeof WEEK_DAYS)[number]["key"];
const DEFAULT_WORKING_DAYS: readonly WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const POLICIES = [
  { value: "REQUIRE_PLAN", label: "Require an active plan", hint: "The desk sells a plan first (current rule)." },
  { value: "ALLOW_WITH_DESK_FEE", label: "Allow, charge a desk fee", hint: "A bill is raised, paid at the counter." },
  { value: "ALLOW_FREE", label: "Allow, free visit", hint: "No plan and no bill." },
] as const;
type WalkInPolicy = (typeof POLICIES)[number]["value"];

interface BookingDaysWalkInSettingsProps {
  clinicId: string;
  /** `clinic.settings` as stored. */
  clinicSettings: unknown;
  className?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function appointmentSettingsOf(clinicSettings: unknown): Record<string, unknown> {
  const value = isRecord(clinicSettings) ? clinicSettings.appointmentSettings : undefined;
  return isRecord(value) ? value : {};
}

function storedWorkingDays(clinicSettings: unknown): WeekDay[] | null {
  const value = appointmentSettingsOf(clinicSettings).workingDays;
  if (!Array.isArray(value)) return null;
  const names = new Set(value.map((item) => String(item).toLowerCase()));
  const days = WEEK_DAYS.map((day) => day.key).filter((day) => names.has(day));
  return days.length > 0 ? days : null;
}

function storedPolicy(clinicSettings: unknown): WalkInPolicy {
  const value = String(appointmentSettingsOf(clinicSettings).walkInWithoutPlan ?? "").toUpperCase();
  return POLICIES.some((policy) => policy.value === value) ? (value as WalkInPolicy) : "REQUIRE_PLAN";
}

function storedDeskFee(clinicSettings: unknown): string {
  const value = Number(appointmentSettingsOf(clinicSettings).walkInDeskFee);
  return Number.isFinite(value) && value > 0 ? String(Math.round(value)) : "";
}

function sameDays(left: readonly WeekDay[], right: readonly WeekDay[]): boolean {
  return left.length === right.length && left.every((day) => right.includes(day));
}

export function BookingDaysWalkInSettings({ clinicId, clinicSettings, className }: BookingDaysWalkInSettingsProps) {
  const queryClient = useQueryClient();
  const updateClinic = useUpdateClinic();
  const savedDays = useMemo(() => storedWorkingDays(clinicSettings), [clinicSettings]);
  const currentDays = savedDays ?? [...DEFAULT_WORKING_DAYS];
  const savedPolicy = useMemo(() => storedPolicy(clinicSettings), [clinicSettings]);
  const savedFee = useMemo(() => storedDeskFee(clinicSettings), [clinicSettings]);

  const [daysDraft, setDaysDraft] = useState<WeekDay[] | null>(null);
  const [policyDraft, setPolicyDraft] = useState<WalkInPolicy | null>(null);
  const [feeDraft, setFeeDraft] = useState<string | null>(null);
  const days = daysDraft ?? currentDays;
  const policy = policyDraft ?? savedPolicy;
  const fee = feeDraft ?? savedFee;
  const busy = updateClinic.isPending;

  const daysChanged = daysDraft !== null && !sameDays(daysDraft, currentDays);
  const walkInChanged = (policyDraft !== null && policyDraft !== savedPolicy) || (feeDraft !== null && feeDraft !== savedFee);
  const feeNumber = Number(fee);
  const feeInvalid = policy === "ALLOW_WITH_DESK_FEE" && fee.trim() !== "" && !(Number.isFinite(feeNumber) && feeNumber > 0);

  const save = async (appointmentSettings: Record<string, unknown>, after: () => void) => {
    try {
      await updateClinic.mutateAsync({ id: clinicId, data: { settings: { appointmentSettings } } });
      after();
      // The slot grid follows the working days: drop cached availability.
      invalidateDoctorAvailabilityQueryFamilies(queryClient);
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "The settings could not be saved");
    }
  };

  const toggleDay = (day: WeekDay, open: boolean) => {
    const next = open ? [...days, day] : days.filter((item) => item !== day);
    setDaysDraft(WEEK_DAYS.map((item) => item.key).filter((item) => next.includes(item)));
  };

  const saveDays = () => {
    if (days.length === 0) {
      showErrorToast("Keep at least one working day.");
      return;
    }
    void save({ workingDays: days }, () => setDaysDraft(null));
  };

  const saveWalkIn = () => {
    if (feeInvalid) {
      showErrorToast("Enter the desk fee in rupees, or leave it empty to use the OPD consultation fee.");
      return;
    }
    void save(
      {
        walkInWithoutPlan: policy === "REQUIRE_PLAN" ? null : policy,
        walkInDeskFee: policy === "ALLOW_WITH_DESK_FEE" && fee.trim() !== "" ? Math.round(feeNumber) : null,
      },
      () => {
        setPolicyDraft(null);
        setFeeDraft(null);
      },
    );
  };

  const closedDays = WEEK_DAYS.filter((day) => !days.includes(day.key)).map((day) => day.label);

  return (
    <Card className={className}>
      <CardHeader className="px-4 sm:px-5">
        <CardTitle>Working days and walk-ins</CardTitle>
        <CardDescription>
          Days patients and the desk can book, and what the desk does when a patient has no care plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-4 sm:px-5">
        <section className="flex flex-col gap-3" aria-labelledby="working-days-title">
          <div className="flex flex-col gap-0.5">
            <h3 id="working-days-title" className="m-0 text-sm font-semibold text-foreground">
              Working days
            </h3>
            <p className="m-0 text-xs text-muted-foreground">
              {closedDays.length > 0
                ? `Closed on ${closedDays.join(", ")}: no slots are shown and bookings are refused.`
                : "Open every day."}
              {savedDays ? "" : " Default: Monday to Friday."}
            </p>
          </div>
          <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4 xl:grid-cols-7">
            {WEEK_DAYS.map((day) => {
              const id = `working-day-${day.key}`;
              return (
                <li key={day.key} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <Label htmlFor={id} className="text-sm font-semibold">
                    {day.label}
                  </Label>
                  <Switch
                    id={id}
                    checked={days.includes(day.key)}
                    disabled={busy}
                    onCheckedChange={(value) => toggleDay(day.key, value === true)}
                  />
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={!daysChanged || busy || days.length === 0} onClick={saveDays}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save working days
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || (!savedDays && daysDraft === null)}
              onClick={() => void save({ workingDays: null }, () => setDaysDraft(null))}
            >
              <RotateCcw className="size-4" />
              Use Mon–Fri
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="walk-in-plan-title">
          <div className="flex flex-col gap-0.5">
            <h3 id="walk-in-plan-title" className="m-0 text-sm font-semibold text-foreground">
              Walk-in without a care plan
            </h3>
            <p className="m-0 text-xs text-muted-foreground">
              Applies at the reception desk. Patients booking in the app still need a plan; video visits are unchanged.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="walk-in-policy">Rule</Label>
              <Select value={policy} disabled={busy} onValueChange={(value) => setPolicyDraft(value as WalkInPolicy)}>
                <SelectTrigger id="walk-in-policy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POLICIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{POLICIES.find((item) => item.value === policy)?.hint}</span>
            </div>
            {policy === "ALLOW_WITH_DESK_FEE" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="walk-in-desk-fee">Desk fee (₹)</Label>
                <Input
                  id="walk-in-desk-fee"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="OPD consultation fee"
                  value={fee}
                  disabled={busy}
                  aria-invalid={feeInvalid}
                  onChange={(event) => setFeeDraft(event.target.value)}
                />
                <span className={feeInvalid ? "text-xs font-semibold text-destructive" : "text-xs text-muted-foreground"}>
                  {feeInvalid ? "Enter a fee above ₹0." : "Leave empty to charge the OPD consultation fee."}
                </span>
              </div>
            ) : null}
          </div>
          <div>
            <Button size="sm" disabled={!walkInChanged || busy || feeInvalid} onClick={saveWalkIn}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save walk-in rule
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
