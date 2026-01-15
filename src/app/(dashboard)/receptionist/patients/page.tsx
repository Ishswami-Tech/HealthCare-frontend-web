"use client";

import { useState, useMemo } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getRoutesByRole } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePatients, useCreatePatient } from "@/hooks/query/usePatients";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  Activity,
  Calendar,
  Users,
  UserCheck,
  LogOut,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit,
  Eye,
  UserPlus,
  Loader2,
  AlertCircle,
  Heart,
} from "lucide-react";
import { toast } from "sonner";

export default function ReceptionistPatients() {
  const { session } = useAuth();
  const user = session?.user;
  const { clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // New patient form state
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "" as any,
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
    allergies: "",
    currentMedications: "",
  });

  // Fetch real patient data
  const { data: patientsData } = usePatients(
    clinicId || "",
    {
      ...(statusFilter !== "all" && { isActive: statusFilter === "active" }),
    }
  );

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  // Create patient mutation
  const createPatientMutation = useCreatePatient();

  // Extract patients array from response
  const patients = useMemo(() => {
    if (!patientsData) return [];
    return Array.isArray(patientsData)
      ? patientsData
      : (patientsData as any).patients || [];
  }, [patientsData]);

  // Calculate age from dateOfBirth if needed
  const patientsWithAge = useMemo(() => {
    return patients.map((patient: any) => {
      if (!patient.age && patient.dateOfBirth) {
        const birthDate = new Date(patient.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        return {
          ...patient,
          age:
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
              ? age - 1
              : age,
          name:
            patient.name ||
            `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
        };
      }
      return {
        ...patient,
        name:
          patient.name ||
          `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
      };
    });
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patientsWithAge.filter((patient: any) => {
      const matchesSearch =
        !searchTerm ||
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const patientStatus = patient.isActive ? "active" : "inactive";
      const matchesStatus =
        statusFilter === "all" || patientStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patientsWithAge, searchTerm, statusFilter]);

  const handleNewPatientSubmit = async () => {
    if (!clinicId) {
      toast.error("Clinic ID is required");
      return;
    }

    try {
      await createPatientMutation.mutate({
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        phone: newPatient.phone,
        email: newPatient.email,
        dateOfBirth: newPatient.dateOfBirth,
        gender: newPatient.gender as any,
        address: newPatient.address,
        emergencyContact: {
          name: newPatient.emergencyContact,
          relationship: "", // Default or add field
          phone: newPatient.emergencyPhone,
        },
        medicalHistory: newPatient.medicalHistory ? [newPatient.medicalHistory] : [],
        allergies: newPatient.allergies ? newPatient.allergies.split(",").map(s => s.trim()) : [],
        currentMedications: newPatient.currentMedications,
      } as any);

      toast.success("Patient created successfully");
      setShowNewPatientDialog(false);
      // Reset form
      setNewPatient({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        dateOfBirth: "",
        gender: "" as any,
        address: "",
        emergencyContact: "",
        emergencyPhone: "",
        medicalHistory: "",
        allergies: "",
        currentMedications: "",
      });
    } catch (error) {
      toast.error("Failed to create patient");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };



  const sidebarLinks = getRoutesByRole(Role.RECEPTIONIST).map((route: any) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("appointments") ? (
      <Calendar className="w-5 h-5" />
    ) : route.path.includes("patients") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("profile") ? (
      <UserCheck className="w-5 h-5" />
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

  return (
    <DashboardLayout title="Patient Management" allowedRole={Role.RECEPTIONIST}>
      <Sidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Receptionist",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Patient Management</h1>
            <Dialog
              open={showNewPatientDialog}
              onOpenChange={setShowNewPatientDialog}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Patient</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newPatient.firstName}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            firstName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newPatient.lastName}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            lastName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={newPatient.phone}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            phone: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newPatient.email}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newPatient.dateOfBirth}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            dateOfBirth: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={newPatient.gender}
                        onValueChange={(value) =>
                          setNewPatient({ ...newPatient, gender: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={newPatient.address}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          address: e.target.value,
                        })
                      }
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContact">
                        Emergency Contact
                      </Label>
                      <Input
                        id="emergencyContact"
                        value={newPatient.emergencyContact}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            emergencyContact: e.target.value,
                          })
                        }
                        placeholder="Name (Relationship)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                      <Input
                        id="emergencyPhone"
                        value={newPatient.emergencyPhone}
                        onChange={(e) =>
                          setNewPatient({
                            ...newPatient,
                            emergencyPhone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="medicalHistory">Medical History</Label>
                    <Textarea
                      id="medicalHistory"
                      value={newPatient.medicalHistory}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          medicalHistory: e.target.value,
                        })
                      }
                      placeholder="Any existing medical conditions..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies">Known Allergies</Label>
                    <Input
                      id="allergies"
                      value={newPatient.allergies}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          allergies: e.target.value,
                        })
                      }
                      placeholder="Food, drug, or other allergies..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentMedications">
                      Current Medications
                    </Label>
                    <Textarea
                      id="currentMedications"
                      value={newPatient.currentMedications}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          currentMedications: e.target.value,
                        })
                      }
                      placeholder="List current medications with dosage..."
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewPatientDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleNewPatientSubmit}
                      disabled={createPatientMutation.isPending}
                    >
                      {createPatientMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Register Patient"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                <p className="text-xs text-muted-foreground">Registered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Patients
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {patients.filter((p: any) => p.isActive !== false).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  New This Month
                </CardTitle>
                <UserPlus className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {
                    patients.filter((p: any) => {
                      if (!p.createdAt) return false;
                      const created = new Date(p.createdAt);
                      const now = new Date();
                      return (
                        created.getMonth() === now.getMonth() &&
                        created.getFullYear() === now.getFullYear()
                      );
                    }).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">Registrations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inactive Patients
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {patients.filter((p: any) => p.isActive === false).length}
                </div>
                <p className="text-xs text-muted-foreground">Inactive</p>
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
                    placeholder="Search by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-800 font-semibold text-xl">
                          {patient.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {patient.name || "Unknown Patient"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
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
                          {patient.age && (
                            <span>
                              {patient.age} years{" "}
                              {patient.gender ? `• ${patient.gender}` : ""}
                            </span>
                          )}
                        </div>
                        {patient.address && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{patient.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            className={getStatusColor(
                              patient.isActive !== false ? "Active" : "Inactive"
                            )}
                          >
                            {patient.isActive !== false ? "Active" : "Inactive"}
                          </Badge>
                          {patient.totalVisits !== undefined && (
                            <Badge variant="outline">
                              {patient.totalVisits} visits
                            </Badge>
                          )}
                        </div>
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
                        {patient.createdAt && (
                          <div>
                            <strong>Registered:</strong>{" "}
                            {new Date(patient.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPatient(patient)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Patient Details: {selectedPatient?.name}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedPatient && (
                              <div className="space-y-6">
                                {/* Personal Information */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">
                                      Personal Information
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <strong>Full Name:</strong>{" "}
                                      {selectedPatient.name ||
                                        `${selectedPatient.firstName || ""} ${
                                          selectedPatient.lastName || ""
                                        }`.trim()}
                                    </div>
                                    {selectedPatient.age && (
                                      <div>
                                        <strong>Age:</strong>{" "}
                                        {selectedPatient.age} years
                                      </div>
                                    )}
                                    {selectedPatient.gender && (
                                      <div>
                                        <strong>Gender:</strong>{" "}
                                        {selectedPatient.gender}
                                      </div>
                                    )}
                                    {selectedPatient.phone && (
                                      <div>
                                        <strong>Phone:</strong>{" "}
                                        {selectedPatient.phone}
                                      </div>
                                    )}
                                    {selectedPatient.email && (
                                      <div>
                                        <strong>Email:</strong>{" "}
                                        {selectedPatient.email}
                                      </div>
                                    )}
                                    {selectedPatient.createdAt && (
                                      <div>
                                        <strong>Registration:</strong>{" "}
                                        {new Date(
                                          selectedPatient.createdAt
                                        ).toLocaleDateString()}
                                      </div>
                                    )}
                                    {selectedPatient.address && (
                                      <div className="col-span-2">
                                        <strong>Address:</strong>{" "}
                                        {selectedPatient.address}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>

                                {/* Medical Information */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <Heart className="w-5 h-5" />
                                      Medical Information
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {selectedPatient.bloodGroup && (
                                      <div>
                                        <strong>Blood Group:</strong>{" "}
                                        {selectedPatient.bloodGroup}
                                      </div>
                                    )}
                                    {selectedPatient.allergies && (
                                      <div>
                                        <strong>Allergies:</strong>
                                        <div className="mt-1 space-y-1">
                                          {Array.isArray(
                                            selectedPatient.allergies
                                          ) ? (
                                            selectedPatient.allergies.map(
                                              (
                                                allergy: string,
                                                index: number
                                              ) => (
                                                <div
                                                  key={index}
                                                  className="flex items-center gap-2"
                                                >
                                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                                  <span className="text-sm">
                                                    {allergy}
                                                  </span>
                                                </div>
                                              )
                                            )
                                          ) : (
                                            <span className="text-sm ml-2">
                                              {selectedPatient.allergies}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>

                                {/* Status Information */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">
                                      Status Information
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <strong>Status:</strong>
                                      <Badge
                                        className={getStatusColor(
                                          selectedPatient.isActive !== false
                                            ? "Active"
                                            : "Inactive"
                                        )}
                                        variant="outline"
                                      >
                                        {selectedPatient.isActive !== false
                                          ? "Active"
                                          : "Inactive"}
                                      </Badge>
                                    </div>
                                    {selectedPatient.totalVisits !==
                                      undefined && (
                                      <div>
                                        <strong>Total Visits:</strong>{" "}
                                        {selectedPatient.totalVisits}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>

                        <Button size="sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          Book
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
        </div>
      </Sidebar>
    </DashboardLayout>
  );
}
