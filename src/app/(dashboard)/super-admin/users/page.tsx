"use client";

import { useCallback, useMemo, useReducer } from "react";
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

type SuperAdminUsersState = {
  searchTerm: string;
  roleFilter: string;
  statusFilter: string;
  createOpen: boolean;
  showCreateAdditionalDetails: boolean;
  editUser: UserRow | null;
  createForm: CreateUserForm;
};

type SuperAdminUsersAction =
  | { type: "setSearchTerm"; value: string }
  | { type: "setRoleFilter"; value: string }
  | { type: "setStatusFilter"; value: string }
  | { type: "setCreateOpen"; value: boolean }
  | { type: "setShowCreateAdditionalDetails"; value: boolean }
  | { type: "setEditUser"; value: UserRow | null }
  | { type: "setCreateForm"; value: CreateUserForm }
  | { type: "updateCreateForm"; value: Partial<CreateUserForm> }
  | { type: "resetCreateForm" };

const initialSuperAdminUsersState: SuperAdminUsersState = {
  searchTerm: "",
  roleFilter: "all",
  statusFilter: "all",
  createOpen: false,
  showCreateAdditionalDetails: false,
  editUser: null,
  createForm: defaultCreateUserForm(),
};

function superAdminUsersReducer(
  state: SuperAdminUsersState,
  action: SuperAdminUsersAction
): SuperAdminUsersState {
  switch (action.type) {
    case "setSearchTerm":
      return { ...state, searchTerm: action.value };
    case "setRoleFilter":
      return { ...state, roleFilter: action.value };
    case "setStatusFilter":
      return { ...state, statusFilter: action.value };
    case "setCreateOpen":
      return { ...state, createOpen: action.value };
    case "setShowCreateAdditionalDetails":
      return { ...state, showCreateAdditionalDetails: action.value };
    case "setEditUser":
      return { ...state, editUser: action.value };
    case "setCreateForm":
      return { ...state, createForm: action.value };
    case "updateCreateForm":
      return { ...state, createForm: { ...state.createForm, ...action.value } };
    case "resetCreateForm":
      return { ...state, createForm: defaultCreateUserForm() };
    default:
      return state;
  }
}

