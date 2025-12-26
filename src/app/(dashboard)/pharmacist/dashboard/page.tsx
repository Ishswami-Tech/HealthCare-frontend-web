"use client";

import React from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import {
  usePrescriptions,
  useInventory,
  usePharmacyStats,
} from "@/hooks/usePharmacy";
import { useClinicContext } from "@/hooks/useClinic";
import { WebSocketStatusIndicator } from "@/components/websocket/WebSocketErrorBoundary";
import { useWebSocketQuerySync } from "@/hooks/useRealTimeQueries";
import {
  Activity,
  Pill,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  LogOut,
  Plus,
  Search,
  Eye,
  Check,
} from "lucide-react";

export default function PharmacistDashboard() {
  const { session } = useAuth();
  const user = session?.user;

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Clinic context
  const { clinicId } = useClinicContext();

  // Fetch real data using pharmacy hooks
  const { data: prescriptions = [], isLoading: prescriptionsLoading } =
    usePrescriptions(clinicId || "", {
      status: undefined, // Get all prescriptions
      limit: 100,
    });

  const { data: inventory = [], isLoading: inventoryLoading } = useInventory(
    clinicId || "",
    {
      limit: 100,
    }
  );

  const { data: pharmacyStats } = usePharmacyStats(clinicId || "");

  // Calculate real stats from fetched data
  const stats = {
    pendingPrescriptions:
      prescriptions.filter(
        (p: any) => p.status === "PENDING" || p.status === "pending"
      )?.length || 0,
    preparedPrescriptions:
      prescriptions.filter(
        (p: any) => p.status === "PREPARED" || p.status === "prepared"
      )?.length || 0,
    lowStockItems:
      inventory.filter((i: any) => i.currentStock < i.minStock)?.length || 0,
    totalHandovers: pharmacyStats?.totalHandovers || 0,
    monthlyDispensed: pharmacyStats?.monthlyDispensed || 0,
    inventoryValue:
      pharmacyStats?.inventoryValue ||
      inventory.reduce(
        (sum: number, item: any) => sum + item.costPerUnit * item.currentStock,
        0
      ),
    expiringItems:
      inventory.filter((i: any) => {
        if (!i.expiryDate) return false;
        const expiry = new Date(i.expiryDate);
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);
        return expiry <= in30Days;
      })?.length || 0,
    averagePreparationTime: pharmacyStats?.averagePreparationTime || 15,
  };

  // Use real prescriptions data
  const pendingPrescriptions = prescriptions
    .filter(
      (p: any) => (p.status === "PENDING" || p.status === "pending") && p.id
    )
    .slice(0, 10)
    .map((p: any) => ({
      id: p.id,
      patientName: p.patient?.name || p.patientName || "Unknown Patient",
      doctorName: p.doctor?.name || p.doctorName || "Unknown Doctor",
      prescribedAt: p.prescribedAt || p.createdAt || new Date().toISOString(),
      medicines:
        p.medicines?.map((m: any) => m.name || m.medicineName) ||
        p.medicines ||
        [],
      status: p.status?.toLowerCase() || "pending",
      priority: p.priority?.toLowerCase() || "normal",
    }));

  // Use real inventory data
  const lowStockItems = inventory
    .filter((i: any) => i.currentStock < i.minStock)
    .slice(0, 10)
    .map((i: any) => ({
      name: i.name || i.medicineName,
      currentStock: i.currentStock || i.quantity,
      minStock: i.minStock || i.minThreshold,
      unit: i.unit || "units",
    }));

  // Recent handovers from completed prescriptions
  const recentHandovers = useMemo(() => {
    return prescriptions
      .filter((p: any) => p.status === "COMPLETED" || p.status === "completed")
      .slice(0, 5)
      .map((p: any) => ({
        id: p.id,
        patientName: p.patient?.name || p.patientName || "Unknown Patient",
        handedOverAt: p.dispensedAt
          ? new Date(p.dispensedAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A",
        medicines: p.medicines?.length || 0,
        status: "completed",
      }));
  }, [prescriptions]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "prepared":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const sidebarLinks = getRoutesByRole(Role.PHARMACIST).map((route) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("prescriptions") ? (
      <Pill className="w-5 h-5" />
    ) : route.path.includes("inventory") ? (
      <Package className="w-5 h-5" />
    ) : (
      <Users className="w-5 h-5" />
    ),
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/auth/login",
    path: "/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  return (
    <DashboardLayout title="Pharmacist Dashboard" allowedRole={Role.PHARMACIST}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Pharmacist",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
              <p className="text-gray-600">
                Manage prescriptions and inventory
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Medicines
              </Button>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Stock
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Prescriptions
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendingPrescriptions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting preparation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Prepared Today
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.preparedPrescriptions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for handover
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Low Stock Items
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.lowStockItems}
                </div>
                <p className="text-xs text-muted-foreground">Need restocking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Dispensed
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.monthlyDispensed}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Prescriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Pending Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingPrescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">
                            {prescription.patientName}
                          </h4>
                          <Badge
                            className={getPriorityColor(prescription.priority)}
                          >
                            {prescription.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {prescription.doctorName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {prescription.medicines.length} medicines •{" "}
                          {prescription.prescribedAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(prescription.status)}>
                          {prescription.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3" />
                          </Button>
                          {prescription.status === "pending" && (
                            <Button size="sm">
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-red-800">
                          {item.name}
                        </h4>
                        <p className="text-sm text-red-600">
                          Current: {item.currentStock} {item.unit} • Min:{" "}
                          {item.minStock} {item.unit}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300"
                      >
                        Reorder
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Handovers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Recent Handovers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentHandovers.map((handover) => (
                  <div
                    key={handover.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{handover.patientName}</h4>
                        <p className="text-sm text-gray-600">
                          {handover.medicines} medicines •{" "}
                          {handover.handedOverAt}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(handover.status)}>
                      {handover.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <Pill className="w-6 h-6 text-blue-600 mb-2" />
                  <h3 className="font-medium">View All Prescriptions</h3>
                  <p className="text-xs text-gray-600">
                    Manage prescription queue
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <Package className="w-6 h-6 text-green-600 mb-2" />
                  <h3 className="font-medium">Inventory Management</h3>
                  <p className="text-xs text-gray-600">Check stock levels</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <AlertTriangle className="w-6 h-6 text-orange-600 mb-2" />
                  <h3 className="font-medium">Expiry Alerts</h3>
                  <p className="text-xs text-gray-600">
                    Check expiring medicines
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
                  <h3 className="font-medium">Reports</h3>
                  <p className="text-xs text-gray-600">
                    View pharmacy analytics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}
