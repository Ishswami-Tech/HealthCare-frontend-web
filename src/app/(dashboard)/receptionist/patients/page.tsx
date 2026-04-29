"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Role } from "@/types/auth.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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

import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePatients, useQuickRegisterPatient } from "@/hooks/query/usePatients";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { usePatientStore } from "@/stores";
import { formatDateInIST } from "@/lib/utils/date-time";
import {
  Calendar,
  Users,
  Search,
  Eye,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Plus,
  UserPlus,
  AlertCircle,
  Heart,
  UserCheck,
  ClipboardList,
  Shield,
  Activity,
  ArrowRight,
  User,
} from "lucide-react";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";

interface PatientTableRow {
  id: string;
  patient: any;
  name: string;
  address: string;
  phone: string;
  email: string;
  ageLabel: string;
  genderLabel: string;
  statusLabel: string;
  visitsLabel: string;
  registeredLabel: string;
  lastVisitLabel: string;
  nextAppointmentLabel: string;
}

function createTemporaryPatientPassword(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-4) || "1234";
  return `Temp@${digits}Aa`;
}

function normalizePatientGender(
  gender: string
): "MALE" | "FEMALE" | "OTHER" | undefined {
  const normalized = gender.trim().toUpperCase();
  if (normalized === "MALE" || normalized === "FEMALE" || normalized === "OTHER") {
    return normalized;
  }
  return undefined;
}

