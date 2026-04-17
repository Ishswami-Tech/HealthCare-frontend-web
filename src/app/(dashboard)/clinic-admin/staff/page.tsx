"use client";

import { useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, Filter, Mail, Phone, Plus, Search, ShieldCheck, Stethoscope, UserCheck, UserCog, Users } from "lucide-react";

import { Role } from "@/types/auth.types";
import { useLayoutStore } from "@/stores/layout.store";
import { AssignRoleModal } from "@/components/clinic/AssignRoleModal";
import { AddStaffModal } from "@/components/clinic/AddStaffModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinic } from "@/hooks/query/useClinics";
import { useUsersByClinic } from "@/hooks/query/useUsers";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { cn } from "@/lib/utils";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Inactive";
  specialization: string;
  department: string;
  joinDate?: string;
  experience: string;
  location: string;
  permissions?: string[] | null;
};

export default function ClinicAdminStaff() {
  useAuth();
  const { data: currentClinic } = useCurrentClinic();
  const clinicId = currentClinic?.id;
  const clinicName = currentClinic?.name;

  const setPageTitle = useLayoutStore((s) => s.setPageTitle);
  useEffect(() => {
    setPageTitle("Staff Directory");
  }, [setPageTitle]);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignModalStaff, setAssignModalStaff] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    status?: string;
    permissions?: string[];
  } | null>(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);

  const { data: staffData, isPending: isLoadingStaff, refetch } = useUsersByClinic(
    clinicId || ""
  );

  useWebSocketQuerySync();

  const staff = useMemo<StaffMember[]>(() => {
    if (!staffData) return [];
    const data = staffData as any;
    const users = Array.isArray(data) ? data : data?.users || data?.data || [];

    return users.map((user: any) => ({
      id: user.id,
      name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed",
      email: user.email,
      phone: user.phone || "No contact",
      role: user.role || user.roles?.[0]?.name || "STAFF",
      status: user.isActive !== false ? "Active" : "Inactive",
      specialization: user.specialization || "General",
      department: user.department || "Medical",
      joinDate: user.createdAt || user.joinedAt,
      experience: user.experience || "N/A",
      location: user.location?.name || "Main Clinic",
      permissions: user.permissions || user.roles?.[0]?.permissions || null,
    }));
  }, [staffData]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        member.name.toLowerCase().includes(search) ||
        member.email.toLowerCase().includes(search) ||
        member.specialization.toLowerCase().includes(search);
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || member.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, searchTerm, roleFilter, statusFilter]);

  const getRoleBadge = (role: Role | string) => {
    const normalized = role as Role;
    switch (normalized) {
      case Role.DOCTOR:
        return (
          <Badge className="border-blue-200/50 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400">
            Doctor
          </Badge>
        );
      case Role.CLINIC_ADMIN:
        return (
          <Badge className="border-purple-200/50 bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-400">
            Admin
          </Badge>
        );
      case Role.RECEPTIONIST:
        return (
          <Badge className="border-emerald-200/50 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400">
            Reception
          </Badge>
        );
      case Role.PHARMACIST:
        return (
          <Badge className="border-orange-200/50 bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 dark:text-orange-400">
            Pharmacy
          </Badge>
        );
      case Role.NURSE:
        return (
          <Badge className="border-teal-200/50 bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 dark:text-teal-400">
            Nurse
          </Badge>
        );
      case Role.THERAPIST:
        return (
          <Badge className="border-indigo-200/50 bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-400">
            Therapist
          </Badge>
        );
      case Role.LAB_TECHNICIAN:
        return (
          <Badge className="border-rose-200/50 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-400">
            Lab Tech
          </Badge>
        );
      case Role.COUNSELOR:
        return (
          <Badge className="border-pink-200/50 bg-pink-500/10 text-pink-700 hover:bg-pink-500/20 dark:text-pink-400">
            Counselor
          </Badge>
        );
      case Role.FINANCE_BILLING:
        return (
          <Badge className="border-amber-200/50 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400">
            Finance
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="capitalize">
            {role.toLowerCase().replace("_", " ")}
          </Badge>
        );
    }
  };

  const columns = useMemo<ColumnDef<StaffMember>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Staff Member",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 font-bold text-primary">
              {row.original.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {row.original.name}
              </p>
              <p className="text-xs text-muted-foreground">ID: #{row.original.id.substring(0, 8)}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role & Dept",
        cell: ({ row }) => (
          <div className="space-y-1">
            {getRoleBadge(row.original.role)}
            <p className="text-[10px] font-medium text-muted-foreground">
              {row.original.department}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "specialization",
        header: "Specialization",
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.specialization}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "Active" ? "outline" : "secondary"}
            className={cn(
              "rounded-full border-none",
              row.original.status === "Active"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400"
            )}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "email",
        header: "Contact",
        cell: ({ row }) => (
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              <span>{row.original.email}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              <span>{row.original.phone}</span>
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
            onClick={() =>
                setAssignModalStaff({
                  id: row.original.id,
                  name: row.original.name,
                  email: row.original.email,
                  role: row.original.role,
                  status: row.original.status,
                  ...(row.original.permissions ? { permissions: row.original.permissions } : {}),
                })
              }
              className="bg-neutral-50 font-medium dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
              Manage Access
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (isLoadingStaff) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="animate-pulse text-muted-foreground">Loading staff database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 text-foreground sm:p-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Clinic Staff Roster
            </h1>
          </div>
          <p className="font-medium text-muted-foreground">
            Manage healthcare professionals and administrative staff for{" "}
            <span className="font-bold text-primary">{clinicName || "your clinic"}</span>
          </p>
        </div>

        <div className="flex w-full flex-col flex-wrap items-start gap-3 sm:flex-row sm:items-center md:w-auto">
          <div className="hidden sm:block">
            <WebSocketStatusIndicator />
          </div>
          <Button
            onClick={() => setIsAddStaffModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 bg-primary px-6 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add New Staff
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Staff",
            value: staff.length,
            icon: Users,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-500/10",
          },
          {
            label: "Doctors",
            value: staff.filter((s) => s.role === Role.DOCTOR).length,
            icon: Stethoscope,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-purple-500/10",
          },
          {
            label: "Active Now",
            value: staff.filter((s) => s.status === "Active").length,
            icon: UserCheck,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
          },
          {
            label: "Support Staff",
            value: staff.filter((s) => [Role.RECEPTIONIST, Role.PHARMACIST, Role.NURSE].includes(s.role as Role)).length,
            icon: UserCog,
            color: "text-orange-600 dark:text-orange-400",
            bg: "bg-orange-50 dark:bg-orange-500/10",
          },
        ].map((stat, index) => (
          <Card
            key={index}
            className="border-none bg-white shadow-sm ring-1 ring-neutral-200 transition-shadow hover:shadow-md dark:bg-neutral-900 dark:ring-neutral-800"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-3xl font-black">{stat.value}</p>
                </div>
                <div className={cn("rounded-2xl p-3", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border-none bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
        <div className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-none bg-white pl-10 transition-all ring-1 ring-neutral-200 focus-visible:ring-primary/30 dark:bg-neutral-900 dark:ring-neutral-800"
              />
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
            <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900 sm:w-auto sm:flex-nowrap">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-8 w-full border-none bg-transparent shadow-none focus:ring-0 sm:w-[140px]">
                  <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value={Role.DOCTOR}>Doctors</SelectItem>
                  <SelectItem value={Role.CLINIC_ADMIN}>Admins</SelectItem>
                  <SelectItem value={Role.RECEPTIONIST}>Reception</SelectItem>
                  <SelectItem value={Role.PHARMACIST}>Pharmacy</SelectItem>
                  <SelectItem value={Role.NURSE}>Nurse</SelectItem>
                  <SelectItem value={Role.THERAPIST}>Therapist</SelectItem>
                  <SelectItem value={Role.LAB_TECHNICIAN}>Lab Tech</SelectItem>
                  <SelectItem value={Role.COUNSELOR}>Counselor</SelectItem>
                  <SelectItem value={Role.FINANCE_BILLING}>Finance</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden h-4 w-px bg-neutral-300 sm:block dark:bg-neutral-700" />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-full border-none bg-transparent shadow-none focus:ring-0 sm:w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredStaff}
        emptyMessage="No staff matching your search"
        pageSize={8}
        toolbar={
          <div className="px-1 text-sm text-muted-foreground">
            Showing {filteredStaff.length} of {staff.length} staff
          </div>
        }
      />

      {assignModalStaff && (
        <AssignRoleModal
          open={!!assignModalStaff}
          onOpenChange={(open) => !open && setAssignModalStaff(null)}
          staffMember={assignModalStaff}
          currentUserRole={Role.CLINIC_ADMIN}
          clinicId={clinicId || undefined}
          onSuccess={() => refetch?.()}
        />
      )}

      <AddStaffModal
        open={isAddStaffModalOpen}
        onOpenChange={setIsAddStaffModalOpen}
        onSuccess={() => refetch?.()}
      />
    </div>
  );
}
