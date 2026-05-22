"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  ClinicOperatingDayKey,
  ClinicOperatingSession,
} from "@/types/clinic.types";
import { Plus, Trash2 } from "lucide-react";

const DAYS: ClinicOperatingDayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABEL: Record<ClinicOperatingDayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const TIME_INPUT_CLASS =
  "h-10 w-full min-w-0 rounded-md border border-indigo-200 bg-white px-3 text-sm font-medium leading-none tabular-nums shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-200/70 dark:border-indigo-900/70 dark:bg-background [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-datetime-edit-fields-wrapper]:p-0 [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-hour-field]:px-0.5 [&::-webkit-datetime-edit-minute-field]:px-0.5 [&::-webkit-datetime-edit-ampm-field]:px-1";

type SessionState = Record<ClinicOperatingDayKey, ClinicOperatingSession[]>;

type OperatingWindowsEditorProps = {
  sessions: SessionState;
  onAddSession: (day: ClinicOperatingDayKey) => void;
  onUpdateSession: (
    day: ClinicOperatingDayKey,
    index: number,
    field: "start" | "end",
    value: string
  ) => void;
  onDeleteSession: (day: ClinicOperatingDayKey, index: number) => void;
};

export function OperatingWindowsEditor({
  sessions,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
}: OperatingWindowsEditorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-indigo-200 bg-white/80 shadow-sm dark:border-indigo-900/70 dark:bg-background/40">
      <div className="grid grid-cols-[120px_minmax(0,1fr)_72px] border-b border-indigo-200 bg-indigo-100/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-900 dark:border-indigo-900/70 dark:bg-indigo-950/30 dark:text-indigo-100">
        <div>Day</div>
        <div>Sessions</div>
        <div className="text-right">Action</div>
      </div>
      <div className="divide-y divide-indigo-100 dark:divide-indigo-900/50">
        {DAYS.map((day) => (
          <div
            key={day}
            className="grid gap-3 px-3 py-3 sm:grid-cols-[120px_minmax(0,1fr)_72px] sm:items-start"
          >
            <div className="pt-2 font-semibold text-foreground">
              {DAY_LABEL[day]}
            </div>
            <div className="gap-y-2">
              {sessions[day].length > 0 ? (
                sessions[day].map((session, index) => (
                  <div
                    key={`${day}-${index}`}
                    className="grid grid-cols-1 gap-2 rounded-lg border border-indigo-100 bg-white p-2 shadow-sm dark:border-indigo-900/60 dark:bg-background/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <Input
                      type="time"
                      value={session.start}
                      onChange={(event) =>
                        onUpdateSession(day, index, "start", event.target.value)
                      }
                      className={TIME_INPUT_CLASS}
                      aria-label={`${DAY_LABEL[day]} session ${index + 1} start`}
                    />
                    <Input
                      type="time"
                      value={session.end}
                      onChange={(event) =>
                        onUpdateSession(day, index, "end", event.target.value)
                      }
                      className={TIME_INPUT_CLASS}
                      aria-label={`${DAY_LABEL[day]} session ${index + 1} end`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-9 w-8 text-destructive"
                      onClick={() => onDeleteSession(day, index)}
                      aria-label={`Delete ${DAY_LABEL[day]} session ${index + 1}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="inline-flex rounded-md bg-indigo-100/70 px-2 py-1 text-xs text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
                  Closed
                </div>
              )}
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onAddSession(day)}
                aria-label={`Add ${DAY_LABEL[day]} session`}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


