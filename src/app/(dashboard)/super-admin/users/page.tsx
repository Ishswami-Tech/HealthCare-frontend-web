"use client";

import React, { useState } from "react";
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
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
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
  Filter,
  Mail,
  Phone,
} from "lucide-react";

export default function SuperAdminUsers() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock user data - in real app, fetch with server action
  const users = [
    {
      id: "1",
      name: "Dr. Rajesh Kumar",
      email: "rajesh.kumar@ayurvedacenter.com",
      phone: "+91 9876543210",
      role: Role.DOCTOR,
      status: "Active",
      clinic: "Ayurveda Center Mumbai",
      lastLogin: "2024-01-15T10:30:00Z",
      createdAt: "2023-06-15T00:00:00Z",
    },
    {
      id: "2",
      name: "Sarah Wilson",
      email: "sarah.wilson@wellnessclinic.com",
      phone: "+91 9876543211",
      role: Role.CLINIC_ADMIN,
      status: "Active",
      clinic: "Wellness Clinic Delhi",
      lastLogin: "2024-01-14T15:45:00Z",
      createdAt: "2023-05-20T00:00:00Z",
    },
    {
      id: "3",
      name: "Priya Sharma",
      email: "priya.sharma@patient.com",
      phone: "+91 9876543212",
      role: Role.PATIENT,
      status: "Active",
      clinic: "Ayurveda Center Mumbai",
      lastLogin: "2024-01-13T09:15:00Z",
      createdAt: "2023-08-10T00:00:00Z",
    },
    {
      id: "4",
      name: "Amit Singh",
      email: "amit.singh@holistichealth.com",
      phone: "+91 9876543213",
      role: Role.RECEPTIONIST,
      status: "Inactive",
      clinic: "Holistic Health Bangalore",
      lastLogin: "2024-01-10T14:20:00Z",
      createdAt: "2023-09-05T00:00:00Z",
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

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

  const sidebarLinks = getRoutesByRole(Role.SUPER_ADMIN).map((route) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("clinics") ? (
      <Building2 className="w-5 h-5" />
    ) : route.path.includes("users") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("settings") ? (
      <Settings className="w-5 h-5" />
    ) : (
      <Activity className="w-5 h-5" />
    ),
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/auth/login",
    path: "/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  return (
    <DashboardLayout title="User Management" allowedRole={Role.SUPER_ADMIN}>
      <GlobalSidebar
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
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New User
            </Button>
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
                  {users.filter((u) => u.role === Role.DOCTOR).length}
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
                  {users.filter((u) => u.role === Role.CLINIC_ADMIN).length}
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
                  {users.filter((u) => u.role === Role.PATIENT).length}
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
                  {users.filter((u) => u.status === "Active").length}
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
            {filteredUsers.map((user) => (
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
      </GlobalSidebar>
    </DashboardLayout>
  );
}
