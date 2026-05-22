"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinics, useCreateClinic, useDeleteClinic, useUpdateClinic } from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { Plus, Edit, Trash2, Loader2, MapPin, Phone, Mail } from "lucide-react";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import type { CreateClinicData, UpdateClinicData } from "@/types/clinic.types";
import { formatDateInIST } from "@/lib/utils/date-time";
import { ClinicStatsGrid } from "@/components/clinic/ClinicStatsGrid";
import { ClinicSearchCard } from "@/components/clinic/ClinicSearchCard";
import { ClinicFormDialog } from "@/components/clinic/ClinicFormDialog";

type ClinicRow = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive";
  doctorsCount: number;
  patientsCount: number;
  establishedDate?: string;
  raw: any;
};

type ClinicFormState = CreateClinicData & { id?: string };

const defaultClinicForm = (): ClinicFormState => ({
  name: "",
  address: "",
  phone: "",
  email: "",
  subdomain: "",
  app_name: "",
  timezone: "Asia/Kolkata",
  currency: "INR",
  language: "en",
  description: "",
  website: "",
  logo: "",
  clinicAdminIdentifier: "",
  mainLocation: {
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    zipCode: "",
    phone: "",
    email: "",
    timezone: "Asia/Kolkata",
  },
});

function buildClinicFormFromClinic(clinic: ClinicRow): ClinicFormState {
  const raw = clinic.raw || {};
  return {
    id: clinic.id,
    name: clinic.name || "",
    address: clinic.address || "",
    phone: clinic.phone || "",
    email: clinic.email || "",
    subdomain: raw.subdomain || "",
    app_name: raw.app_name || raw.appName || "",
    timezone: raw.timezone || "Asia/Kolkata",
    currency: raw.currency || "INR",
    language: raw.language || "en",
    description: raw.description || "",
    website: raw.website || "",
    logo: raw.logo || "",
    clinicAdminIdentifier: "",
    mainLocation: {
      name: raw.mainLocation?.name || clinic.name || "",
      address: raw.mainLocation?.address || clinic.address || "",
      city: raw.mainLocation?.city || "",
      state: raw.mainLocation?.state || "",
      country: raw.mainLocation?.country || "India",
      zipCode: raw.mainLocation?.zipCode || "",
      phone: raw.mainLocation?.phone || clinic.phone || "",
      email: raw.mainLocation?.email || clinic.email || "",
      timezone: raw.mainLocation?.timezone || raw.timezone || "Asia/Kolkata",
    },
  };
}

