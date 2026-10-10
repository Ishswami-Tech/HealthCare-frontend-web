"use client";

import { useMemo, useCallback, useReducer, useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Role } from "@/types/auth.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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
import { useQuickRegisterPatient } from "@/hooks/query/usePatients";
import { usePatientDirectory } from "@/hooks/query/usePatientDirectory";
import {
  PATIENT_DIRECTORY_DEFAULT_PAGE_SIZE,
  PATIENT_DIRECTORY_PAGE_SIZES,
  type PatientDirectoryPageSize,
  type PatientDirectoryRow,
} from "@/types/patient-directory.types";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { usePatientStore } from "@/stores";
import { formatDateInIST } from "@/lib/utils/date-time";
import { useDebouncedCallback } from "@/lib/utils/performance";
import { ServerPagination } from "@/components/ui/pagination";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";

interface PatientTableRow {
  id: string;
  patient: any;
  name: string;
  uhid: string;
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

type SelectedPatient = any;

type NewPatientFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
};

type ReceptionistPatientsState = {
  searchTerm: string;
  statusFilter: string;
  genderFilter: string;
  sortFilter: string;
  page: number;
  debouncedSearchTerm: string;
  showNewPatientDialog: boolean;
  showAdditionalPatientDetails: boolean;
  newPatient: NewPatientFormState;
};

type ReceptionistPatientsAction =
  | { type: "setSearchTerm"; value: string }
  | { type: "setDebouncedSearchTerm"; value: string }
  | { type: "setStatusFilter"; value: string }
  | { type: "setGenderFilter"; value: string }
  | { type: "setSortFilter"; value: string }
  | { type: "setPage"; value: number }
  | { type: "setShowNewPatientDialog"; value: boolean }
  | { type: "toggleAdditionalPatientDetails" }
  | { type: "updateNewPatient"; field: keyof NewPatientFormState; value: string }
  | { type: "resetAfterCreate" };

type PatientAllergiesListProps = {
  allergies: string[] | string | null | undefined;
};

function PatientAllergiesList({ allergies }: PatientAllergiesListProps) {
  if (!allergies) return null;

  return (
    <div>
      <strong>Allergies:</strong>
      <div className="mt-1 gap-y-1">
        {Array.isArray(allergies) ? (
          allergies.map((allergy: string) => (
            <div key={allergy} className="flex items-center gap-2">
              <AlertCircle className="size-4 text-red-500" />
              <span className="text-sm">{allergy}</span>
            </div>
          ))
        ) : (
          <span className="text-sm ml-2">{allergies}</span>
        )}
      </div>
    </div>
  );
}

const initialNewPatientFormState: NewPatientFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  emergencyContact: "",
  emergencyPhone: "",
  medicalHistory: "",
  allergies: "",
  currentMedications: "",
};

const initialReceptionistPatientsState: ReceptionistPatientsState = {
  searchTerm: "",
  statusFilter: "all",
  genderFilter: "all",
  sortFilter: "registered-desc",
  page: 1,
  debouncedSearchTerm: "",
  showNewPatientDialog: false,
  showAdditionalPatientDetails: false,
  newPatient: initialNewPatientFormState,
};

function receptionistPatientsReducer(
  state: ReceptionistPatientsState,
  action: ReceptionistPatientsAction
): ReceptionistPatientsState {
  switch (action.type) {
    case "setSearchTerm":
      return { ...state, searchTerm: action.value };
    case "setDebouncedSearchTerm":
      return { ...state, debouncedSearchTerm: action.value };
    case "setStatusFilter":
      return { ...state, statusFilter: action.value };
    case "setGenderFilter":
      return { ...state, genderFilter: action.value };
    case "setSortFilter":
      return { ...state, sortFilter: action.value };
    case "setPage":
      return { ...state, page: action.value };
    case "setShowNewPatientDialog":
      return { ...state, showNewPatientDialog: action.value };
    case "toggleAdditionalPatientDetails":
      return { ...state, showAdditionalPatientDetails: !state.showAdditionalPatientDetails };
    case "updateNewPatient":
      return {
        ...state,
        newPatient: {
          ...state.newPatient,
          [action.field]: action.value,
        },
      };
    case "resetAfterCreate":
      return {
        ...initialReceptionistPatientsState,
      };
    default:
      return state;
  }
}

