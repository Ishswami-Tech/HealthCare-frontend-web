"use client";

import { useState, useMemo } from "react";
import { useComprehensiveHealthRecord } from "@/hooks/query/useMedicalRecords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useDoctorPatients } from "@/hooks/query/useDoctors";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { usePatientStore } from "@/stores";
import {
  Calendar,
  Users,
  Search,
  Eye,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Clock,
  TrendingUp,
  Pill,
} from "lucide-react";

export default function DoctorPatients() {
  const { session } = useAuth();
  const { clinicId } = useClinicContext();
  const doctorId = session?.user?.id || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const patients = usePatientStore((state) => state.collections.doctor);
  const drawerPatient = usePatientStore((state) => state.selectedPatient);
  const setSelectedPatient = usePatientStore((state) => state.setSelectedPatient);

  // Fetch real patient data
  const { isPending: isPendingPatients } = useDoctorPatients(
    clinicId || "",
    {
      search: searchTerm,
      ...(genderFilter !== "all" && { gender: genderFilter }),
    },
    {
      enabled: !!clinicId,
    }
  );
  const { data: appointmentsData } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(doctorId ? { doctorId } : {}),
    limit: 300,
  });

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();
  const patientsWithProfile = useMemo(() => {
    return patients.map((patient: any) => {
      const resolvedName =
        patient.name ||
        patient.user?.name ||
        `${patient.firstName || patient.user?.firstName || ""} ${patient.lastName || patient.user?.lastName || ""}`.trim() ||
        patient.email ||
        patient.user?.email ||
        "Unknown Patient";
      const dateOfBirth = patient.dateOfBirth || patient.user?.dateOfBirth;
      let age = patient.age;

      if (!age && dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        if (!Number.isNaN(birthDate.getTime())) {
          const today = new Date();
          const years = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          age =
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
              ? years - 1
              : years;
        }
      }

      return {
        ...patient,
        name: resolvedName,
        firstName: patient.firstName || patient.user?.firstName || "",
        lastName: patient.lastName || patient.user?.lastName || "",
        email: patient.email || patient.user?.email || "",
        phone: patient.phone || patient.user?.phone || "",
        gender: patient.gender || patient.user?.gender || "",
        dateOfBirth,
        age,
        address: patient.address || patient.user?.address || "",
      };
    });
  }, [patients]);
  const appointments = useMemo(() => {
    if (!appointmentsData) return [];
    return Array.isArray(appointmentsData)
      ? appointmentsData
      : (appointmentsData as any).appointments || [];
  }, [appointmentsData]);

  const filteredPatients = patientsWithProfile.filter((patient: any) => {
    const name = patient.name || `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "";
    const patientPhone = patient.phone || "";
    const patientEmail = patient.email || "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientPhone.includes(searchTerm) ||
      patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.chiefComplaints || []).some((complaint: string) =>
        String(complaint).toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesGender =
      genderFilter === "all" || String(patient.gender || "").toLowerCase() === genderFilter;
    const matchesAge =
      ageFilter === "all" ||
      (ageFilter === "young" && patient.age < 30) ||
      (ageFilter === "middle" && patient.age >= 30 && patient.age < 60) ||
      (ageFilter === "senior" && patient.age >= 60);

    return matchesSearch && matchesGender && matchesAge;
  });
  const stats = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const upcomingAppointments = appointments.filter((appointment: any) => {
      const dateValue = appointment.startTime || appointment.appointmentDate || (appointment.date && appointment.time ? `${appointment.date}T${appointment.time}` : appointment.date);
      const parsed = dateValue ? new Date(dateValue) : null;
      return (
        parsed &&
        !Number.isNaN(parsed.getTime()) &&
        parsed >= now &&
        parsed <= weekEnd &&
        ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(String(appointment.status || "").toUpperCase())
      );
    }).length;

    const followUps = appointments.filter((appointment: any) => {
      const followUpDate = appointment.followUpDate ? new Date(appointment.followUpDate) : null;
      return followUpDate && !Number.isNaN(followUpDate.getTime()) && followUpDate >= now && followUpDate <= weekEnd;
    }).length;

    const repeatPatients = appointments.reduce((acc: Map<string, number>, appointment: any) => {
      const patientId = String(appointment.patientId || "");
      if (!patientId) return acc;
      acc.set(patientId, (acc.get(patientId) || 0) + 1);
      return acc;
    }, new Map<string, number>());

    const improvedPatients = Array.from(repeatPatients.values() as Iterable<number>).filter((count) => count > 1).length;
    const recoveryRate = patientsWithProfile.length > 0
      ? Math.round((improvedPatients / patientsWithProfile.length) * 100)
      : 0;

    return {
      upcomingAppointments,
      followUps,
      recoveryRate,
    };
  }, [appointments, patientsWithProfile.length]);


  if (isPendingPatients) {
    return (
      
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
      
    );
  }

  return (
    
        <DashboardPageShell>
          <DashboardPageHeader
            eyebrow="Doctor Patients"
            title="My Patients"
            description="Review patient records, EHR summaries, contact details, and follow-up context from a shared clinical workspace."
            meta={
              <span className="text-sm font-medium text-muted-foreground">
                Total: {patientsWithProfile.length} patients
              </span>
            }
          />

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            <Card className="border-l-4 border-l-emerald-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Patients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientsWithProfile.length}</div>
                <p className="text-xs text-muted-foreground">Under your care</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.upcomingAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  Appointments scheduled
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Follow-ups
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.followUps}</div>
                <p className="text-xs text-muted-foreground">Due this week</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recovery Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.recoveryRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Patient improvement
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by name or condition..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ageFilter} onValueChange={setAgeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ages</SelectItem>
                    <SelectItem value="young">Under 30</SelectItem>
                    <SelectItem value="middle">30-60</SelectItem>
                    <SelectItem value="senior">Over 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Patients List */}
          <div className="grid gap-4">
            {filteredPatients.map((patient: any) => (
              <Card
                key={patient.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-800 font-semibold text-xl">
                          {(patient.name || patient.firstName || "?")[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {patient.name ||
                            `${patient.firstName || ""} ${
                              patient.lastName || ""
                            }`.trim() ||
                            "Unknown Patient"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {patient.age && (
                            <span>
                              {patient.age} years{" "}
                              {patient.gender ? `- ${patient.gender}` : ""}
                            </span>
                          )}
                          {patient.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {patient.phone}
                            </span>
                          )}
                          {patient.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {patient.email}
                            </span>
                          )}
                        </div>
                        {patient.address && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {patient.address}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-sm">
                        {patient.lastVisit && (
                          <div>
                            <strong>Last Visit:</strong>{" "}
                            {new Date(patient.lastVisit).toLocaleDateString()}
                          </div>
                        )}
                        {patient.nextAppointment && (
                          <div>
                            <strong>Next:</strong>{" "}
                            {new Date(
                              patient.nextAppointment
                            ).toLocaleDateString()}
                          </div>
                        )}
                        {patient.totalVisits !== undefined && (
                          <div>
                            <strong>Total Visits:</strong> {patient.totalVisits}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View EHR
                        </Button>

                        <Button size="sm" className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No patients found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria
                </p>
              </CardContent>
            </Card>
          )}

          {/* EHR Drawer */}
          <Drawer
            open={!!drawerPatient}
            onOpenChange={(open) => !open && setSelectedPatient(null)}
          >
            <DrawerContent className="max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
              {drawerPatient && (
                <EhrDrawerContent
                  patient={drawerPatient}
                />
              )}
            </DrawerContent>
          </Drawer>
        </DashboardPageShell>
    
  );
}

function EhrDrawerContent({
  patient,
}: {
  patient: any;
}) {
  const patientUserId = patient?.userId || patient?.user?.id;
  const { data: ehrData, isPending: isEhrLoading } =
    useComprehensiveHealthRecord(patientUserId || "") as { data: any; isPending: boolean };

  const patientName =
    patient?.name ||
    `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() ||
    patient?.user?.name ||
    `${patient?.user?.firstName || ""} ${patient?.user?.lastName || ""}`.trim() ||
    "Unknown Patient";

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{patientName} - Electronic Health Record</DrawerTitle>
      </DrawerHeader>
      <div className="px-6 pb-6">
        {isEhrLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Treatment History</TabsTrigger>
              <TabsTrigger value="reports">Lab Reports</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {patient?.age && (
                      <div>
                        <strong>Age:</strong> {patient.age} years
                      </div>
                    )}
                    {patient?.gender && (
                      <div>
                        <strong>Gender:</strong> {patient.gender}
                      </div>
                    )}
                    {(patient?.address || patient?.user?.address) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {typeof patient.address === "string"
                            ? patient.address
                            : patient?.address?.street
                              ? `${patient.address.street}, ${patient.address.city || ""}`
                              : patient?.user?.address || "—"}
                        </span>
                      </div>
                    )}
                    {patient?.totalVisits != null && (
                      <div>
                        <strong>Total Visits:</strong> {patient.totalVisits}
                      </div>
                    )}
                    {patient?.phone && (
                      <div>
                        <strong>Phone:</strong> {patient.phone}
                      </div>
                    )}
                    {(patient?.email || patient?.user?.email) && (
                      <div>
                        <strong>Email:</strong>{" "}
                        {patient.email || patient.user?.email}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medical Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {(patient?.bloodGroup || ehrData?.bloodGroup) && (
                        <div>
                          <strong>Blood Group:</strong>{" "}
                          {patient?.bloodGroup || ehrData?.bloodGroup}
                        </div>
                      )}
                      {((patient?.allergies?.length && patient.allergies) ||
                        (ehrData?.allergies?.length && ehrData.allergies)) && (
                        <div>
                          <strong>Allergies:</strong>{" "}
                          {Array.isArray(patient?.allergies)
                            ? patient.allergies.join(", ")
                            : Array.isArray(ehrData?.allergies)
                              ? ehrData.allergies.map((a: any) => a.allergen || a).join(", ")
                              : "—"}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                {(ehrData?.medicalHistory?.length && (
                  <div className="space-y-2">
                    {ehrData.medicalHistory.map((r: any, i: number) => (
                      <Card key={r.id || i}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between">
                            <span className="font-medium">{r.condition || r.diagnosis || "Record"}</span>
                            {r.date && (
                              <span className="text-sm text-gray-500">
                                {new Date(r.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {r.treatment && <p className="text-sm mt-1">{r.treatment}</p>}
                          {r.notes && <p className="text-sm text-gray-600">{r.notes}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )) || (
                  <p className="text-sm text-gray-600">
                    No treatment history on record.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="space-y-4">
                {(ehrData?.labReports?.length && (
                  <div className="space-y-2">
                    {ehrData.labReports.map((r: any, i: number) => (
                      <Card key={r.id || i}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between">
                            <span className="font-medium">{r.reportType || r.type || "Lab Report"}</span>
                            {r.date && (
                              <span className="text-sm text-gray-500">
                                {new Date(r.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {r.results && (
                            <p className="text-sm mt-1">{r.results}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )) || (
                  <p className="text-sm text-gray-600">No lab reports on record.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="medications">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pill className="w-5 h-5" />
                      Current Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(ehrData?.medications?.length && (
                        <div className="space-y-2">
                          {ehrData.medications.map((m: any, i: number) => (
                            <div key={m.id || i} className="flex justify-between text-sm">
                              <span>{m.medicineName || m.name || m.medication}</span>
                              {m.dosage && <span className="text-gray-500">{m.dosage}</span>}
                            </div>
                          ))}
                        </div>
                      )) ||
                        (ehrData?.prescriptions?.length && (
                          <div className="space-y-2">
                            {ehrData.prescriptions.map((p: any, i: number) => (
                              <div key={p.id || i} className="text-sm">
                                {p.medicines?.map?.((m: any, j: number) => (
                                  <div key={j} className="flex justify-between">
                                    <span>{m.medicineName || m.name}</span>
                                    {m.dosage && (
                                      <span className="text-gray-500">{m.dosage}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )) || (
                          <p className="text-sm text-gray-600">
                            No medications on record.
                          </p>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