export default function SuperAdminUsers() {
  useAuth();
  useWebSocketQuerySync();
  const { data: usersData, isPending: isLoadingUsers } = useUsers();
  const { data: clinicsData } = useClinics();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const [
    {
      searchTerm,
      roleFilter,
      statusFilter,
      createOpen,
      showCreateAdditionalDetails,
      editUser,
      createForm,
    },
    dispatch,
  ] = useReducer(superAdminUsersReducer, initialSuperAdminUsersState);

  const setSearchTerm = (value: string) => dispatch({ type: "setSearchTerm", value });
  const setRoleFilter = (value: string) => dispatch({ type: "setRoleFilter", value });
  const setStatusFilter = (value: string) => dispatch({ type: "setStatusFilter", value });
  const setCreateOpen = (value: boolean) => dispatch({ type: "setCreateOpen", value });
  const setShowCreateAdditionalDetails = (value: boolean) =>
    dispatch({ type: "setShowCreateAdditionalDetails", value });
  const setEditUser = (value: UserRow | null) => dispatch({ type: "setEditUser", value });
  const setCreateForm = (value: CreateUserForm) => dispatch({ type: "setCreateForm", value });
  const updateCreateForm = (value: Partial<CreateUserForm>) =>
    dispatch({ type: "updateCreateForm", value });
  const resetCreateForm = () => dispatch({ type: "resetCreateForm" });

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

  const handleCreateDialogChange = useCallback((open: boolean) => {
    setCreateOpen(open);
    if (open) {
      if (!createForm.clinicId && clinics[0]?.id) {
        updateCreateForm({ clinicId: clinics[0].id } as Partial<CreateUserForm>);
      }
      return;
    }
    setShowCreateAdditionalDetails(false);
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
                .flatMap((value) => {
                  const trimmed = value.trim();
                  return trimmed ? [trimmed] : [];
                }),
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
      resetCreateForm();
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
          <div className="gap-y-1">
            <div className="font-semibold">{row.original.name}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="size-4" />
              <span>{row.original.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="size-4" />
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
              <Edit className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDeleteUser(row.original)} disabled={deleteUserMutation.isPending}>
              <Trash2 className="size-4" />
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
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 gap-y-4 sm:p-6 sm:gap-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">User Administration</h1>
          <p className="text-sm text-muted-foreground">Create, search, and manage role-aware users from one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <WebSocketStatusIndicator />
          <Button className="flex items-center gap-2" onClick={() => handleCreateDialogChange(true)}>
            <Plus className="size-4" />
            Add New User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">All roles included</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <UserCheck className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === Role.DOCTOR || u.role === Role.ASSISTANT_DOCTOR).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UserCheck className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.role === Role.CLINIC_ADMIN).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <Users className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.role === Role.PATIENT).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="size-4 text-green-600" />
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
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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

      <Dialog open={createOpen} onOpenChange={handleCreateDialogChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
              Create a new user and assign clinic/role access in one step.
          </DialogDescription>
        </DialogHeader>
          <div className="gap-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {USER_CREATE_FIELDS.map(({ key, label }) => (
                <div key={key} className="gap-y-2">
                  <Label>{label}</Label>
                  <Input
                    type={key === "password" ? "password" : "text"}
                    value={createForm[key]}
                    onChange={(e) =>
                      updateCreateForm({ [key]: e.target.value } as Partial<CreateUserForm>)
                    }
                  />
                </div>
              ))}
              <div className="gap-y-2">
                <Label>Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) =>
                    updateCreateForm({ role: value as Role } as Partial<CreateUserForm>)
                  }
                >
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
              <div className="gap-y-2">
                <Label>Clinic</Label>
                <Select
                  value={createForm.clinicId}
                  onValueChange={(value) =>
                    updateCreateForm({ clinicId: value } as Partial<CreateUserForm>)
                  }
                >
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
                onClick={() => setShowCreateAdditionalDetails(!showCreateAdditionalDetails)}
                className="h-8 gap-2 rounded-lg px-3 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:text-blue-200 dark:hover:bg-blue-900/30 dark:hover:text-blue-100"
              >
                {showCreateAdditionalDetails ? (
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

            {showCreateAdditionalDetails && (
              <div className="gap-y-4 rounded-2xl border border-border bg-muted/20 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="gap-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={createForm.gender}
                      onValueChange={(value) =>
                        updateCreateForm({ gender: value } as Partial<CreateUserForm>)
                      }
                    >
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
                  <div className="gap-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={createForm.dateOfBirth}
                      onChange={(e) =>
                        updateCreateForm({ dateOfBirth: e.target.value } as Partial<CreateUserForm>)
                      }
                    />
                  </div>
                  <div className="gap-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Textarea
                      value={createForm.address}
                      onChange={(e) =>
                        updateCreateForm({ address: e.target.value } as Partial<CreateUserForm>)
                      }
                      placeholder="Street, city, state"
                    />
                  </div>
                  <div className="gap-y-2">
                    <Label>City</Label>
                    <Input
                      value={createForm.city}
                      onChange={(e) =>
                        updateCreateForm({ city: e.target.value } as Partial<CreateUserForm>)
                      }
                    />
                  </div>
                  <div className="gap-y-2">
                    <Label>State</Label>
                    <Input
                      value={createForm.state}
                      onChange={(e) =>
                        updateCreateForm({ state: e.target.value } as Partial<CreateUserForm>)
                      }
                    />
                  </div>
                  <div className="gap-y-2">
                    <Label>Zip Code</Label>
                    <Input
                      value={createForm.zipCode}
                      onChange={(e) =>
                        updateCreateForm({ zipCode: e.target.value } as Partial<CreateUserForm>)
                      }
                    />
                  </div>
                  <div className="gap-y-2">
                    <Label>Emergency Contact</Label>
                    <Input
                      value={createForm.emergencyContact}
                      onChange={(e) =>
                        updateCreateForm({ emergencyContact: e.target.value } as Partial<CreateUserForm>)
                      }
                    />
                  </div>
                  <div className="gap-y-2">
                    <Label>Emergency Phone</Label>
                    <Input
                      value={createForm.emergencyPhone}
                      onChange={(e) =>
                        updateCreateForm({ emergencyPhone: e.target.value } as Partial<CreateUserForm>)
                      }
                    />
                  </div>
                  <div className="gap-y-2 md:col-span-2">
                    <Label>Medical History</Label>
                    <Textarea
                      value={createForm.medicalHistory}
                      onChange={(e) =>
                        updateCreateForm({ medicalHistory: e.target.value } as Partial<CreateUserForm>)
                      }
                    />
                  </div>
                  <div className="gap-y-2">
                    <Label>Allergies</Label>
                    <Input
                      value={createForm.allergies}
                      onChange={(e) =>
                        updateCreateForm({ allergies: e.target.value } as Partial<CreateUserForm>)
                      }
                    />
                  </div>
                  <div className="gap-y-2">
                    <Label>Current Medications</Label>
                    <Textarea
                      value={createForm.currentMedications}
                      onChange={(e) =>
                        updateCreateForm({ currentMedications: e.target.value } as Partial<CreateUserForm>)
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createUser} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
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


