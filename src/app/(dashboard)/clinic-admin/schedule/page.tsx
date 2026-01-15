"use client";

import { useState, useMemo, useEffect } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
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
import { getRoutesByRole } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import {
  useDoctors,
  useDoctorSchedule,
  useUpdateDoctorSchedule,
} from "@/hooks/query/useDoctors";
import { WebSocketStatusIndicator } from "@/components/websocket/WebSocketErrorBoundary";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  Activity,
  Users,
  Calendar,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Save,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function ClinicAdminSchedule() {
  const { session } = useAuth();
  const user = session?.user;
  const { clinicId } = useClinicContext();

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
    useDoctorSchedule(selectedDoctorId || "", undefined);

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
          slotDuration: 30,
        },
        {
          day: "Tuesday",
          startTime: "09:00",
          endTime: "17:00",
          available: true,
          slotDuration: 30,
        },
        {
          day: "Wednesday",
          startTime: "09:00",
          endTime: "17:00",
          available: true,
          slotDuration: 30,
        },
        {
          day: "Thursday",
          startTime: "09:00",
          endTime: "17:00",
          available: true,
          slotDuration: 30,
        },
        {
          day: "Friday",
          startTime: "09:00",
          endTime: "17:00",
          available: true,
          slotDuration: 30,
        },
        {
          day: "Saturday",
          startTime: "09:00",
          endTime: "13:00",
          available: true,
          slotDuration: 30,
        },
        {
          day: "Sunday",
          startTime: "",
          endTime: "",
          available: false,
          slotDuration: 30,
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
    if (!selectedDoctor || !selectedDoctorId) {
      toast.error("Please select a doctor");
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

      await updateScheduleMutation.mutate({
        doctorId: selectedDoctorId,
        schedule: scheduleToSave,
      });

      toast.success("Schedule updated successfully");
    } catch (error) {
      toast.error("Failed to update schedule");
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

  const sidebarLinks = getRoutesByRole(Role.CLINIC_ADMIN).map((route: any) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("staff") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("schedule") ? (
      <Calendar className="w-5 h-5" />
    ) : route.path.includes("settings") ? (
      <Settings className="w-5 h-5" />
    ) : (
      <Activity className="w-5 h-5" />
    ),
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  if (isPendingDoctors) {
    return (
      <DashboardLayout
        title="Schedule Management"
        allowedRole={Role.CLINIC_ADMIN}
      >
        <Sidebar
          links={sidebarLinks}
          user={{
            name:
              user?.name ||
              `${user?.firstName} ${user?.lastName}` ||
              "Clinic Admin",
            avatarUrl: (user as any)?.profilePicture || "/avatar.png",
          }}
        >
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </Sidebar>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Schedule Management"
      allowedRole={Role.CLINIC_ADMIN}
    >
      <Sidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Clinic Admin",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Schedule Management</h1>
            <div className="flex items-center gap-4">
              <WebSocketStatusIndicator />
              <Button
                className="flex items-center gap-2"
                onClick={handleSaveSchedule}
                disabled={updateScheduleMutation.isPending || !selectedDoctor}
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

          <Tabs defaultValue="doctor-schedules" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
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
                <Card>
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
                <Card>
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
                                <Label className="text-xs text-gray-600">
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
                                <Label className="text-xs text-gray-600">
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
                                <Label className="text-xs text-gray-600">
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
                                    <SelectItem value="15">15 min</SelectItem>
                                    <SelectItem value="30">30 min</SelectItem>
                                    <SelectItem value="45">45 min</SelectItem>
                                    <SelectItem value="60">60 min</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="text-center">
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-800"
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
                                className="bg-gray-50 text-gray-600"
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
                <Card>
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
                          <Badge>30 min</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <span>Nadi Pariksha</span>
                          <Badge>45 min</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <span>Dosha Analysis</span>
                          <Badge>60 min</Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <span>Panchakarma Session</span>
                          <Badge>90 min</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <span>Shirodhara</span>
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
                <Card>
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
                        <Button onClick={addHoliday} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Holiday
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Holidays List */}
                <Card>
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
                            <p className="text-sm text-gray-600">
                              {new Date(holiday.date).toLocaleDateString(
                                "en-IN",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{holiday.type}</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeHoliday(holiday.id)}
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Schedule Conflicts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Mock conflicts */}
                      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-medium text-yellow-800">
                            Overlapping Appointments
                          </h3>
                          <p className="text-sm text-yellow-700">
                            Dr. Rajesh Kumar has overlapping appointments on
                            Monday at 2:00 PM
                          </p>
                          <p className="text-xs text-yellow-600 mt-1">
                            Detected 2 hours ago
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-yellow-700 border-yellow-300"
                        >
                          Resolve
                        </Button>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-medium text-red-800">
                            Doctor Unavailable
                          </h3>
                          <p className="text-sm text-red-700">
                            Dr. Priya Sharma scheduled during declared holiday
                            (Holi)
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Detected 1 day ago
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-700 border-red-300"
                        >
                          Resolve
                        </Button>
                      </div>

                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-800">
                          All Clear!
                        </h3>
                        <p className="text-green-700">
                          No additional conflicts detected
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Sidebar>
    </DashboardLayout>
  );
}