export default function SuperAdminClinics() {
  useAuth();
  useWebSocketQuerySync();
  const { data: clinicsData, isPending: isLoadingClinics } = useClinics();
  const createClinic = useCreateClinic();
  const updateClinic = useUpdateClinic();
  const deleteClinic = useDeleteClinic();

  const [searchTerm, setSearchTerm] = useState("");
  const [clinicDialogOpen, setClinicDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<ClinicRow | null>(null);
  const [clinicForm, setClinicForm] = useState<ClinicFormState>(() => defaultClinicForm());

  const clinics = useMemo<ClinicRow[]>(() => {
    const data = clinicsData as any;
    const clinicsArray = (Array.isArray(clinicsData) ? clinicsData : data?.clinics || data?.data || []) as any[];
    return clinicsArray.map((clinic) => ({
      id: clinic.id,
      raw: clinic,
      name: clinic.name,
      address: clinic.address || clinic.location?.address || "N/A",
      phone: clinic.phone || "N/A",
      email: clinic.email || "N/A",
      status: clinic.isActive !== false ? "Active" : "Inactive",
      doctorsCount: clinic.doctorsCount || 0,
      patientsCount: clinic.patientsCount || 0,
      establishedDate: clinic.createdAt || clinic.establishedDate,
    }));
  }, [clinicsData]);

  const filteredClinics = useMemo(() => {
    return clinics.filter(
      clinic =>
        clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clinic.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clinic.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clinics, searchTerm]);

  const saveClinic = async () => {
    try {
      if (editingClinic) {
        const payload: UpdateClinicData = {
          name: clinicForm.name,
          address: clinicForm.address,
          phone: clinicForm.phone,
          email: clinicForm.email,
          ...(clinicForm.timezone ? { timezone: clinicForm.timezone } : {}),
          ...(clinicForm.currency ? { currency: clinicForm.currency } : {}),
          ...(clinicForm.language ? { language: clinicForm.language } : {}),
          ...(clinicForm.description ? { description: clinicForm.description } : {}),
          ...(clinicForm.website ? { website: clinicForm.website } : {}),
          ...(clinicForm.logo ? { logo: clinicForm.logo } : {}),
          settings: {
            clinicAdminIdentifier: clinicForm.clinicAdminIdentifier,
            mainLocation: clinicForm.mainLocation,
          },
        } as UpdateClinicData;
        await updateClinic.mutateAsync({ id: editingClinic.id, data: payload });
        showSuccessToast("Clinic updated successfully", { id: TOAST_IDS.CLINIC.UPDATE });
      } else {
        const payload: CreateClinicData = {
          name: clinicForm.name,
          address: clinicForm.address,
          phone: clinicForm.phone,
          email: clinicForm.email,
          subdomain: clinicForm.subdomain,
          app_name: clinicForm.app_name,
          ...(clinicForm.timezone ? { timezone: clinicForm.timezone } : {}),
          ...(clinicForm.currency ? { currency: clinicForm.currency } : {}),
          ...(clinicForm.language ? { language: clinicForm.language } : {}),
          ...(clinicForm.description ? { description: clinicForm.description } : {}),
          ...(clinicForm.website ? { website: clinicForm.website } : {}),
          ...(clinicForm.logo ? { logo: clinicForm.logo } : {}),
          mainLocation: clinicForm.mainLocation,
          ...(clinicForm.clinicAdminIdentifier?.trim()
            ? { clinicAdminIdentifier: clinicForm.clinicAdminIdentifier.trim() }
            : {}),
        } as CreateClinicData;
        await createClinic.mutateAsync(payload);
        showSuccessToast("Clinic created successfully", { id: TOAST_IDS.CLINIC.CREATE });
      }
      setClinicDialogOpen(false);
      setEditingClinic(null);
      setClinicForm(defaultClinicForm());
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Failed to save clinic", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
    }
  };

  const handleDeleteClinic = useCallback(async (clinic: ClinicRow) => {
    if (!window.confirm(`Delete ${clinic.name}? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteClinic.mutateAsync(clinic.id);
      showSuccessToast("Clinic deleted successfully", { id: TOAST_IDS.CLINIC.DELETE });
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Failed to delete clinic", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
    }
  }, [deleteClinic]);

  const columns = useMemo<ColumnDef<ClinicRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Clinic",
        cell: ({ row }) => (
          <div className="gap-y-1">
            <div className="font-semibold">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.establishedDate ? formatDateInIST(row.original.establishedDate) : "N/A"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "address",
        header: "Location",
        cell: ({ row }) => (
          <div className="gap-y-1 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              {row.original.address}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              {row.original.phone}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              {row.original.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "doctorsCount",
        header: "Doctors",
      },
      {
        accessorKey: "patientsCount",
        header: "Patients",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "Active" ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingClinic(row.original);
                setClinicForm(buildClinicFormFromClinic(row.original));
                setClinicDialogOpen(true);
              }}
            >
              <Edit className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteClinic(row.original)}
              disabled={deleteClinic.isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteClinic.isPending, handleDeleteClinic]
  );

  if (isLoadingClinics) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isFormPending = createClinic.isPending || updateClinic.isPending;

  return (
    <div className="p-4 gap-y-4 sm:p-6 sm:gap-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Clinic Management</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and monitor clinics from one operational table.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <WebSocketStatusIndicator />
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setEditingClinic(null);
              setClinicForm(defaultClinicForm());
              setClinicDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add New Clinic
          </Button>
        </div>
      </div>

      <ClinicStatsGrid clinics={clinics} />
      <ClinicSearchCard searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <Card>
        <DataTable columns={columns} data={filteredClinics} pageSize={10} emptyMessage="No clinics found." />
      </Card>

      <ClinicFormDialog
        open={clinicDialogOpen}
        onOpenChange={(open) => {
          setClinicDialogOpen(open);
          if (!open) {
            setEditingClinic(null);
            setClinicForm(defaultClinicForm());
          }
        }}
        editingClinic={!!editingClinic}
        clinicForm={clinicForm}
        onFormChange={setClinicForm}
        onSave={saveClinic}
        isPending={isFormPending}
      />
    </div>
  );
}
