"use client";

import React, { useState, useMemo } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getRoutesByRole } from "@/lib/config/config";
import { useAuth } from "@/hooks/useAuth";
import { useClinicContext } from "@/hooks/useClinic";
import { useUsersByClinic } from "@/hooks/useUsers";
import { WebSocketStatusIndicator } from "@/components/websocket/WebSocketErrorBoundary";
import { useWebSocketQuerySync } from "@/hooks/useRealTimeQueries";
import {
  Activity,
  Users,
  Calendar,
  Settings,
  LogOut,
  Plus,
  Search,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Mail,
  Phone,
  Stethoscope,
  UserCog,
  Loader2,
} from "lucide-react";

export default function ClinicAdminStaff() {
  const { session } = useAuth();
  const user = session?.user;
  const { clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch real staff data
  const { data: staffData, isPending: isLoadingStaff } = useUsersByClinic(
    clinicId || ""
  );

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  // Transform staff data
  const staff = useMemo(() => {
    if (!staffData) return [];
    const data = staffData as any;
    const users = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
      ? data.users
      : Array.isArray(data?.data)
      ? data.data
      : [];

    return users.map((user: any) => ({
      id: user.id,
      name:
        user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      phone: user.phone,
      role: user.role || user.roles?.[0]?.name || "UNKNOWN",
      status: user.isActive !== false ? "Active" : "Inactive",
      specialization:
        user.specialization || user.specializations?.[0] || "General",
      department: user.department || "General",
      joinDate: user.createdAt || user.joinedAt,
      experience: user.experience || "N/A",
      schedule: user.schedule || "Not set",
    }));
  }, [staffData]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member: any) => {
      const matchesSearch =
        !searchTerm ||
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      const statusKey = member.status?.toLowerCase().replace(" ", "_") || "";
      const matchesStatus =
        statusFilter === "all" || statusKey === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, searchTerm, roleFilter, statusFilter]);

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.DOCTOR:
        return "bg-blue-100 text-blue-800";
      case Role.RECEPTIONIST:
        return "bg-green-100 text-green-800";
      case Role.CLINIC_ADMIN:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800";
      case "Inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const sidebarLinks = getRoutesByRole(Role.CLINIC_ADMIN).map((route) => {
    let icon = <UserCheck className="w-5 h-5" />;
    if (route.path.includes("dashboard")) {
      icon = <Activity className="w-5 h-5" />;
    } else if (route.path.includes("staff")) {
      icon = <Users className="w-5 h-5" />;
    } else if (route.path.includes("schedule")) {
      icon = <Calendar className="w-5 h-5" />;
    } else if (route.path.includes("settings")) {
      icon = <Settings className="w-5 h-5" />;
    }
    return {
      ...route,
      href: route.path,
      icon,
    };
  });

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  if (isLoadingStaff) {
    return (
      <DashboardLayout title="Staff Management" allowedRole={Role.CLINIC_ADMIN}>
        <GlobalSidebar
          links={sidebarLinks}
          user={{
            name:
              user?.name ||
              `${user?.firstName} ${user?.lastName}` ||
              "Clinic Admin",
            avatarUrl: (user as any)?.profilePicture || "/avatar.png",
          }}
        >
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </GlobalSidebar>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Staff Management" allowedRole={Role.CLINIC_ADMIN}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Clinic Admin",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <div className="flex items-center gap-2">
              <WebSocketStatusIndicator />
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Staff
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Staff
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staff.length}</div>
                <p className="text-xs text-muted-foreground">All departments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Doctors</CardTitle>
                <Stethoscope className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {staff.filter((s) => s.role === Role.DOCTOR).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Support Staff
                </CardTitle>
                <UserCog className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {staff.filter((s) => s.role === Role.RECEPTIONIST).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Today
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {staff.filter((s) => s.status === "Active").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search and Filter Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by name, email, or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value={Role.DOCTOR}>Doctors</SelectItem>
                    <SelectItem value={Role.RECEPTIONIST}>
                      Receptionists
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Staff List */}
          <div className="grid gap-4">
            {filteredStaff.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-800 font-semibold text-xl">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{member.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleColor(member.role as Role)}>
                            {member.role?.replace("_", " ") || "Unknown"}
                          </Badge>
                          <Badge className={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                        </div>
                        {member.specialization && (
                          <p className="text-sm text-gray-600 font-medium">
                            {member.specialization}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {member.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{member.email}</span>
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={
                            member.status === "Active"
                              ? "text-yellow-600"
                              : "text-green-600"
                          }
                        >
                          {member.status === "Active" ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        {member.department && (
                          <div>
                            <strong>Department:</strong> {member.department}
                          </div>
                        )}
                        {member.experience && (
                          <div>
                            <strong>Experience:</strong> {member.experience}
                          </div>
                        )}
                        {member.schedule && (
                          <div>
                            <strong>Schedule:</strong> {member.schedule}
                          </div>
                        )}
                        {member.joinDate && (
                          <div>
                            <strong>Joined:</strong>{" "}
                            {new Date(member.joinDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStaff.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No staff found</h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria
                </p>
              </CardContent>
            </Card>
          )}

          {/* Department Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Stethoscope className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Ayurveda Department</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {staff.filter((s) => s.department === "Ayurveda").length}
                  </p>
                  <p className="text-sm text-gray-600">Specialists</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <UserCog className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Administration</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      staff.filter((s) => s.department === "Administration")
                        .length
                    }
                  </p>
                  <p className="text-sm text-gray-600">Support Staff</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Diagnosis</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {staff.filter((s) => s.department === "Diagnosis").length}
                  </p>
                  <p className="text-sm text-gray-600">Specialists</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}
