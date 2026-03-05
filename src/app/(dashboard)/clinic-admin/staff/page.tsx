"use client";

import { useState, useMemo, useEffect } from "react";
import { Role } from "@/types/auth.types";
import { useLayoutStore } from "@/stores/layout.store";
import { AssignRoleModal } from "@/components/clinic/AssignRoleModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinic } from "@/hooks/query/useClinics";
import { useUsersByClinic } from "@/hooks/query/useUsers";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { updateUser } from "@/lib/actions/users.server";
import { showSuccessToast, showErrorToast } from "@/hooks/utils/use-toast";
import { cn } from "@/lib/utils";
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  MoreVertical,
  Mail,
  Phone,
  Stethoscope,
  UserCog,
  Loader2,
  LayoutGrid,
  List,
  Filter,
  ShieldCheck,
  Briefcase,
  MapPin,
} from "lucide-react";

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
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [assignModalStaff, setAssignModalStaff] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  // Fetch real staff data
  const { data: staffData, isPending: isLoadingStaff, refetch } = useUsersByClinic(
    clinicId || ""
  );

  // Sync with WebSocket
  useWebSocketQuerySync();

  const handleToggleStatus = async (staffId: string, currentStatus: string) => {
    try {
      await updateUser(staffId, { isActive: currentStatus !== "Active" });
      showSuccessToast(`Staff member ${currentStatus === "Active" ? "deactivated" : "reactivated"} successfully!`, { id: 'toggle-status' });
      refetch?.();
    } catch(err) {
      showErrorToast("Failed to update staff status.", { id: 'toggle-status' });
      console.error(err);
    }
  };

  // Transform staff data
  const staff = useMemo(() => {
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
    }));
  }, [staffData]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member: any) => {
      const matchesSearch =
        !searchTerm ||
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.specialization.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || member.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, searchTerm, roleFilter, statusFilter]);

  const getRoleBadge = (role: Role | string) => {
    const r = role as Role;
    switch (r) {
      case Role.DOCTOR:
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 hover:bg-blue-500/20">Doctor</Badge>;
      case Role.CLINIC_ADMIN:
        return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/50 hover:bg-purple-500/20">Admin</Badge>;
      case Role.RECEPTIONIST:
        return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 hover:bg-emerald-500/20">Reception</Badge>;
      case Role.PHARMACIST:
        return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200/50 hover:bg-orange-500/20">Pharmacy</Badge>;
      case Role.NURSE:
        return <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200/50 hover:bg-teal-500/20">Nurse</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{role.toLowerCase().replace('_', ' ')}</Badge>;
    }
  };

  if (isLoadingStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading staff database...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-transparent min-h-screen text-foreground">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Clinic Staff Roster</h1>
          </div>
          <p className="text-muted-foreground font-medium">Manage healthcare professionals and administrative staff for <span className="text-primary font-bold">{clinicName || "your clinic"}</span></p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="hidden sm:block">
            <WebSocketStatusIndicator />
          </div>
          <Button className="bg-primary w-full sm:w-auto hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 px-6">
            <Plus className="w-4 h-4" />
            Add New Staff
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Staff", value: staff.length, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Doctors", value: staff.filter((s: any) => s.role === Role.DOCTOR).length, icon: Stethoscope, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
          { label: "Active Now", value: staff.filter((s: any) => s.status === "Active").length, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Support Staff", value: staff.filter((s: any) => [Role.RECEPTIONIST, Role.PHARMACIST, Role.NURSE].includes(s.role as Role)).length, icon: UserCog, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white dark:bg-neutral-900 hover:shadow-md transition-shadow ring-1 ring-neutral-200 dark:ring-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black mt-1">{stat.value}</p>
                </div>
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="rounded-xl border-none shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
        <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search staff name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 focus-visible:ring-primary/30 transition-all border-none"
              />
            </div>
            <div className="hidden sm:flex border border-neutral-200 dark:border-neutral-800 rounded-lg p-1 bg-neutral-100 dark:bg-neutral-900">
              <Button 
                variant={viewType === "grid" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewType("grid")}
                className="h-8 px-3"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewType === "list" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewType("list")}
                className="h-8 px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex flex-wrap sm:flex-nowrap items-center w-full sm:w-auto gap-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-lg">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[140px] border-none bg-transparent h-8 shadow-none focus:ring-0">
                  <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value={Role.DOCTOR}>Doctors</SelectItem>
                  <SelectItem value={Role.CLINIC_ADMIN}>Admins</SelectItem>
                  <SelectItem value={Role.RECEPTIONIST}>Reception</SelectItem>
                  <SelectItem value={Role.PHARMACIST}>Pharmacy</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden sm:block w-px h-4 bg-neutral-300 dark:bg-neutral-700" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[120px] border-none bg-transparent h-8 shadow-none focus:ring-0">
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

      <div className="mt-8">
        {viewType === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStaff.map((member: any) => (
                <Card key={member.id} className="group flex flex-col overflow-hidden border-neutral-200 dark:border-neutral-800 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-white dark:bg-neutral-900/40">
                  <div className="relative shrink-0 h-2 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                      <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary/10 to-blue-500/10 flex items-center justify-center border border-primary/5">
                        <span className="text-2xl font-black text-primary">{member.name.charAt(0)}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setAssignModalStaff(member)} className="gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Update Role & Access
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Briefcase className="w-4 h-4" />
                            View Profile Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(member.id, member.status)}
                            className={cn("gap-2", member.status === "Active" ? "text-destructive focus:bg-destructive/10 focus:text-destructive dark:text-red-400 dark:focus:bg-red-500/10" : "text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-700")}
                          >
                            {member.status === "Active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            {member.status === "Active" ? "Deactivate Account" : "Reactivate Account"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{member.name}</h3>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(member.role)}
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                          member.status === "Active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400"
                        )}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 mt-6 border-t border-neutral-100 dark:border-neutral-800/60">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                      <span>{member.specialization}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{member.location}</span>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white dark:bg-neutral-900 rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-6 py-4">Role & Dept</th>
                    <th className="px-6 py-4">Specialization</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredStaff.map((member: any) => (
                    <tr key={member.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{member.name}</p>
                            <p className="text-xs text-muted-foreground">ID: #{member.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getRoleBadge(member.role)}
                          <p className="text-[10px] font-medium text-muted-foreground">{member.department}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium">{member.specialization}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={member.status === "Active" ? "outline" : "secondary"} className={cn(
                          "rounded-full border-none",
                          member.status === "Active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400"
                        )}>
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{member.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setAssignModalStaff(member)} className="gap-2">
                              <ShieldCheck className="w-4 h-4" />
                              Update Role & Access
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Briefcase className="w-4 h-4" />
                              View Profile Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(member.id, member.status)}
                              className={cn("gap-2", member.status === "Active" ? "text-destructive focus:bg-destructive/10 focus:text-destructive dark:text-red-400 dark:focus:bg-red-500/10" : "text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-700")}
                            >
                              {member.status === "Active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              {member.status === "Active" ? "Deactivate Account" : "Reactivate Account"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredStaff.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-neutral-400" />
              </div>
              <h3 className="text-xl font-bold">No staff matching your search</h3>
              <p className="text-muted-foreground max-w-xs mt-2">Adjust your filters or search terms to find the staff member you are looking for.</p>
              <Button variant="link" onClick={() => { setSearchTerm(""); setRoleFilter("all"); setStatusFilter("all"); }} className="mt-4">
                Clear all filters
              </Button>
            </div>
          )}
      </div>

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
    </div>
  );
}
