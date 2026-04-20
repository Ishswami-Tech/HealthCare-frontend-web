"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinics, useCreateClinic, useDeleteClinic, useUpdateClinic } from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { Building2, Plus, Search, Edit, Trash2, Loader2, MapPin, Phone, Mail, Users, Activity } from "lucide-react";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import type { CreateClinicData, UpdateClinicData } from "@/types/clinic.types";

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

const CLINIC_CORE_FIELDS = [
  { key: "name", label: "Clinic Name" },
  { key: "subdomain", label: "Subdomain" },
  { key: "app_name", label: "App Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "timezone", label: "Timezone" },
  { key: "currency", label: "Currency" },
  { key: "language", label: "Language" },
  { key: "clinicAdminIdentifier", label: "Clinic Admin Identifier" },
] as const;

const CLINIC_LOCATION_FIELDS = [
  { key: "name", label: "Location Name" },
  { key: "address", label: "Location Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "zipCode", label: "Zip Code" },
  { key: "phone", label: "Location Phone" },
  { key: "email", label: "Location Email" },
] as const;

function getClinicFieldValue(form: ClinicFormState, key: (typeof CLINIC_CORE_FIELDS)[number]["key"] | "address" | "website" | "logo") {
  return (form as unknown as Record<string, string | undefined>)[key] || "";
}

function getLocationFieldValue(
  form: ClinicFormState,
  key: (typeof CLINIC_LOCATION_FIELDS)[number]["key"]
) {
  return (form.mainLocation as unknown as Record<string, string | undefined>)[key] || "";
}

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
  const [clinicForm, setClinicForm] = useState<ClinicFormState>(defaultClinicForm());

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

  useEffect(() => {
    if (editingClinic) {
      const raw = editingClinic.raw || {};
      setClinicForm({
        id: editingClinic.id,
        name: editingClinic.name || "",
        address: editingClinic.address || "",
        phone: editingClinic.phone || "",
        email: editingClinic.email || "",
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
          name: raw.mainLocation?.name || editingClinic.name || "",
          address: raw.mainLocation?.address || editingClinic.address || "",
          city: raw.mainLocation?.city || "",
          state: raw.mainLocation?.state || "",
          country: raw.mainLocation?.country || "India",
          zipCode: raw.mainLocation?.zipCode || "",
          phone: raw.mainLocation?.phone || editingClinic.phone || "",
          email: raw.mainLocation?.email || editingClinic.email || "",
          timezone: raw.mainLocation?.timezone || raw.timezone || "Asia/Kolkata",
        },
      });
    } else if (clinicDialogOpen) {
      setClinicForm(defaultClinicForm());
    }
  }, [editingClinic, clinicDialogOpen]);

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
          <div className="space-y-1">
            <div className="font-semibold">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.establishedDate ? new Date(row.original.establishedDate).toLocaleDateString() : "N/A"}</div>
          </div>
        ),
      },
      {
        accessorKey: "address",
        header: "Location",
        cell: ({ row }) => (
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{row.original.address}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{row.original.phone}</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{row.original.email}</div>
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
            <Button variant="outline" size="sm" onClick={() => { setEditingClinic(row.original); setClinicDialogOpen(true); }}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDeleteClinic(row.original)} disabled={deleteClinic.isPending}>
              <Trash2 className="h-4 w-4" />
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clinic Management</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and monitor clinics from one operational table.</p>
        </div>
        <div className="flex items-center gap-4">
          <WebSocketStatusIndicator />
          <Button className="flex items-center gap-2" onClick={() => { setEditingClinic(null); setClinicDialogOpen(true); }}>
            <Plus className="w-4 h-4" />
            Add New Clinic
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinics.length}</div>
            <p className="text-xs text-muted-foreground">{clinics.filter(c => c.status === "Active").length} active, {clinics.filter(c => c.status !== "Active").length} inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinics.reduce((sum, clinic) => sum + (clinic.doctorsCount || 0), 0)}</div>
            <p className="text-xs text-muted-foreground">Across all clinics</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinics.reduce((sum, clinic) => sum + (clinic.patientsCount || 0), 0)}</div>
            <p className="text-xs text-muted-foreground">Active patient base</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15%</div>
            <p className="text-xs text-muted-foreground">Monthly growth</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Clinics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by clinic name, address, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filteredClinics} pageSize={10} emptyMessage="No clinics found." />

      <Dialog open={clinicDialogOpen} onOpenChange={setClinicDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClinic ? "Edit Clinic" : "Create Clinic"}</DialogTitle>
            <DialogDescription>
              Manage clinic profile, branding, and primary location from one form.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CLINIC_CORE_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    value={getClinicFieldValue(clinicForm, key)}
                    disabled={Boolean(editingClinic) && ["subdomain", "app_name", "clinicAdminIdentifier"].includes(key)}
                    onChange={(e) =>
                      setClinicForm((prev) => ({ ...prev, [key]: e.target.value } as ClinicFormState))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={clinicForm.description || ""}
                onChange={(e) => setClinicForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "address" as const, label: "Clinic Address" },
                { key: "website" as const, label: "Website" },
                { key: "logo" as const, label: "Logo URL" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    value={getClinicFieldValue(clinicForm, key)}
                    onChange={(e) =>
                      setClinicForm((prev) => ({ ...prev, [key]: e.target.value } as ClinicFormState))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="text-sm font-medium">Primary Location</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CLINIC_LOCATION_FIELDS.map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Input
                      value={getLocationFieldValue(clinicForm, key)}
                      disabled={!!editingClinic}
                      onChange={(e) =>
                        setClinicForm((prev) => ({
                          ...prev,
                          mainLocation: {
                            ...prev.mainLocation,
                            [key]: e.target.value,
                          } as CreateClinicData["mainLocation"],
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setClinicDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveClinic} disabled={createClinic.isPending || updateClinic.isPending}>
                {createClinic.isPending || updateClinic.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingClinic ? "Save Changes" : "Create Clinic"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
