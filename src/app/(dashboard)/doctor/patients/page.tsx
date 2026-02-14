"use client";

import { useState, useMemo } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useComprehensiveHealthRecord } from "@/hooks/query/useMedicalRecords";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
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
import { getSidebarLinksByRole } from "@/lib/config/sidebarLinks";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePatients } from "@/hooks/query/usePatients";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
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
  const user = session?.user;
  const { clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [drawerPatient, setDrawerPatient] = useState<any>(null);

  // Fetch real patient data
  const { data: patientsData, isPending: isPendingPatients } = usePatients(
    clinicId || "",
    {
      search: searchTerm,
      ...(genderFilter !== "all" && { gender: genderFilter }),
    }
  );

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  // Extract patients array from response
  const patients = useMemo(() => {
    if (!patientsData) return [];
    return Array.isArray(patientsData)
      ? patientsData
      : (patientsData as any).patients || [];
  }, [patientsData]);

  const filteredPatients = patients.filter((patient: any) => {
    const name = patient.name || `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.chiefComplaints || []).some((complaint: string) =>
        String(complaint).toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesGender =
      genderFilter === "all" || patient.gender.toLowerCase() === genderFilter;
    const matchesAge =
      ageFilter === "all" ||
      (ageFilter === "young" && patient.age < 30) ||
      (ageFilter === "middle" && patient.age >= 30 && patient.age < 60) ||
      (ageFilter === "senior" && patient.age >= 60);

    return matchesSearch && matchesGender && matchesAge;
  });

  const sidebarLinks = getSidebarLinksByRole(Role.DOCTOR);

  if (isPendingPatients) {
    return (
      <DashboardLayout title="Doctor Patients" allowedRole={[Role.DOCTOR, Role.ASSISTANT_DOCTOR]}>
        <Sidebar
          links={sidebarLinks}
          user={{
            name:
              user?.name || `${user?.firstName} ${user?.lastName}` || "Doctor",
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
    <DashboardLayout title="Doctor Patients" allowedRole={[Role.DOCTOR, Role.ASSISTANT_DOCTOR]}>
      <Sidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name || `${user?.firstName} ${user?.lastName}` || "Doctor",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Patients</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Total: {patients.length} patients
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Patients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients.length}</div>
                <p className="text-xs text-muted-foreground">Under your care</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">12</div>
                <p className="text-xs text-muted-foreground">
                  Appointments scheduled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Follow-ups
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">5</div>
                <p className="text-xs text-muted-foreground">Due this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recovery Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">92%</div>
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
                              {patient.gender ? `• ${patient.gender}` : ""}
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
                          onClick={() => setDrawerPatient(patient)}
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
            onOpenChange={(open) => !open && setDrawerPatient(null)}
          >
            <DrawerContent className="max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
              {drawerPatient && (
                <EhrDrawerContent
                  patient={drawerPatient}
                />
              )}
            </DrawerContent>
          </Drawer>
        </div>
      </Sidebar>
    </DashboardLayout>
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
    `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() ||
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
