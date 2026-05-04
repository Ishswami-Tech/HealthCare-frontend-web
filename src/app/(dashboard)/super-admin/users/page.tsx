"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUsers, useCreateUser, useDeleteUser } from "@/hooks/query/useUsers";
import { useClinics } from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { AssignRoleModal } from "@/components/clinic/AssignRoleModal";
import { Loader2, Users, Plus, Search, Edit, Trash2, UserCheck, UserX, Mail, Phone, MapPin, AlertCircle, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { Role } from "@/types/auth.types";
import { formatDateInIST } from "@/lib/utils/date-time";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Inactive";
  clinic: string;
  lastLogin?: string;
  raw: any;
};

type CreateUserForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  clinicId: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
};

const defaultCreateUserForm = (): CreateUserForm => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  role: Role.RECEPTIONIST,
  clinicId: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  emergencyContact: "",
  emergencyPhone: "",
  medicalHistory: "",
  allergies: "",
  currentMedications: "",
});

const ALL_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.CLINIC_ADMIN,
  Role.DOCTOR,
  Role.ASSISTANT_DOCTOR,
  Role.RECEPTIONIST,
  Role.PATIENT,
  Role.PHARMACIST,
  Role.NURSE,
  Role.THERAPIST,
  Role.LAB_TECHNICIAN,
  Role.COUNSELOR,
  Role.SUPPORT_STAFF,
  Role.FINANCE_BILLING,
  Role.CLINIC_LOCATION_HEAD,
];

const USER_CREATE_FIELDS = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "password", label: "Password" },
  { key: "phone", label: "Phone" },
] as const;