function PatientDetailsSections({
  selectedPatient,
  getStatusColor,
}: {
  selectedPatient: SelectedPatient;
  getStatusColor: (status: string) => string;
}) {
  return (
    <div className="flex flex-col gap-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
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
            <Heart className="size-5" />
            Medical Information
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-y-4 text-sm">
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
  );
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

/** A directory row in the shape this page's table and details dialog already read. */
function directoryRowToPatient(row: PatientDirectoryRow) {
  return {
    id: row.patientId,
    userId: row.userId,
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    age: row.age ?? undefined,
    gender: row.gender ?? "",
    dateOfBirth: row.dateOfBirth ?? undefined,
    address: [row.city, row.state].filter(Boolean).join(", "),
    isActive: true,
    totalVisits: row.totalVisits,
    createdAt: row.registeredAt,
    lastVisit: row.lastVisit ?? undefined,
    uhid: row.uhid ?? "",
    legacyRegistration: row.legacyRegistration ?? "",
  };
}

export default function ReceptionistPatients() {
  useAuth();
  const { clinicId } = useClinicContext();
  const [
    {
      searchTerm,
      genderFilter,
      sortFilter,
      page,
      debouncedSearchTerm,
      showNewPatientDialog,
      showAdditionalPatientDetails,
      newPatient,
    },
    dispatch,
  ] = useReducer(receptionistPatientsReducer, initialReceptionistPatientsState);
  const [pageSize, setPageSize] = useState<PatientDirectoryPageSize>(PATIENT_DIRECTORY_DEFAULT_PAGE_SIZE);
  const selectedPatient = usePatientStore((state) => state.selectedPatient);
  const setSelectedPatient = usePatientStore((state) => state.setSelectedPatient);
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    dispatch({ type: "setDebouncedSearchTerm", value });
  }, 300);

  const handleSearchChange = (value: string) => {
    dispatch({ type: "setSearchTerm", value });
    dispatch({ type: "setPage", value: 1 });
    debouncedSetSearch(value);
  };

  // Search, filters, sorting and paging run on the server: the clinic has tens of thousands of patients.
  const [sortField, sortOrder] = sortFilter.split("-") as [
    "registered" | "name" | "visits" | "lastVisit" | "firstVisit",
    "asc" | "desc",
  ];
  const directoryQuery = usePatientDirectory(clinicId || "", {
    ...(debouncedSearchTerm.trim().length >= 2 ? { search: debouncedSearchTerm.trim() } : {}),
    ...(genderFilter === "MALE" || genderFilter === "FEMALE" || genderFilter === "OTHER"
      ? { gender: genderFilter }
      : {}),
    sort: sortField,
    order: sortOrder,
    page,
    pageSize,
  });
  const patientsQuery = directoryQuery;
  const patients = useMemo(
    () => (directoryQuery.data?.rows ?? []).map(directoryRowToPatient),
    [directoryQuery.data]
  );
  const patientsPage = {
    total: directoryQuery.data?.total ?? 0,
    page: directoryQuery.data?.page ?? page,
    totalPages: directoryQuery.data?.totalPages ?? 1,
    pageSize,
  };

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

  // Already searched, filtered and sorted by the server.
  const filteredPatients = patientsWithAge;

  const patientTableRows = useMemo<PatientTableRow[]>(
    () =>
      filteredPatients.map((patient: any) => ({
        id: patient.id,
        patient,
        name: patient.name || "Unknown Patient",
        uhid: patient.uhid || "",
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
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-green-100 dark:from-blue-950/50 dark:to-emerald-950/50">
              <span className="font-semibold text-blue-800 dark:text-blue-200">
                {row.original.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold">{row.original.name}</div>
              {row.original.uhid ? (
                <div className="font-mono text-xs text-muted-foreground">UHID {row.original.uhid}</div>
              ) : null}
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
              <Eye className="mr-1 size-4" />
              View
            </Button>
            <Button asChild size="sm">
              <Link href="/receptionist/appointments#appointment-manager">
                <Calendar className="mr-1 size-4" />
                Book
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [setSelectedPatient]
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
            .flatMap((value) => {
              const trimmed = value.trim();
              return trimmed ? [trimmed] : [];
            })
        : [];
      const medicalHistory = [
        newPatient.medicalHistory.trim(),
        newPatient.currentMedications.trim()
          ? `Current medications: ${newPatient.currentMedications.trim()}`
          : "",
      ].flatMap((value) => (value ? [value] : []));
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
      dispatch({ type: "resetAfterCreate" });
      setSelectedPatient(null);
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
    
        <div className="p-6 gap-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold">Patient Management</h1>
            <Dialog
              open={showNewPatientDialog}
              onOpenChange={(open) => dispatch({ type: "setShowNewPatientDialog", value: open })}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="size-4" />
                  Register Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-hidden border border-slate-200/50 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl dark:border-slate-800/60 sm:w-full sm:rounded-[24px]">
                <DialogHeader className="shrink-0 border-b border-slate-200/50 bg-background/70 p-5 pb-4 backdrop-blur-md dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <User className="size-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold leading-tight text-foreground">Register Patient</DialogTitle>
                      <p className="text-sm font-medium text-muted-foreground">Complete the form below to create a new medical record</p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-5 pt-3">
        <div className="flex flex-col gap-y-4">
                    {/* Identity & Contact Section */}
                    <section className="group/section rounded-xl border border-slate-100 bg-card/60 p-3.5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover/section:bg-emerald-100 transition-colors">
                          <Shield className="size-3.5" />
                        </div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Personal Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2.5">
                        <div className="flex flex-col gap-y-1">
                          <Label htmlFor="firstName" className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            First Name <span className="text-emerald-500">*</span>
                          </Label>
                          <Input
                            id="firstName"
                            placeholder="e.g. John"
                            className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                            value={newPatient.firstName}
                            onChange={(e) => dispatch({ type: "updateNewPatient", field: "firstName", value: e.target.value })}
                            required
                          />
                        </div>
                        <div className="gap-y-1">
                          <Label htmlFor="lastName" className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            Last Name <span className="text-emerald-500">*</span>
                          </Label>
                          <Input
                            id="lastName"
                            placeholder="e.g. Doe"
                            className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                            value={newPatient.lastName}
                            onChange={(e) => dispatch({ type: "updateNewPatient", field: "lastName", value: e.target.value })}
                            required
                          />
                        </div>
                        <div className="gap-y-1">
                          <Label htmlFor="phone" className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            Phone Number <span className="text-emerald-500">*</span>
                          </Label>
                          <div className="relative group/input">
                            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
                            <Input
                              id="phone"
                              placeholder="+1 (555) 000-0000"
                              className="pl-8 bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                              value={newPatient.phone}
                              onChange={(e) => dispatch({ type: "updateNewPatient", field: "phone", value: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="gap-y-1">
                          <Label htmlFor="email" className="text-[11px] font-semibold text-slate-700">Email Address</Label>
                          <div className="relative group/input">
                            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="john.doe@example.com"
                              className="pl-8 bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                              value={newPatient.email}
                              onChange={(e) => dispatch({ type: "updateNewPatient", field: "email", value: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="gap-y-1">
                          <Label htmlFor="dateOfBirth" className="text-[11px] font-semibold text-slate-700">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                            value={newPatient.dateOfBirth}
                            onChange={(e) => dispatch({ type: "updateNewPatient", field: "dateOfBirth", value: e.target.value })}
                          />
                        </div>
                        <div className="gap-y-1">
                          <Label htmlFor="gender" className="text-[11px] font-semibold text-slate-700">Gender</Label>
                          <Select
                            value={newPatient.gender}
                            onValueChange={(value) => dispatch({ type: "updateNewPatient", field: "gender", value })}
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

                    <div className="flex items-center justify-between rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <div>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                          Additional Details
                        </p>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                          Optional address, emergency contact, and medical notes.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch({ type: "toggleAdditionalPatientDetails" })}
                        className="h-8 gap-2 rounded-lg px-3 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-100"
                      >
                        {showAdditionalPatientDetails ? (
                          <>
                            Hide
                            <ChevronUp className="size-4" />
                          </>
                        ) : (
                          <>
                            Show
                            <ChevronDown className="size-4" />
                          </>
                        )}
                      </Button>
                    </div>

                    {showAdditionalPatientDetails && (
                      <>
                        {/* Address Section */}
                        <section className="group/section rounded-xl border border-slate-100 bg-card/60 p-3.5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg group-hover/section:bg-sky-100 transition-colors">
                              <MapPin className="size-3.5" />
                            </div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Location</h3>
                          </div>
                          <div className="gap-y-1">
                            <Label htmlFor="address" className="text-[11px] font-semibold text-slate-700">Full Home Address</Label>
                            <Textarea
                              id="address"
                              placeholder="Street, City, State, ZIP..."
                              className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all rounded-lg min-h-[50px] p-2.5 resize-none text-[13px]"
                              value={newPatient.address}
                              onChange={(e) => dispatch({ type: "updateNewPatient", field: "address", value: e.target.value })}
                            />
                          </div>
                        </section>

                        {/* Emergency Contact Section */}
                        <section className="group/section rounded-xl border border-slate-100 bg-card/60 p-3.5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg group-hover/section:bg-rose-100 transition-colors">
                              <AlertCircle className="size-3.5" />
                            </div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Emergency Details</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2.5">
                            <div className="gap-y-1">
                              <Label htmlFor="emergencyContact" className="text-[11px] font-semibold text-slate-700">Contact Name</Label>
                              <Input
                                id="emergencyContact"
                                placeholder="Name (Relationship)"
                                className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all rounded-lg h-8 text-[13px]"
                                value={newPatient.emergencyContact}
                                onChange={(e) => dispatch({ type: "updateNewPatient", field: "emergencyContact", value: e.target.value })}
                              />
                            </div>
                            <div className="gap-y-1">
                              <Label htmlFor="emergencyPhone" className="text-[11px] font-semibold text-slate-700">Contact Phone</Label>
                              <Input
                                id="emergencyPhone"
                                placeholder="+1 (555) 000-0000"
                                className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all rounded-lg h-8 text-[13px]"
                                value={newPatient.emergencyPhone}
                                onChange={(e) => dispatch({ type: "updateNewPatient", field: "emergencyPhone", value: e.target.value })}
                              />
                            </div>
                          </div>
                        </section>

                        {/* Medical Profile Section */}
                        <section className="group/section rounded-xl border border-slate-100 bg-card/60 p-3.5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/30">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover/section:bg-amber-100 transition-colors">
                              <ClipboardList className="size-3.5" />
                            </div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Medical profile</h3>
                          </div>
                          <div className="gap-y-3">
                            <div className="gap-y-1">
                              <Label htmlFor="medicalHistory" className="text-[11px] font-semibold text-slate-700">Past Observations / History</Label>
                              <Textarea
                                id="medicalHistory"
                                placeholder="Document any known conditions, allergies, or past surgeries..."
                                className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all rounded-lg min-h-[50px] p-2.5 resize-none text-[13px]"
                                value={newPatient.medicalHistory}
                                onChange={(e) => dispatch({ type: "updateNewPatient", field: "medicalHistory", value: e.target.value })}
                              />
                            </div>
                            <div className="gap-y-1">
                              <Label htmlFor="allergies" className="text-[11px] font-semibold text-slate-700">Known Allergies</Label>
                              <Input
                                id="allergies"
                                placeholder="Food, drug, or other allergies..."
                                className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg h-8 text-[13px]"
                                value={newPatient.allergies}
                                onChange={(e) => dispatch({ type: "updateNewPatient", field: "allergies", value: e.target.value })}
                              />
                            </div>
                            <div className="gap-y-1">
                              <Label htmlFor="currentMedications" className="text-[11px] font-semibold text-slate-700">Current Medications</Label>
                              <Textarea
                                id="currentMedications"
                                placeholder="List current medications with dosage..."
                                className="bg-white/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all rounded-lg min-h-[50px] p-2.5 resize-none text-[13px]"
                                value={newPatient.currentMedications}
                                onChange={(e) => dispatch({ type: "updateNewPatient", field: "currentMedications", value: e.target.value })}
                              />
                            </div>
                          </div>
                        </section>
                      </>
                    )}
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
                      onClick={() => dispatch({ type: "setShowNewPatientDialog", value: false })}
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
                          <Loader2 className="size-3.5 animate-spin" />
                          Registering…
                        </>
                      ) : (
                        <>
                          Register Patient
                          <ArrowRight className="size-3.5 ml-1 opacity-60" />
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
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Patients
                </CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientsPage.total || patients.length}</div>
                <p className="text-xs text-muted-foreground">Registered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Patients
                </CardTitle>
                <UserCheck className="size-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {patients.filter((p: any) => p.isActive !== false).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Loaded page active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  New This Month
                </CardTitle>
                <UserPlus className="size-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" suppressHydrationWarning>
                  {patients.filter((p: any) => {
                    if (!p.createdAt) return false;
                    const created = new Date(p.createdAt);
                    const now = new Date();
                    return (
                      created.getMonth() === now.getMonth() &&
                      created.getFullYear() === now.getFullYear()
                    );
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>Loaded page registrations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inactive Patients
                </CardTitle>
                <AlertCircle className="size-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {patients.filter((p: any) => p.isActive === false).length}
                </div>
                <p className="text-xs text-muted-foreground">Loaded page inactive</p>
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, phone, UHID, OPD or register number..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={genderFilter} onValueChange={(value) => {
                  dispatch({ type: "setGenderFilter", value });
                  dispatch({ type: "setPage", value: 1 });
                }}>
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
                <Select value={sortFilter} onValueChange={(value) => {
                  dispatch({ type: "setSortFilter", value });
                  dispatch({ type: "setPage", value: 1 });
                }}>
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registered-desc">Newest registered</SelectItem>
                    <SelectItem value="registered-asc">Oldest registered</SelectItem>
                    <SelectItem value="lastVisit-desc">Last visit (newest)</SelectItem>
                    <SelectItem value="lastVisit-asc">Last visit (oldest)</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="visits-desc">Most visits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Showing {filteredPatients.length.toLocaleString("en-IN")} of{" "}
                {patientsPage.total.toLocaleString("en-IN")} patients
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
                showPagination={false}
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span id="receptionist-page-size-label">Show</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value) as PatientDirectoryPageSize);
                  dispatch({ type: "setPage", value: 1 });
                }}
              >
                <SelectTrigger className="w-24" aria-labelledby="receptionist-page-size-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATIENT_DIRECTORY_PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
            <ServerPagination
              page={page}
              totalPages={patientsPage.totalPages || 1}
              totalItems={patientsPage.total}
              pageSize={pageSize}
              onPageChange={(nextPage) => dispatch({ type: "setPage", value: nextPage })}
            />
          </div>

          <div className="hidden grid gap-4">
            {filteredPatients.map((patient: any) => (
              <Card
                key={patient.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="size-16 bg-linear-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
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
                              <Phone className="size-3" />
                              {patient.phone}
                            </span>
                          )}
                          {patient.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="size-3" />
                              {patient.email}
                            </span>
                          )}
                          {patient.age && (
                            <span>
                              {patient.age} years{" "}
                              {patient.gender ? `â€¢ ${patient.gender}` : ""}
                            </span>
                          )}
                        </div>
                        {patient.address && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin className="size-3" />
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

                    <div className="text-right gap-y-2">
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
                              <Eye className="size-4 mr-1" />
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
                              <div className="gap-y-6">
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
                                      <Heart className="size-5" />
                                      Medical Information
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="gap-y-4">
                                    {selectedPatient.bloodGroup && (
                                      <div>
                                        <strong>Blood Group:</strong>{" "}
                                        {selectedPatient.bloodGroup}
                                      </div>
                                    )}
                                    {selectedPatient.allergies && (
                                      <PatientAllergiesList
                                        allergies={selectedPatient.allergies}
                                      />
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
                            <Calendar className="size-4 mr-1" />
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
            <Empty>
              <EmptyContent>
                <EmptyMedia>
                  <Users className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No patients found</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your search criteria.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
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
                <PatientDetailsSections
                  selectedPatient={selectedPatient}
                  getStatusColor={getStatusColor}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
    
  );
}



