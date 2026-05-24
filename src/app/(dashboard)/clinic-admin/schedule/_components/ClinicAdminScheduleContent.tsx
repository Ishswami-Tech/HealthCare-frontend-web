"use client";

import { useMemo } from "react";
import { AlertCircle, Calendar, CalendarDays, CheckCircle, Loader2, Plus, Save, Stethoscope, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { formatDateInIST, formatDateKeyInIST } from "@/lib/utils/date-time";

type DoctorScheduleDay = {
  day: string;
  startTime: string;
  endTime: string;
  available: boolean;
  slotDuration: number;
};

type DoctorScheduleRecord = {
  id: string;
  doctorName: string;
  specialization: string;
  schedules: DoctorScheduleDay[];
};

type HolidayRecord = {
  id: string;
  date: string;
  title: string;
  type: string;
};

type ScheduleConflict = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
};

type NewHolidayState = { date: string; title: string; type: string };

interface ClinicAdminScheduleContentProps {
  scheduleWritesSupported: boolean;
  updateSchedulePending: boolean;
  handleSaveSchedule: () => void;
  selectedDoctor: DoctorScheduleRecord | null;
  selectedDoctorStatus: string;
  localSchedules: DoctorScheduleRecord[];
  holidayList: HolidayRecord[];
  newHoliday: NewHolidayState;
  holidayDate: Date | undefined;
  setHolidayDate: (value: Date | undefined) => void;
  addHoliday: () => void;
  removeHoliday: (id: string) => void;
  updateSchedule: (dayIndex: number, field: keyof DoctorScheduleDay, value: string | boolean | number) => void;
  totalAvailableDays: number;
  totalWeeklySlots: number;
  selectedDoctorWeeklySlots: number;
  scheduleConflicts: ScheduleConflict[];
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="border-border bg-card/90 shadow-sm">
      <CardContent className="gap-y-1 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function ScheduleOverview({
  selectedDoctorStatus,
  localSchedules,
  holidayList,
  totalAvailableDays,
  totalWeeklySlots,
  scheduleConflicts,
}: Pick<
  ClinicAdminScheduleContentProps,
  | "selectedDoctorStatus"
  | "localSchedules"
  | "holidayList"
  | "totalAvailableDays"
  | "totalWeeklySlots"
  | "scheduleConflicts"
>) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Doctors"
        value={String(localSchedules.length)}
        description="Available doctor profiles loaded for this clinic."
      />
      <SummaryCard
        label="Available Days"
        value={String(totalAvailableDays)}
        description="Days currently marked open for the selected doctor."
      />
      <SummaryCard
        label="Weekly Slots"
        value={String(totalWeeklySlots)}
        description="Approximate appointments possible across all doctors."
      />
      <SummaryCard
        label="Conflicts"
        value={String(scheduleConflicts.length)}
        description="Schedule issues that should be corrected before publishing."
      />
    </div>
  );
}

