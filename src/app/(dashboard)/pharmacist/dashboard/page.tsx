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
// TODO: Create pharmacy server actions
// import { usePrescriptions } from "@/hooks/usePrescriptions";
// import { useInventory } from "@/hooks/useInventory";
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

  // TODO: Fetch real data using existing hooks and server actions when available
  // const { data: profile } = useQueryData(
  //   ["user-profile"],
  //   () => getUserProfile(),
  //   { enabled: !!session?.user?.id }
  // );

  // TODO: Create pharmacy-specific hooks when server actions are ready
  // const { data: prescriptions, isLoading: prescriptionsLoading } = usePrescriptions();
  // const { data: inventory, isLoading: inventoryLoading } = useInventory();

  // Mock data for demonstration (replace with real data when hooks are available)
  const stats = {
    pendingPrescriptions: 12, // TODO: prescriptions?.filter(p => p.status === 'PENDING')?.length || 12
    preparedPrescriptions: 8, // TODO: prescriptions?.filter(p => p.status === 'PREPARED')?.length || 8
    lowStockItems: 5, // TODO: inventory?.filter(i => i.quantity < i.minThreshold)?.length || 5
    totalHandovers: 156,
    monthlyDispensed: 1240,
    inventoryValue: 85000,
    expiringItems: 3,
    averagePreparationTime: 15,
  };

  const pendingPrescriptions = [
    {
      id: "RX001",
      patientName: "Rajesh Kumar",
      doctorName: "Dr. Priya Sharma",
      prescribedAt: "10:30 AM",
      medicines: ["Triphala Churna", "Ashwagandha Capsules", "Brahmi Ghrita"],
      status: "pending",
      priority: "normal",
    },
    {
      id: "RX002",
      patientName: "Aarti Singh",
      doctorName: "Dr. Amit Patel",
      prescribedAt: "11:15 AM",
      medicines: ["Chyawanprash", "Arjuna Tablets"],
      status: "pending",
      priority: "urgent",
    },
    {
      id: "RX003",
      patientName: "Vikram Gupta",
      doctorName: "Dr. Ravi Mehta",
      prescribedAt: "12:00 PM",
      medicines: ["Saraswatarishta", "Medhya Rasayana"],
      status: "preparing",
      priority: "normal",
    },
  ];

  const lowStockItems = [
    { name: "Triphala Churna", currentStock: 5, minStock: 20, unit: "kg" },
    {
      name: "Ashwagandha Capsules",
      currentStock: 50,
      minStock: 100,
      unit: "bottles",
    },
    { name: "Brahmi Ghrita", currentStock: 2, minStock: 10, unit: "bottles" },
    { name: "Chyawanprash", currentStock: 8, minStock: 25, unit: "jars" },
    { name: "Arjuna Tablets", currentStock: 15, minStock: 50, unit: "bottles" },
  ];

  const recentHandovers = [
    {
      id: "RX098",
      patientName: "Sunita Devi",
      handedOverAt: "2:30 PM",
      medicines: 3,
      status: "completed",
    },
    {
      id: "RX097",
      patientName: "Manoj Tiwari",
      handedOverAt: "2:15 PM",
      medicines: 2,
      status: "completed",
    },
    {
      id: "RX096",
      patientName: "Kavita Sharma",
      handedOverAt: "1:45 PM",
      medicines: 4,
      status: "completed",
    },
  ];

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
