"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Clock, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROFILE_SWITCH, ProfileCard } from "./DoctorProfileParts";
import type { DoctorProfileFormState } from "./doctor-profile.types";

interface DoctorProfileAvailabilityTabProps {
  profileData: DoctorProfileFormState;
  updateAvailability: (day: string, field: string, value: unknown) => void;
  onSave: () => void | Promise<void>;
  isSaving?: boolean;
}

/** Phone: day + switch on one line, the two times under it. Desktop: the four columns of the design. */
const ROW_GRID =
  "grid grid-cols-2 items-center gap-x-4 md:grid-cols-[130px_150px_minmax(0,1fr)_minmax(0,1fr)]";

function dayLabel(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export function DoctorProfileAvailabilityTab({
  profileData,
  updateAvailability,
  onSave,
  isSaving = false,
}: DoctorProfileAvailabilityTabProps) {
  return (
    <ProfileCard
      icon={Clock}
      title="Weekly Availability"
      description="Set your available days and hours, then click Save Changes."
      action={
        <Button type="button" variant="soft" className="h-10" onClick={() => void onSave()} disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          {isSaving ? "Saving…" : "Save availability"}
        </Button>
      }
    >
      <div className="flex flex-col" role="table" aria-label="Weekly availability">
        <div
          role="row"
          className={cn(
            ROW_GRID,
            "hidden border-b border-hair pb-2.5 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted md:grid",
          )}
        >
          <span role="columnheader">Day</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Start time</span>
          <span role="columnheader">End time</span>
        </div>

        {Object.entries(profileData.availability).map(([day, schedule]) => {
          const name = dayLabel(day);
          return (
            <div
              key={day}
              role="row"
              className={cn(
                ROW_GRID,
                "gap-y-2.5 border-b border-hair py-3 last:border-b-0 last:pb-0 md:min-h-[60px] md:py-2",
              )}
            >
              <span role="cell" className="min-w-0 text-sm font-bold text-ink">
                {name}
              </span>
              <span
                role="cell"
                className={cn(
                  "flex items-center gap-2.5 justify-self-end text-[13px] md:justify-self-start",
                  schedule.available ? "text-ink" : "text-ink-muted",
                )}
              >
                <Switch
                  id={`availability-${day}`}
                  className={PROFILE_SWITCH}
                  checked={schedule.available}
                  onCheckedChange={(checked) => updateAvailability(day, "available", checked)}
                />
                <label htmlFor={`availability-${day}`}>
                  <span className="sr-only">{name} </span>Available
                </label>
              </span>
              {schedule.available ? (
                <>
                  <span role="cell" className="min-w-0">
                    <Input
                      type="time"
                      aria-label={`${name} start time`}
                      className="h-[42px]"
                      value={schedule.startTime}
                      onChange={(e) => updateAvailability(day, "startTime", e.target.value)}
                    />
                  </span>
                  <span role="cell" className="min-w-0">
                    <Input
                      type="time"
                      aria-label={`${name} end time`}
                      className="h-[42px]"
                      value={schedule.endTime}
                      onChange={(e) => updateAvailability(day, "endTime", e.target.value)}
                    />
                  </span>
                </>
              ) : (
                <span role="cell" className="col-span-2 text-[13px] text-ink-muted">
                  Not Available
                </span>
              )}
            </div>
          );
        })}
      </div>
    </ProfileCard>
  );
}