function DoctorSchedulesTab({
  selectedDoctor,
  selectedDoctorWeeklySlots,
  localSchedules,
  updateSchedule,
}: Pick<
  ClinicAdminScheduleContentProps,
  "selectedDoctor" | "selectedDoctorWeeklySlots" | "localSchedules" | "updateSchedule"
>) {
  const totalAvailableDays = selectedDoctor ? selectedDoctor.schedules.filter((schedule) => schedule.available).length : 0;

  return (
    <Card className="gap-4 py-4 border-indigo-200 bg-indigo-50/70 shadow-sm dark:border-indigo-900/70 dark:bg-indigo-950/20">
      <CardHeader className="px-4 sm:px-5">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-5" />
          Doctor Schedule Planner
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 gap-y-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="gap-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="gap-y-2 sm:col-span-2">
                <Label>Select Doctor</Label>
                <div className="rounded-md border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm font-medium shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/20">
                  {selectedDoctor ? selectedDoctor.doctorName : "No doctor selected"}
                </div>
              </div>
              <div className="gap-y-2">
                <Label>Current State</Label>
                <div className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm font-medium text-emerald-900 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-emerald-100">
                  <div className="min-w-0">
                    <div className="truncate">{selectedDoctor ? selectedDoctor.doctorName : "No doctor selected"}</div>
                    <div className="truncate text-xs font-medium text-emerald-700 dark:text-emerald-200">
                      {selectedDoctor?.specialization || "Specialization not set"}
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-full border-emerald-200 bg-white/80 text-emerald-700 dark:border-emerald-900/70 dark:bg-background/40 dark:text-emerald-200">
                    Selected
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-white/80 p-3 shadow-sm dark:border-indigo-900/70 dark:bg-background/40">
              <div className="grid grid-cols-1 gap-3">
                {selectedDoctor?.schedules?.map((schedule, index) => {
                  const slots = schedule.available ? Math.floor(60 / schedule.slotDuration) : 0;
                  return (
                    <div key={`${schedule.day}-${index}`} className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-indigo-900/60 dark:bg-background/70">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
                            {schedule.day.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{schedule.day}</div>
                            <div className="text-xs text-muted-foreground">
                              {schedule.available ? "Open for appointments" : "Marked as closed"}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="h-10 rounded-full border-emerald-200 bg-emerald-50 px-3 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-emerald-200">
                          {schedule.available ? `${slots} slots` : "Closed"}
                        </Badge>
                      </div>
                      {schedule.available && schedule.startTime && schedule.endTime && schedule.startTime >= schedule.endTime ? (
                        <p className="mt-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                          End time must be after start time.
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="gap-y-3">
            <Card className="gap-4 py-4 border-emerald-200 bg-emerald-50/70 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/20">
              <CardHeader className="px-4 sm:px-5">
                <CardTitle>Doctor Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-5 gap-y-3">
                <div className="rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 dark:border-emerald-900/60 dark:bg-background/40">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selected Doctor</p>
                  <p className="text-sm font-semibold text-foreground">{selectedDoctor?.doctorName || "No doctor selected"}</p>
                  <p className="text-xs text-muted-foreground">{selectedDoctor?.specialization || "General"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-200">Days Open</p>
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{totalAvailableDays}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-200">Slots</p>
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{selectedDoctorWeeklySlots}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-4 py-4 border-emerald-200 bg-emerald-50/70 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/20">
              <CardHeader className="px-4 sm:px-5">
                <CardTitle>Consultation Durations</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-5 gap-y-2">
                {[
                  ["General Consultation", "15 min"],
                  ["Nadi Pariksha", "45 min"],
                  ["Diagnostic / Preventive Care", "60 min"],
                  ["Procedural Session", "90 min"],
                  ["Procedural Care", "60 min"],
                  ["Follow-up", "15 min"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 dark:border-emerald-900/60 dark:bg-background/40">
                    <span className="text-sm font-medium">{label}</span>
                    <Badge variant="secondary" className="rounded-full">{value}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="gap-4 py-4 border-emerald-200 bg-emerald-50/70 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/20">
              <CardHeader className="px-4 sm:px-5">
                <CardTitle>Quick Notes</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-5 gap-y-2">
                <div className="rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 text-sm dark:border-emerald-900/60 dark:bg-background/40">
                  Use the select field to switch doctors and update weekly hours before saving.
                </div>
                <div className="rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 text-sm dark:border-emerald-900/60 dark:bg-background/40">
                  Closed days keep the schedule clean and prevent accidental bookings.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HolidayManagementTab({
  holidayList,
  newHoliday,
  holidayDate,
  setHolidayDate,
  addHoliday,
  removeHoliday,
}: Pick<
  ClinicAdminScheduleContentProps,
  "holidayList" | "newHoliday" | "holidayDate" | "setHolidayDate" | "addHoliday" | "removeHoliday"
>) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Card className="gap-4 py-4 border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/20">
        <CardHeader className="px-4 sm:px-5">
          <CardTitle>Add New Holiday</CardTitle>
          <p className="text-sm text-muted-foreground">Pick the date, choose the holiday type, and add a clear title before saving.</p>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 gap-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="gap-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="h-10 w-full justify-start border-emerald-200 bg-white/80 text-left font-normal text-foreground shadow-sm hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-background/40 dark:hover:bg-emerald-950/20">
                    <Calendar className="mr-2 size-4 text-emerald-600" />
                    {holidayDate ? formatDateInIST(holidayDate, { month: "2-digit", day: "2-digit", year: "numeric" }, "en-US") : "mm/dd/yyyy"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto border-emerald-200 p-1 shadow-xl dark:border-emerald-900/60">
                  <CalendarPicker
                    mode="single"
                    selected={holidayDate}
                    onSelect={(date) => {
                      setHolidayDate(date);
                    }}
                    initialFocus
                    className="border-0 p-2 [--cell-size:--spacing(8)] sm:[--cell-size:--spacing(9)]"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="gap-y-2">
              <Label>Holiday Type</Label>
              <div className="rounded-md border border-emerald-200 bg-white/80 px-3 py-2 text-sm shadow-sm dark:border-emerald-900/60 dark:bg-background/40">
                {newHoliday.type}
              </div>
            </div>
          </div>

          <div className="gap-y-2">
            <Label>Holiday Title</Label>
            <div className="rounded-md border border-emerald-200 bg-white/80 px-3 py-2 text-sm shadow-sm dark:border-emerald-900/60 dark:bg-background/40">
              {newHoliday.title || "Holiday title"}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white/80 p-3 shadow-sm dark:border-emerald-900/60 dark:bg-background/40">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Holiday Preview</p>
            <div className="mt-2 gap-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{newHoliday.title || "Holiday title"}</span>
                <Badge variant="outline" className="rounded-full">{newHoliday.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {newHoliday.date ? formatDateInIST(newHoliday.date, { weekday: "long", year: "numeric", month: "long", day: "numeric" }, "en-US") : "No date selected yet"}
              </p>
            </div>
          </div>

          <Button onClick={addHoliday} disabled={!newHoliday.date || !newHoliday.title} className="h-10 w-full rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
            <Plus className="mr-2 size-4" />
            Save Holiday
          </Button>
        </CardContent>
      </Card>

      <Card className="gap-4 py-4 border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/20">
        <CardHeader className="px-4 sm:px-5">
          <CardTitle>Scheduled Holidays</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-5">
          <div className="gap-y-3">
            {holidayList.length > 0 ? (
              holidayList.map((holiday) => (
                <div key={holiday.id} className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-white/80 p-4 shadow-sm dark:border-amber-900/60 dark:bg-background/40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{holiday.title}</h3>
                    <p className="text-sm text-muted-foreground">{formatDateInIST(holiday.date, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full">{holiday.type}</Badge>
                    <Button variant="outline" size="sm" onClick={() => removeHoliday(holiday.id)} className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-amber-200 bg-white/70 px-4 py-8 text-center dark:border-amber-900/60 dark:bg-background/30">
                <CalendarDays className="mx-auto mb-3 size-10 text-amber-400" />
                <p className="font-medium text-foreground">No holidays scheduled</p>
                <p className="mt-1 text-sm text-muted-foreground">Add clinic closures or festival days here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConflictsTab({ scheduleConflicts }: Pick<ClinicAdminScheduleContentProps, "scheduleConflicts">) {
  return (
    <Card className="gap-4 py-4 border-rose-200 bg-rose-50/70 shadow-sm dark:border-rose-900/70 dark:bg-rose-950/20">
      <CardHeader className="px-4 sm:px-5">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="size-5 text-rose-600 dark:text-rose-300" />
          Schedule Conflicts
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-5">
        <div className="gap-y-4">
          {scheduleConflicts.length > 0 ? (
            scheduleConflicts.map((conflict) => (
              <div key={conflict.id} className="flex items-start gap-3 rounded-xl border border-rose-200 bg-white/80 p-4 shadow-sm dark:border-rose-900/60 dark:bg-background/40">
                <AlertCircle className="mt-0.5 size-5 text-rose-600 dark:text-rose-300" />
                <div className="flex-1">
                  <h3 className="font-semibold text-rose-900 dark:text-rose-100">{conflict.title}</h3>
                  <p className="text-sm text-rose-700 dark:text-rose-300">{conflict.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Update the doctor schedule and save to resolve.</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-white/80 px-4 py-8 text-center dark:border-emerald-900/60 dark:bg-background/40">
              <CheckCircle className="mx-auto mb-3 size-10 text-emerald-600 dark:text-emerald-300" />
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">All Clear</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">No schedule configuration conflicts detected.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClinicAdminScheduleContent({
  scheduleWritesSupported,
  updateSchedulePending,
  handleSaveSchedule,
  selectedDoctor,
  selectedDoctorStatus,
  localSchedules,
  holidayList,
  newHoliday,
  holidayDate,
  setHolidayDate,
  addHoliday,
  removeHoliday,
  updateSchedule,
  totalAvailableDays,
  totalWeeklySlots,
  selectedDoctorWeeklySlots,
  scheduleConflicts,
}: ClinicAdminScheduleContentProps) {
  const headerMeta = useMemo(
    () => (
      <>
        <Badge variant="secondary" className="rounded-full">{selectedDoctorStatus}</Badge>
        <Badge variant="outline" className="rounded-full">{localSchedules.length} doctors</Badge>
        <Badge variant="outline" className="rounded-full">{holidayList.length} holidays</Badge>
      </>
    ),
    [holidayList.length, localSchedules.length, selectedDoctorStatus]
  );

  return (
    <DashboardPageShell className="mx-auto max-w-7xl px-4 pb-6 pt-0 sm:px-6 lg:px-8">
      <DashboardPageHeader
        eyebrow="Clinic Admin"
        title="Schedule Management"
        description="Manage doctor availability, holiday closures, and scheduling conflicts from one place."
        meta={headerMeta}
        actionsSlot={
          <div className="flex flex-wrap items-center gap-2">
            <WebSocketStatusIndicator />
            <Button className="h-9 rounded-lg px-4 text-sm font-semibold" onClick={handleSaveSchedule} disabled={!scheduleWritesSupported || updateSchedulePending || !selectedDoctor}>
              {updateSchedulePending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        }
      />

      {!scheduleWritesSupported ? (
        <Card className="gap-4 py-4 border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 p-4 text-amber-900 dark:text-amber-100">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div className="text-sm">Clinic context is required to save doctor schedules.</div>
          </CardContent>
        </Card>
      ) : null}

      <ScheduleOverview
        selectedDoctorStatus={selectedDoctorStatus}
        localSchedules={localSchedules}
        holidayList={holidayList}
        totalAvailableDays={totalAvailableDays}
        totalWeeklySlots={totalWeeklySlots}
        scheduleConflicts={scheduleConflicts}
      />

      <Tabs defaultValue="doctor-schedules" className="gap-y-3">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-xl border border-border bg-card p-1 sm:grid-cols-3">
          <TabsTrigger value="doctor-schedules" className="flex h-10 items-center gap-2 rounded-lg">
            <Stethoscope className="size-4" />
            Doctor Schedules
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex h-10 items-center gap-2 rounded-lg">
            <CalendarDays className="size-4" />
            Holidays
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="flex h-10 items-center gap-2 rounded-lg">
            <AlertCircle className="size-4" />
            Conflicts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="doctor-schedules" className="gap-y-3">
          <DoctorSchedulesTab
            selectedDoctor={selectedDoctor}
            selectedDoctorWeeklySlots={selectedDoctorWeeklySlots}
            localSchedules={localSchedules}
            updateSchedule={updateSchedule}
          />
        </TabsContent>

        <TabsContent value="holidays" className="gap-y-3">
          <HolidayManagementTab
            holidayList={holidayList}
            newHoliday={newHoliday}
            holidayDate={holidayDate}
            setHolidayDate={setHolidayDate}
            addHoliday={addHoliday}
            removeHoliday={removeHoliday}
          />
        </TabsContent>

        <TabsContent value="conflicts" className="gap-y-3">
          <ConflictsTab scheduleConflicts={scheduleConflicts} />
        </TabsContent>
      </Tabs>
    </DashboardPageShell>
  );
}
