"use client";

import { useState, useMemo } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
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
import { getRoutesByRole } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUsers } from "@/hooks/query/useUsers";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { WebSocketStatusIndicator } from "@/components/websocket/WebSocketErrorBoundary";
import { Loader2 } from "lucide-react";
import {
  Building2,
  Users,
  Settings,
  Activity,
  LogOut,
  Plus,
  Search,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Mail,
  Phone,
} from "lucide-react";

export default function SuperAdminUsers() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch real user data
  const { data: usersData, isPending: isLoadingUsers } = useUsers();

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  // Transform users data
  const users = useMemo(() => {
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
      name:
        user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      phone: user.phone,
      role: user.role || user.roles?.[0]?.name || "UNKNOWN",
      status: user.isActive !== false ? "Active" : "Inactive",
      clinic: user.clinic?.name || "N/A",
      lastLogin: user.lastLogin || user.lastLoginAt,
      createdAt: user.createdAt,
    }));
  }, [usersData]);

  const filteredUsers = useMemo(() => {
    return users.filter((user: any) => {
      const matchesSearch =
        !searchTerm ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const statusKey = user.status?.toLowerCase() || "";
      const matchesStatus =
        statusFilter === "all" || statusKey === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return "bg-red-100 text-red-800";
      case Role.CLINIC_ADMIN:
        return "bg-purple-100 text-purple-800";
      case Role.DOCTOR:
        return "bg-blue-100 text-blue-800";
      case Role.RECEPTIONIST:
        return "bg-green-100 text-green-800";
      case Role.PATIENT:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const sidebarLinks = getRoutesByRole(Role.SUPER_ADMIN).map((route) => {
    let icon = <Activity className="w-5 h-5" />;
    if (route.path.includes("dashboard")) {
      icon = <Activity className="w-5 h-5" />;
    } else if (route.path.includes("clinics")) {
      icon = <Building2 className="w-5 h-5" />;
    } else if (route.path.includes("users")) {
      icon = <Users className="w-5 h-5" />;
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
    href: "/auth/login",
    path: "/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  if (isLoadingUsers) {
    return (
      <DashboardLayout title="User Management" allowedRole={Role.SUPER_ADMIN}>
        <Sidebar
          links={sidebarLinks}
          user={{
            name:
              user?.name ||
              `${user?.firstName} ${user?.lastName}` ||
              "Super Admin",
            avatarUrl: (user as any)?.profilePicture || "/avatar.png",
          }}
        >
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </Sidebar>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Management" allowedRole={Role.SUPER_ADMIN}>
      <Sidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Super Admin",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">User Management</h1>
            <div className="flex items-center gap-2">
              <WebSocketStatusIndicator />
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New User
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  All roles included
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Doctors</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {users.filter((u: any) => u.role === Role.DOCTOR).length}
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
                  {users.filter((u: any) => u.role === Role.CLINIC_ADMIN).length}
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
                  {users.filter((u: any) => u.role === Role.PATIENT).length}
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
                  {users.filter((u: any) => u.status === "Active").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search and Filter Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by name or email..."
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
                    <SelectItem value={Role.CLINIC_ADMIN}>
                      Clinic Admins
                    </SelectItem>
                    <SelectItem value={Role.RECEPTIONIST}>
                      Receptionists
                    </SelectItem>
                    <SelectItem value={Role.PATIENT}>Patients</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
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

          {/* Users List */}
          <div className="grid gap-4">
            {filteredUsers.map((user: any) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-800 font-semibold text-lg">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{user.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.replace("_", " ")}
                        </Badge>
                        <div className="mt-1">
                          <Badge
                            variant={
                              user.status === "Active" ? "default" : "secondary"
                            }
                            className={
                              user.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                          >
                            {user.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {user.clinic}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last login:{" "}
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </div>
                      </div>

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
                            user.status === "Active"
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {user.status === "Active" ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
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