export default function SuperAdminUsers() {
  useAuth();
  useWebSocketQuerySync();
  const { data: usersData, isPending: isLoadingUsers } = useUsers();
  const { data: clinicsData } = useClinics();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [showCreateAdditionalDetails, setShowCreateAdditionalDetails] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserForm>(defaultCreateUserForm());

  const clinics = useMemo(() => {
    const data = clinicsData as any;
    return (Array.isArray(clinicsData) ? clinicsData : data?.clinics || data?.data || []) as any[];
  }, [clinicsData]);

  const users = useMemo<UserRow[]>(() => {
    if (!usersData) return [];
    const data = usersData as any;
    const usersArray = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data?.data)
          ? data.data
          : [];

    return usersArray.map((user: any) => ({
      id: user.id,
      name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      email: user.email,
      phone: user.phone || "N/A",
      role: user.role || user.roles?.[0]?.name || "UNKNOWN",
      status: user.isActive !== false ? "Active" : "Inactive",
      clinic: user.clinic?.name || "N/A",
      lastLogin: user.lastLogin || user.lastLoginAt,
      raw: user,
    }));
  }, [usersData]);

  useEffect(() => {
    if (!createForm.clinicId && clinics[0]?.id) {
      setCreateForm(prev => ({ ...prev, clinicId: clinics[0].id }));
    }
  }, [clinics, createForm.clinicId]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchTerm ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const statusKey = user.status.toLowerCase();
      const matchesStatus = statusFilter === "all" || statusKey === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const createUser = async () => {
    try {
      await createUserMutation.mutateAsync({
        ...createForm,
        phone: createForm.phone || undefined,
        clinicId: createForm.clinicId || undefined,
        gender: createForm.gender || undefined,
        dateOfBirth: createForm.dateOfBirth || undefined,
        address: createForm.address || undefined,
        city: createForm.city || undefined,
        state: createForm.state || undefined,
        zipCode: createForm.zipCode || undefined,
        ...(createForm.emergencyContact.trim() && createForm.emergencyPhone.trim()
          ? {
              emergencyContact: {
                name: createForm.emergencyContact.trim(),
                relationship: "Emergency Contact",
                phone: createForm.emergencyPhone.trim(),
              },
            }
          : {}),
        ...(createForm.medicalHistory.trim()
          ? { medicalHistory: [createForm.medicalHistory.trim()] }
          : {}),
        ...(createForm.allergies.trim()
          ? {
              allergies: createForm.allergies
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
            }
          : {}),
        ...(createForm.currentMedications.trim()
          ? {
              medicalHistory: [
                ...(createForm.medicalHistory.trim() ? [createForm.medicalHistory.trim()] : []),
                `Current medications: ${createForm.currentMedications.trim()}`,
              ],
            }
          : {}),
      } as any);
      showSuccessToast("User created successfully", { id: TOAST_IDS.USER.CREATE });
      setCreateOpen(false);
      setShowCreateAdditionalDetails(false);
      setCreateForm(defaultCreateUserForm());
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Failed to create user", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
    }
  };

  const handleDeleteUser = useCallback(async (user: UserRow) => {
    if (!window.confirm(`Delete ${user.name}?`)) {
      return;
    }
    try {
      await deleteUserMutation.mutateAsync(user.id);
      showSuccessToast("User deleted successfully", { id: TOAST_IDS.USER.DELETE });
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Failed to delete user", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
    }
  }, [deleteUserMutation]);

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-semibold">{row.original.name}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{row.original.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{row.original.phone}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <Badge variant="outline">{row.original.role.replace(/_/g, " ")}</Badge>,
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
        accessorKey: "clinic",
        header: "Clinic",
      },
      {
        accessorKey: "lastLogin",
        header: "Last Login",
        cell: ({ row }) =>
          row.original.lastLogin ? formatDateInIST(row.original.lastLogin) : "N/A",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditUser(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDeleteUser(row.original)} disabled={deleteUserMutation.isPending}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteUserMutation.isPending, handleDeleteUser]
  );

  if (isLoadingUsers) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 sm:p-6 sm:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Administration</h1>
          <p className="text-sm text-muted-foreground">Create, search, and manage role-aware users from one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <WebSocketStatusIndicator />
          <Button className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Add New User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">All roles included</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === Role.DOCTOR || u.role === Role.ASSISTANT_DOCTOR).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.role === Role.CLINIC_ADMIN).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.role === Role.PATIENT).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === "Active").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search and Filter Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ALL_ROLES.map(role => (
                  <SelectItem key={role} value={role}>{role.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filteredUsers} pageSize={10} emptyMessage="No users found." />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
              Create a new user and assign clinic/role access in one step.
          </DialogDescription>
        </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {USER_CREATE_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    type={key === "password" ? "password" : "text"}
                    value={createForm[key]}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, role: value as Role }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{role.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Clinic</Label>
                <Select value={createForm.clinicId} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, clinicId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>{clinic.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-3 py-2 dark:border-blue-900/50 dark:bg-blue-950/20">
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Additional Details</p>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                  Optional profile, emergency, and medical fields.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateAdditionalDetails((current) => !current)}
                className="h-8 gap-2 rounded-lg px-3 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:text-blue-200 dark:hover:bg-blue-900/30 dark:hover:text-blue-100"
              >
                {showCreateAdditionalDetails ? (
                  <>
                    Hide
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {showCreateAdditionalDetails && (
              <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={createForm.gender} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={createForm.dateOfBirth}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Textarea
                      value={createForm.address}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Street, city, state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={createForm.city}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={createForm.state}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Zip Code</Label>
                    <Input
                      value={createForm.zipCode}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, zipCode: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Contact</Label>
                    <Input
                      value={createForm.emergencyContact}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, emergencyContact: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Phone</Label>
                    <Input
                      value={createForm.emergencyPhone}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, emergencyPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Medical History</Label>
                    <Textarea
                      value={createForm.medicalHistory}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, medicalHistory: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Allergies</Label>
                    <Input
                      value={createForm.allergies}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, allergies: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Medications</Label>
                    <Textarea
                      value={createForm.currentMedications}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, currentMedications: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createUser} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AssignRoleModal
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        staffMember={
          editUser
            ? {
                id: editUser.id,
                name: editUser.name,
                email: editUser.email,
                role: editUser.role,
                status: editUser.status,
                permissions: editUser.raw?.permissions,
              }
            : {
                id: "",
                name: "",
                email: "",
                role: Role.RECEPTIONIST,
              }
        }
        currentUserRole={Role.SUPER_ADMIN}
        clinicId={undefined}
        onSuccess={() => setEditUser(null)}
      />
    </div>
  );
}
