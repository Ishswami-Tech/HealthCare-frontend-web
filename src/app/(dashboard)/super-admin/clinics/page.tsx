"use client";

import React, { useState, useMemo } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { useClinics } from "@/hooks/useClinics";
import { WebSocketStatusIndicator } from "@/components/websocket/WebSocketErrorBoundary";
import { useWebSocketQuerySync } from "@/hooks/useRealTimeQueries";
import {
  Building2,
  Users,
  Settings,
  Activity,
  LogOut,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";

export default function SuperAdminClinics() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch real clinic data
  const { data: clinicsData, isLoading: isLoadingClinics } = useClinics();

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync(["clinics"]);

  // Transform clinics data
  const clinics = useMemo(() => {
    if (!clinicsData) return [];
    const clinicsArray = clinicsData.clinics || [];

    return clinicsArray.map((clinic: any) => ({
      id: clinic.id,
      name: clinic.name,
      address: clinic.address || clinic.location?.address || "N/A",
      phone: clinic.phone,
      email: clinic.email,
      status: clinic.isActive !== false ? "Active" : "Inactive",
      doctorsCount: clinic.doctorsCount || 0,
      patientsCount: clinic.patientsCount || 0,
      establishedDate: clinic.createdAt || clinic.establishedDate,
    }));
  }, [clinicsData]);

  const filteredClinics = useMemo(() => {
    return clinics.filter(
      (clinic: any) =>
        clinic.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clinic.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clinics, searchTerm]);

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

  if (isLoadingClinics) {
    return (
      <DashboardLayout title="Clinic Management" allowedRole={Role.SUPER_ADMIN}>
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
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </GlobalSidebar>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Clinic Management" allowedRole={Role.SUPER_ADMIN}>
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
            <h1 className="text-3xl font-bold">Clinic Management</h1>
            <div className="flex items-center gap-4">
              <WebSocketStatusIndicator />
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Clinic
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clinics
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clinics.length}</div>
                <p className="text-xs text-muted-foreground">
                  {clinics.filter((c: any) => c.status === "Active").length}{" "}
                  active,{" "}
                  {clinics.filter((c: any) => c.status !== "Active").length}{" "}
                  inactive
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Doctors
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clinics.reduce(
                    (sum: number, clinic: any) =>
                      sum + (clinic.doctorsCount || 0),
                    0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all clinics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Patients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clinics.reduce(
                    (sum: number, clinic: any) =>
                      sum + (clinic.patientsCount || 0),
                    0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active patient base
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Growth Rate
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+15%</div>
                <p className="text-xs text-muted-foreground">Monthly growth</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search Clinics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by clinic name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">Filter</Button>
              </div>
            </CardContent>
          </Card>

          {/* Clinics List */}
          <div className="grid gap-6">
            {filteredClinics.map((clinic: any) => (
              <Card key={clinic.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <Building2 className="w-6 h-6" />
                      {clinic.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          clinic.status === "Active" ? "default" : "secondary"
                        }
                        className={
                          clinic.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {clinic.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{clinic.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{clinic.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{clinic.email}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {clinic.doctorsCount}
                        </div>
                        <div className="text-sm text-gray-600">Doctors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {clinic.patientsCount}
                        </div>
                        <div className="text-sm text-gray-600">Patients</div>
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="text-sm text-gray-600">
                          Established:{" "}
                          {new Date(
                            clinic.establishedDate
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      View Staff
                    </Button>
                    <Button variant="outline" size="sm">
                      Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredClinics.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No clinics found</h3>
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