export default function ReceptionistPatients() {
  useAuth();
  const { clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("registered-desc");
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const patients = usePatientStore((state) => state.collections.clinic);
  const selectedPatient = usePatientStore((state) => state.selectedPatient);
  const setSelectedPatient = usePatientStore((state) => state.setSelectedPatient);

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
  usePatients(
    clinicId || "",
    {
      ...(statusFilter !== "all" && { isActive: statusFilter === "active" }),
    }
  );

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  // Create patient mutation
  const quickRegisterPatientMutation = useQuickRegisterPatient();

  // Calculate age from dateOfBirth if needed
  const patientsWithAge = useMemo(() => {
    return patients.map((patient: any) => {
      const resolvedName =
        patient.name ||
        patient.user?.name ||
        `${patient.firstName || patient.user?.firstName || ""} ${patient.lastName || patient.user?.lastName || ""}`.trim() ||
        patient.email ||
        "Unknown Patient";
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
          name: resolvedName,
        };
      }
      return {
        ...patient,
        name: resolvedName,
      };
    });
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const base = patientsWithAge.filter((patient: any) => {
      const patientPhone = patient.phone || patient.user?.phone || "";
      const patientEmail = patient.email || patient.user?.email || "";
      const patientGender = String(patient.gender || "").toUpperCase();
      const matchesSearch =
        !searchTerm ||
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patientPhone.includes(searchTerm) ||
        patientEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const patientStatus = patient.isActive ? "active" : "inactive";
      const matchesStatus =
        statusFilter === "all" || patientStatus === statusFilter;
      const matchesGender = genderFilter === "all" || patientGender === genderFilter;

      return matchesSearch && matchesStatus && matchesGender;
    });

    return [...base].sort((left: any, right: any) => {
      if (sortFilter === "name-asc") {
        return String(left.name || "").localeCompare(String(right.name || ""));
      }
      if (sortFilter === "name-desc") {
        return String(right.name || "").localeCompare(String(left.name || ""));
      }
      if (sortFilter === "visits-desc") {
        return Number(right.totalVisits || 0) - Number(left.totalVisits || 0);
      }
      const leftCreatedAt = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightCreatedAt = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      if (sortFilter === "registered-asc") {
        return leftCreatedAt - rightCreatedAt;
      }
      return rightCreatedAt - leftCreatedAt;
    });
  }, [patientsWithAge, searchTerm, statusFilter, genderFilter, sortFilter]);

  const patientTableRows = useMemo<PatientTableRow[]>(
    () =>
      filteredPatients.map((patient: any) => ({
        id: patient.id,
        patient,
        name: patient.name || "Unknown Patient",
        address: patient.address || "Address not available",
        phone: patient.phone || patient.user?.phone || "N/A",
        email: patient.email || patient.user?.email || "N/A",
        ageLabel: patient.age ? `${patient.age} years` : "Age N/A",
        genderLabel: patient.gender || "Gender N/A",
        statusLabel: patient.isActive !== false ? "Active" : "Inactive",
        visitsLabel:
          patient.totalVisits !== undefined ? String(patient.totalVisits) : "N/A",
        registeredLabel: patient.createdAt
          ? formatDateInIST(patient.createdAt)
          : "N/A",
        lastVisitLabel: patient.lastVisit
          ? formatDateInIST(patient.lastVisit)
          : "N/A",
        nextAppointmentLabel: patient.nextAppointment
          ? formatDateInIST(patient.nextAppointment)
          : "N/A",
      })),
    [filteredPatients]
  );

  const patientColumns = useMemo<ColumnDef<PatientTableRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Patient",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-green-100 dark:from-blue-950/50 dark:to-emerald-950/50">
              <span className="font-semibold text-blue-800 dark:text-blue-200">
                {row.original.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold">{row.original.name}</div>
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {row.original.address}
              </div>
            </div>
          </div>
        ),
      },
      { accessorKey: "phone", header: "Phone" },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <div className="break-all text-sm">{row.original.email}</div>,
      },
      {
        accessorKey: "ageLabel",
        header: "Profile",
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{row.original.ageLabel}</div>
            <div className="mt-1 text-xs text-muted-foreground">{row.original.genderLabel}</div>
          </div>
        ),
      },
      {
        accessorKey: "statusLabel",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={getStatusColor(row.original.statusLabel)}>{row.original.statusLabel}</Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPatient(row.original.patient)}
            >
              <Eye className="mr-1 h-4 w-4" />
              View
            </Button>
            <Button asChild size="sm">
              <Link href="/receptionist/appointments#appointment-manager">
                <Calendar className="mr-1 h-4 w-4" />
                Book
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [clinicId]
  );

  const handleNewPatientSubmit = async () => {
    if (!clinicId) {
      showErrorToast("Clinic ID is required", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      return;
    }

    const trimmedFirstName = newPatient.firstName.trim();
    const trimmedLastName = newPatient.lastName.trim();
    const trimmedPhone = newPatient.phone.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedPhone) {
      showErrorToast("First name, last name, and phone number are required", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      return;
    }

    try {
      const gender = normalizePatientGender(newPatient.gender);
      const allergies = newPatient.allergies
        ? newPatient.allergies
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : [];
      const medicalHistory = [
        newPatient.medicalHistory.trim(),
        newPatient.currentMedications.trim()
          ? `Current medications: ${newPatient.currentMedications.trim()}`
          : "",
      ].filter(Boolean);
      const temporaryPassword = createTemporaryPatientPassword(newPatient.phone);
      const emergencyContact =
        newPatient.emergencyContact.trim() && newPatient.emergencyPhone.trim()
          ? {
              name: newPatient.emergencyContact.trim(),
              relationship: "Emergency Contact",
              phone: newPatient.emergencyPhone.trim(),
            }
          : undefined;
      const email = newPatient.email.trim();
      const quickRegisterResult = await quickRegisterPatientMutation.mutateAsync({
        ...(email ? { email } : {}),
        password: temporaryPassword,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        phone: trimmedPhone,
        ...(gender ? { gender } : {}),
        ...(newPatient.dateOfBirth ? { dateOfBirth: newPatient.dateOfBirth } : {}),
        ...(newPatient.address.trim() ? { address: newPatient.address.trim() } : {}),
        ...(medicalHistory.length > 0 ? { medicalHistory } : {}),
        ...(emergencyContact ? { emergencyContact } : {}),
      });

      const userId =
        (quickRegisterResult as any)?.user?.id ||
        (quickRegisterResult as any)?.userId ||
        (quickRegisterResult as any)?.id;
      if (!userId) {
        throw new Error("Quick registration completed without a usable patient ID");
      }

      showSuccessToast(
        `Patient created successfully. Temporary password: ${temporaryPassword}`,
        {
          id: TOAST_IDS.GLOBAL.SUCCESS,
        }
      );
      setShowNewPatientDialog(false);
      setSelectedPatient(null);
      setSearchTerm("");
      setStatusFilter("all");
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
      showErrorToast(
        error instanceof Error ? error.message : "Failed to create patient",
        {
          id: TOAST_IDS.GLOBAL.ERROR,
        }
      );
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };



  return (
    
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
              <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-hidden border border-slate-200/50 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl dark:border-slate-800/60 sm:w-full sm:rounded-[24px]">
                <DialogHeader className="shrink-0 border-b border-slate-200/50 bg-background/70 p-5 pb-4 backdrop-blur-md dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold leading-tight text-foreground">Register New Patient</DialogTitle>
                      <p className="text-sm font-medium text-muted-foreground">Complete the form below to create a new medical record</p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-5 pt-3">
                  <div className="space-y-4">
                    {/* Identity & Contact Section */}
                    <section className="group/section rounded-xl border border-slate-100 bg-card/60 p-3.5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover/section:bg-emerald-100 transition-colors">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2.5">
                        <div className="space-y-1">
                          <Label htmlFor="firstName" className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            First Name <span className="text-emerald-500">*</span>
                          </Label>
                          <Input
                            id="firstName"
                            placeholder="e.g. John"
                            className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                            value={newPatient.firstName}
                            onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="lastName" className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            Last Name <span className="text-emerald-500">*</span>
                          </Label>
                          <Input
                            id="lastName"
                            placeholder="e.g. Doe"
                            className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                            value={newPatient.lastName}
                            onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="phone" className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            Phone Number <span className="text-emerald-500">*</span>
                          </Label>
                          <div className="relative group/input">
                            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
                            <Input
                              id="phone"
                              placeholder="+1 (555) 000-0000"
                              className="pl-8 bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                              value={newPatient.phone}
                              onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="email" className="text-[11px] font-semibold text-slate-700">Email Address</Label>
                          <div className="relative group/input">
                            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="john.doe@example.com"
                              className="pl-8 bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                              value={newPatient.email}
                              onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="dateOfBirth" className="text-[11px] font-semibold text-slate-700">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                            value={newPatient.dateOfBirth}
                            onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="gender" className="text-[11px] font-semibold text-slate-700">Gender</Label>
                          <Select
                            value={newPatient.gender}
                            onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}
                          >
                            <SelectTrigger className="bg-white/80 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                              <SelectItem value="Male" className="focus:bg-emerald-50 focus:text-emerald-700">Male</SelectItem>
                              <SelectItem value="Female" className="focus:bg-emerald-50 focus:text-emerald-700">Female</SelectItem>
                              <SelectItem value="Other" className="focus:bg-emerald-50 focus:text-emerald-700">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>

                    {/* Address Section */}
                    <section className="group/section rounded-xl border border-slate-100 bg-card/60 p-3.5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg group-hover/section:bg-sky-100 transition-colors">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Location</h3>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="address" className="text-[11px] font-semibold text-slate-700">Full Home Address</Label>
                        <Textarea
                          id="address"
                          placeholder="Street, City, State, ZIP..."
                          className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all rounded-lg min-h-[50px] p-2.5 resize-none text-[13px]"
                          value={newPatient.address}
                          onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                        />
                      </div>
                    </section>

                    {/* Emergency Contact Section */}
                    <section className="group/section rounded-xl border border-slate-100 bg-card/60 p-3.5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg group-hover/section:bg-rose-100 transition-colors">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2.5">
                        <div className="space-y-1">
                          <Label htmlFor="emergencyContact" className="text-[11px] font-semibold text-slate-700">Contact Name</Label>
                          <Input
                            id="emergencyContact"
                            placeholder="Name (Relationship)"
                            className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all rounded-lg h-8 text-[13px]"
                            value={newPatient.emergencyContact}
                            onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="emergencyPhone" className="text-[11px] font-semibold text-slate-700">Contact Phone</Label>
                          <Input
                            id="emergencyPhone"
                            placeholder="+1 (555) 000-0000"
                            className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all rounded-lg h-8 text-[13px]"
                            value={newPatient.emergencyPhone}
                            onChange={(e) => setNewPatient({ ...newPatient, emergencyPhone: e.target.value })}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Medical Profile Section */}
                    <section className="group/section rounded-xl border border-slate-100 bg-card/60 p-3.5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover/section:bg-amber-100 transition-colors">
                          <ClipboardList className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Medical profile</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="medicalHistory" className="text-[11px] font-semibold text-slate-700">Past Observations / History</Label>
                          <Textarea
                            id="medicalHistory"
                            placeholder="Document any known conditions, allergies, or past surgeries..."
                            className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all rounded-lg min-h-[50px] p-2.5 resize-none text-[13px]"
                            value={newPatient.medicalHistory}
                            onChange={(e) => setNewPatient({ ...newPatient, medicalHistory: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="allergies" className="text-[11px] font-semibold text-slate-700">Known Allergies</Label>
                          <Input
                            id="allergies"
                            placeholder="Food, drug, or other allergies..."
                            className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                            value={newPatient.allergies}
                            onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="currentMedications" className="text-[11px] font-semibold text-slate-700">Current Medications</Label>
                          <Textarea
                            id="currentMedications"
                            placeholder="List current medications with dosage..."
                            className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg min-h-[50px] p-2.5 resize-none text-[13px]"
                            value={newPatient.currentMedications}
                            onChange={(e) => setNewPatient({ ...newPatient, currentMedications: e.target.value })}
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-200/50 bg-background/80 p-4 backdrop-blur-md dark:border-slate-800/60">
                  <div className="text-[10px] font-medium text-muted-foreground">
                    <span className="text-emerald-500">*</span> Required
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewPatientDialog(false)}
                      className="h-9 rounded-lg text-slate-600 hover:bg-slate-100/50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleNewPatientSubmit}
                      disabled={quickRegisterPatientMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 px-6 rounded-lg h-9 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                      {quickRegisterPatientMutation.isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          Create Profile
                          <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-60" />
                        </>
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortFilter} onValueChange={setSortFilter}>
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registered-desc">Newest registered</SelectItem>
                    <SelectItem value="registered-asc">Oldest registered</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="visits-desc">Most visits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Showing {filteredPatients.length} of {patientsWithAge.length} patients
              </div>
            </CardContent>
          </Card>

          {/* Patients List */}
          <Card>
            <CardContent className="p-4">
              <DataTable
                columns={patientColumns}
                data={patientTableRows}
                emptyMessage="No patients found"
                pageSize={12}
              />
            </CardContent>
          </Card>

          <div className="hidden grid gap-4">
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
                            {formatDateInIST(patient.lastVisit)}
                          </div>
                        )}
                        {patient.nextAppointment && (
                          <div>
                            <strong>Next:</strong>{" "}
                            {formatDateInIST(patient.nextAppointment)}
                          </div>
                        )}
                        {patient.createdAt && (
                          <div>
                            <strong>Registered:</strong>{" "}
                            {formatDateInIST(patient.createdAt)}
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
                                      {(selectedPatient.phone || selectedPatient.user?.phone) && (
                                        <div>
                                          <strong>Phone:</strong>{" "}
                                          {selectedPatient.phone || selectedPatient.user?.phone}
                                        </div>
                                      )}
                                      {(selectedPatient.email || selectedPatient.user?.email) && (
                                        <div>
                                          <strong>Email:</strong>{" "}
                                          {selectedPatient.email || selectedPatient.user?.email}
                                        </div>
                                      )}
                                    {selectedPatient.createdAt && (
                                      <div>
                                        <strong>Registration:</strong>{" "}
                                        {formatDateInIST(selectedPatient.createdAt)}
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

                        <Button asChild size="sm">
                          <Link href="/receptionist/appointments#appointment-manager">
                            <Calendar className="w-4 h-4 mr-1" />
                            Book
                          </Link>
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
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No patients found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria
                </p>
              </CardContent>
            </Card>
          )}

          <Dialog
            open={!!selectedPatient}
            onOpenChange={(open) => {
              if (!open) setSelectedPatient(null);
            }}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Patient Details: {selectedPatient?.name}
                </DialogTitle>
              </DialogHeader>
              {selectedPatient && (
                <div className="space-y-6">
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
                      <div>
                        <strong>Phone:</strong> {selectedPatient.phone || selectedPatient.user?.phone || "N/A"}
                      </div>
                      <div>
                        <strong>Email:</strong> {selectedPatient.email || selectedPatient.user?.email || "N/A"}
                      </div>
                      <div>
                        <strong>Age:</strong>{" "}
                        {selectedPatient.age ? `${selectedPatient.age} years` : "N/A"}
                      </div>
                      <div>
                        <strong>Gender:</strong> {selectedPatient.gender || "N/A"}
                      </div>
                      <div>
                        <strong>Registration:</strong>{" "}
                        {selectedPatient.createdAt
                          ? formatDateInIST(selectedPatient.createdAt)
                          : "N/A"}
                      </div>
                      <div className="md:col-span-2">
                        <strong>Address:</strong> {selectedPatient.address || "N/A"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Heart className="w-5 h-5" />
                        Medical Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div>
                        <strong>Blood Group:</strong> {selectedPatient.bloodGroup || "N/A"}
                      </div>
                      <div>
                        <strong>Allergies:</strong>{" "}
                        {Array.isArray(selectedPatient.allergies)
                          ? selectedPatient.allergies.join(", ")
                          : selectedPatient.allergies || "N/A"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Status Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Status:</strong>{" "}
                        <Badge
                          className={getStatusColor(
                            selectedPatient.isActive !== false ? "Active" : "Inactive"
                          )}
                          variant="outline"
                        >
                          {selectedPatient.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div>
                        <strong>Total Visits:</strong>{" "}
                        {selectedPatient.totalVisits !== undefined
                          ? selectedPatient.totalVisits
                          : "N/A"}
                      </div>
                      <div>
                        <strong>Registered:</strong>{" "}
                        {selectedPatient.createdAt
                          ? formatDateInIST(selectedPatient.createdAt, { day: "2-digit", month: "short", year: "numeric" })
                          : "N/A"}
                      </div>
                      <div>
                        <strong>Last Visit:</strong>{" "}
                        {selectedPatient.lastVisit
                          ? formatDateInIST(selectedPatient.lastVisit, { day: "2-digit", month: "short", year: "numeric" })
                          : "N/A"}
                      </div>
                      <div>
                        <strong>Next Appointment:</strong>{" "}
                        {selectedPatient.nextAppointment
                          ? formatDateInIST(selectedPatient.nextAppointment, { day: "2-digit", month: "short", year: "numeric" })
                          : "N/A"}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
    
  );
}
