"use client";

import { useState, useMemo, useEffect } from "react";
import { Role } from "@/types/auth.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import {
  useDoctors,
  useDoctorSchedule,
  useUpdateDoctorSchedule,
} from "@/hooks/query/useDoctors";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateInIST } from "@/lib/utils/date-time";
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  Loader2,
} from "lucide-react";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";

export default function ClinicAdminSchedule() {
  useAuth();
  const { clinicId } = useClinicContext();
  const scheduleWritesSupported = !!clinicId;

  // Fetch real doctors data
  const { data: doctorsData, isPending: isPendingDoctors } = useDoctors(
    clinicId || "",
    {}
  );

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  // Fetch schedule for selected doctor
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const { data: scheduleData } =
    useDoctorSchedule(clinicId || "", selectedDoctorId || "", undefined);

  // Update schedule mutation
  const updateScheduleMutation = useUpdateDoctorSchedule();

  // Transform doctors data to schedule format
  const doctors = useMemo(() => {
    if (!doctorsData) return [];
    return Array.isArray(doctorsData) ? doctorsData : (doctorsData as any).doctors || [];
  }, [doctorsData]);

  // Transform schedule data
  const doctorSchedules = useMemo(() => {
    if (!doctors.length) return [];

    return doctors.map((doctor: any) => {
      const doctorSchedule =
        scheduleData && selectedDoctorId === doctor.id ? scheduleData : null;
      const schedules =
        (doctorSchedule as any)?.schedules || (doctorSchedule as any)?.weeklySchedule || [];

      // Default schedule structure if none exists
      const defaultSchedule = [
        {
          day: "Monday",
          startTime: "09:00",
          endTime: "17:00",
          available: true,
          slotDuration: 3,
        },
        {
          day: "Tuesday",
          startTime: "09:00",
          endTime: "17:00",
          available: true,
          slotDuration: 3,
        },
        {
          day: "Wednesday",
          startTime: "09:00",
          endTime: "17:00",
          available: true,
          slotDuration: 3,
        },
        {
          day: "Thursday",
          startTime: "09:00",
          endTime: "17:00",
          available: true,
          slotDuration: 3,
        },
        {
          day: "Friday",
          startTime: "09:00",
          endTime: "17:00",
          available: true,
          slotDuration: 3,
        },
        {
          day: "Saturday",
          startTime: "09:00",
          endTime: "13:00",
          available: true,
          slotDuration: 3,
        },
        {
          day: "Sunday",
          startTime: "",
          endTime: "",
          available: false,
          slotDuration: 3,
        },
      ];

      return {
        id: doctor.id,
        doctorName:
          doctor.name ||
          `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim(),
        specialization:
          doctor.specialization || doctor.specializations?.[0] || "General",
        schedules: schedules.length > 0 ? schedules : defaultSchedule,
      };
    });
  }, [doctors, scheduleData, selectedDoctorId]);

  // Local state for editing schedules
  const [localSchedules, setLocalSchedules] = useState(doctorSchedules);

  // Update local schedules when doctorSchedules change
  useEffect(() => {
    setLocalSchedules(doctorSchedules);
  }, [doctorSchedules]);

  // Holiday data (can be fetched from API later)
  const [holidays, setHolidays] = useState<any[]>([]);

  const [selectedDoctor, setSelectedDoctor] = useState<any>(
    localSchedules[0] || null
  );

  // Update selected doctor when schedules change
  useEffect(() => {
    if (localSchedules.length > 0 && !selectedDoctor) {
      setSelectedDoctor(localSchedules[0]);
      setSelectedDoctorId(localSchedules[0]?.id || null);
    }
  }, [localSchedules, selectedDoctor]);
  const [newHoliday, setNewHoliday] = useState({
    date: "",
    title: "",
    type: "Public Holiday",
  });
  const scheduleConflicts = useMemo(() => {
    return localSchedules.flatMap((doctor: any) =>
      (doctor.schedules || []).flatMap((schedule: any) => {
        if (!schedule.available) return [];

        if (!schedule.startTime || !schedule.endTime) {
          return [
            {
              id: `${doctor.id}-${schedule.day}-missing-hours`,
              severity: "high" as const,
              title: "Missing Schedule Hours",
              message: `${doctor.doctorName} is marked available on ${schedule.day} but start or end time is missing.`,
            },
          ];
        }

        if (schedule.startTime >= schedule.endTime) {
          return [
            {
              id: `${doctor.id}-${schedule.day}-invalid-range`,
              severity: "high" as const,
              title: "Invalid Time Range",
              message: `${doctor.doctorName} has an invalid time range on ${schedule.day}. End time must be after start time.`,
            },
          ];
        }

        return [];
      })
    );
  }, [localSchedules]);

  const updateSchedule = (dayIndex: number, field: string, value: any) => {
    if (!selectedDoctor) return;

    const updatedSchedules = localSchedules.map((doctor: any) => {
      if (doctor.id === selectedDoctor.id) {
        const updatedDoctor = { ...doctor };
        const currentSchedule = updatedDoctor.schedules[dayIndex];
        if (!currentSchedule) return doctor;

        updatedDoctor.schedules[dayIndex] = {
          day: currentSchedule.day,
          startTime: currentSchedule.startTime,
          endTime: currentSchedule.endTime,
          available: currentSchedule.available,
          slotDuration: currentSchedule.slotDuration,
          [field]: value,
        };
        return updatedDoctor;
      }
      return doctor;
    });
    setLocalSchedules(updatedSchedules);
    setSelectedDoctor(
      updatedSchedules.find((d: any) => d.id === selectedDoctor.id)!
    );
  };

  const handleSaveSchedule = async () => {
    if (!scheduleWritesSupported) {
      showErrorToast("Schedule updates are not supported by the backend yet", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      return;
    }

    if (!selectedDoctor || !selectedDoctorId) {
      showErrorToast("Please select a doctor", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      return;
    }

    try {
      const scheduleToSave = selectedDoctor.schedules.map((sched: any) => ({
        dayOfWeek: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ].indexOf(sched.day),
        startTime: sched.startTime,
        endTime: sched.endTime,
        isAvailable: sched.available,
      }));

      await updateScheduleMutation.mutateAsync({
        doctorId: selectedDoctorId,
        schedule: scheduleToSave,
        ...(clinicId ? { clinicId } : {}),
      });

      showSuccessToast("Schedule updated successfully", {
        id: TOAST_IDS.GLOBAL.SUCCESS,
      });
    } catch (error) {
      showErrorToast("Failed to update schedule", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      console.error(error);
    }
  };

  const addHoliday = () => {
    if (newHoliday.date && newHoliday.title) {
      setHolidays([
        ...holidays,
        {
          id: Date.now().toString(),
          ...newHoliday,
        },
      ]);
      setNewHoliday({ date: "", title: "", type: "Public Holiday" });
    }
  };

  const removeHoliday = (id: string) => {
    setHolidays(holidays.filter((h: any) => h.id !== id));
  };

  if (isPendingDoctors) {
    return (
      
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
      
    );
  }

  return (
    
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Schedule Management</h1>
            <div className="flex items-center gap-4">
              <WebSocketStatusIndicator />
              <Button
                className="flex items-center gap-2"
                onClick={handleSaveSchedule}
                disabled={!scheduleWritesSupported || updateScheduleMutation.isPending || !selectedDoctor}
              >
                {updateScheduleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {!scheduleWritesSupported && (
          <Card className="border-amber-100 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20">
              <CardContent className="flex items-start gap-3 p-4 text-amber-900 dark:text-amber-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="text-sm">
                  Clinic context is required to save doctor schedules.
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="doctor-schedules" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
              <TabsTrigger
                value="doctor-schedules"
                className="flex items-center gap-2"
              >
                <Stethoscope className="w-4 h-4" />
                Doctor Schedules
              </TabsTrigger>
              <TabsTrigger value="holidays" className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Holidays
              </TabsTrigger>
              <TabsTrigger
                value="conflicts"
                className="flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Conflicts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="doctor-schedules">
              <div className="grid gap-6">
                {/* Doctor Selection */}
                <Card className="border-blue-100 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20">
                  <CardHeader>
                    <CardTitle>Select Doctor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={selectedDoctor?.id || ""}
                      onValueChange={(value) => {
                        const doctor = localSchedules.find(
                          (d: any) => d.id === value
                        );
                        setSelectedDoctor(doctor || null);
                        setSelectedDoctorId(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {localSchedules.map((doctor: any) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.doctorName} - {doctor.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Weekly Schedule */}
                <Card className="border-indigo-100 bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Weekly Schedule -{" "}
                      {selectedDoctor?.doctorName || "No Doctor Selected"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedDoctor?.schedules?.map((schedule: any, index: number) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4 border rounded-lg"
                        >
                          <div className="font-medium">{schedule.day}</div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={schedule.available}
                              onCheckedChange={(checked) =>
                                updateSchedule(index, "available", checked)
                              }
                            />
                            <Label className="text-sm">Available</Label>
                          </div>

                          {schedule.available && (
                            <>
                              <div>
                                <Label className="text-xs text-blue-700 dark:text-blue-200">
                                  Start Time
                                </Label>
                                <Input
                                  type="time"
                                  value={schedule.startTime}
                                  onChange={(e) =>
                                    updateSchedule(
                                      index,
                                      "startTime",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label className="text-xs text-blue-700 dark:text-blue-200">
                                  End Time
                                </Label>
                                <Input
                                  type="time"
                                  value={schedule.endTime}
                                  onChange={(e) =>
                                    updateSchedule(
                                      index,
                                      "endTime",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label className="text-xs text-blue-700 dark:text-blue-200">
                                  Slot Duration (min)
                                </Label>
                                <Select
                                  value={schedule.slotDuration.toString()}
                                  onValueChange={(value) =>
                                    updateSchedule(
                                      index,
                                      "slotDuration",
                                      parseInt(value)
                                    )
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="3">3 min (20/hr)</SelectItem>
                                    <SelectItem value="5">5 min (12/hr)</SelectItem>
                                    <SelectItem value="10">10 min (6/hr)</SelectItem>
                                    <SelectItem value="15">15 min (4/hr)</SelectItem>
                                    <SelectItem value="30">30 min (2/hr)</SelectItem>
                                    <SelectItem value="45">45 min</SelectItem>
                                    <SelectItem value="60">60 min</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="text-center">
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200"
                                >
                                  {Math.floor(
                                    (new Date(
                                      `2024-01-01 ${schedule.endTime}`
                                    ).getTime() -
                                      new Date(
                                        `2024-01-01 ${schedule.startTime}`
                                      ).getTime()) /
                                      (1000 * 60) /
                                      schedule.slotDuration
                                  )}{" "}
                                  slots
                                </Badge>
                              </div>
                            </>
                          )}

                          {!schedule.available && (
                            <div className="col-span-4 text-center">
                              <Badge
                                variant="outline"
                              className="bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-300"
                              >
                                Not Available
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Consultation Types & Duration */}
                <Card className="border-emerald-100 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20">
                  <CardHeader>
                    <CardTitle>
                      Consultation Types & Default Durations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <span>General Consultation</span>
                          <Badge>3 min</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <span>Nadi Pariksha</span>
                          <Badge>45 min</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <span>Diagnostic / Preventive Care</span>
                          <Badge>60 min</Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <span>Procedural Session</span>
                          <Badge>90 min</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <span>Procedural Care</span>
                          <Badge>60 min</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <span>Follow-up</span>
                          <Badge>15 min</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="holidays">
              <div className="grid gap-6">
                {/* Add New Holiday */}
                <Card className="border-amber-100 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20">
                  <CardHeader>
                    <CardTitle>Add New Holiday</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={newHoliday.date}
                          onChange={(e) =>
                            setNewHoliday({
                              ...newHoliday,
                              date: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Holiday Title</Label>
                        <Input
                          value={newHoliday.title}
                          onChange={(e) =>
                            setNewHoliday({
                              ...newHoliday,
                              title: e.target.value,
                            })
                          }
                          placeholder="e.g., Diwali"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={newHoliday.type}
                          onValueChange={(value) =>
                            setNewHoliday({ ...newHoliday, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Public Holiday">
                              Public Holiday
                            </SelectItem>
                            <SelectItem value="Festival">Festival</SelectItem>
                            <SelectItem value="Clinic Closure">
                              Clinic Closure
                            </SelectItem>
                            <SelectItem value="Staff Training">
                              Staff Training
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button onClick={addHoliday} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Holiday
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Holidays List */}
                <Card className="border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/20">
                  <CardHeader>
                    <CardTitle>Scheduled Holidays</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {holidays.map((holiday: any) => (
                        <div
                          key={holiday.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h3 className="font-medium">{holiday.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {formatDateInIST(holiday.date, {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{holiday.type}</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeHoliday(holiday.id)}
                              className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {holidays.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No holidays scheduled</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="conflicts">
              <div className="grid gap-6">
                <Card className="border-rose-100 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-300" />
                      Schedule Conflicts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {scheduleConflicts.length > 0 ? (
                        scheduleConflicts.map((conflict: {
                          id: string;
                          severity: "high";
                          title: string;
                          message: string;
                        }) => {
                          const isHighSeverity = conflict.severity === "high";
                          return (
                            <div
                              key={conflict.id}
                              className={`flex items-start gap-3 p-4 rounded-lg border ${
                                isHighSeverity
                                  ? "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900"
                                  : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                              }`}
                            >
                              <AlertCircle
                                className={`w-5 h-5 mt-0.5 ${
                                  isHighSeverity ? "text-rose-600 dark:text-rose-300" : "text-amber-600 dark:text-amber-300"
                                }`}
                              />
                              <div className="flex-1">
                                <h3
                                  className={`font-medium ${
                                    isHighSeverity ? "text-red-800" : "text-yellow-800"
                                  }`}
                                >
                                  {conflict.title}
                                </h3>
                                <p
                                  className={`text-sm ${
                                    isHighSeverity ? "text-red-700" : "text-yellow-700"
                                  }`}
                                >
                                  {conflict.message}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isHighSeverity ? "text-rose-600 dark:text-rose-300" : "text-amber-600 dark:text-amber-300"
                                  }`}
                                >
                                  Update the doctor schedule and save to resolve.
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-green-800">
                            All Clear!
                          </h3>
                          <p className="text-green-700">
                            No schedule configuration conflicts detected.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
    
  );
}
