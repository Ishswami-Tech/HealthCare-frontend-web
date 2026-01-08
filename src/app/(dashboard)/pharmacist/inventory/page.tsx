"use client";

import React, { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRoutesByRole } from "@/lib/config/config";
import { useAuth } from "@/hooks/useAuth";
import { useInventory, useMedicines } from "@/hooks/usePharmacy";
import { useClinicContext } from "@/hooks/useClinic";
import { WebSocketStatusIndicator } from "@/components/websocket/WebSocketErrorBoundary";
import { useWebSocketQuerySync } from "@/hooks/useRealTimeQueries";
import { 
  Package,
  AlertTriangle,
  Search,
  Plus,
  Edit,
  Eye,
  Calendar,
  DollarSign,
  BarChart3
} from "lucide-react";

export default function InventoryPage() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Clinic context
  const { clinicId } = useClinicContext();

  // Fetch real inventory data
  const { data: inventoryData = [], isLoading: inventoryLoading } = useInventory(clinicId || "", {
    search: searchTerm,
    limit: 100,
  });

  // Transform inventory data
  const inventoryItems = inventoryData.map((item: any) => ({
    id: item.id || item.medicineId,
    name: item.name || item.medicineName,
    category: item.category || item.medicineCategory || "General",
    currentStock: item.currentStock || item.quantity || 0,
    minStock: item.minStock || item.minThreshold || 10,
    maxStock: item.maxStock || item.maxThreshold || 100,
    unit: item.unit || "units",
    costPerUnit: item.costPerUnit || item.price || 0,
    expiryDate: item.expiryDate,
    supplier: item.supplier || item.supplierName || "Unknown",
    lastRestocked: item.lastRestocked || item.updatedAt,
    status: item.currentStock < (item.minStock || item.minThreshold) 
      ? (item.currentStock < (item.minStock || item.minThreshold) * 0.5 ? "critical" : "low")
      : "adequate",
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'adequate': return 'bg-blue-100 text-blue-800';
      case 'good': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90; // Expiring within 90 days
  };

  const InventoryCard = ({ item }: { item: any }) => {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <Badge variant="outline">{item.category}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">ID: {item.id}</p>
              <p className="text-sm text-gray-600">Supplier: {item.supplier}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(item.status)}>
                {item.status}
              </Badge>
              {isExpiringSoon(item.expiryDate) && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Expiring Soon
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Current Stock</p>
              <p className="text-xl font-bold">
                {item.currentStock} {item.unit}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className={`h-2 rounded-full ${
                    item.status === 'critical' ? 'bg-red-500' :
                    item.status === 'low' ? 'bg-yellow-500' :
                    item.status === 'adequate' ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${getStockPercentage(item.currentStock, item.maxStock)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock Range</p>
              <p className="text-sm">
                Min: {item.minStock} • Max: {item.maxStock} {item.unit}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Cost: ₹{item.costPerUnit}/{item.unit}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-600">Expiry Date</p>
                <p className={isExpiringSoon(item.expiryDate) ? 'text-red-600 font-medium' : ''}>
                  {new Date(item.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-600">Last Restocked</p>
                <p>{new Date(item.lastRestocked).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              View Details
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Edit className="w-3 h-3" />
              Update Stock
            </Button>
            {(item.status === 'critical' || item.status === 'low') && (
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Reorder
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate summary stats
  const totalItems = inventoryItems.length;
  const lowStockItems = inventoryItems.filter(item => item.status === 'low' || item.status === 'critical').length;
  const expiringItems = inventoryItems.filter(item => isExpiringSoon(item.expiryDate)).length;
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);

  const sidebarLinks = getRoutesByRole(Role.PHARMACIST).map((route) => ({
    ...route,
    href: route.path,
  }));

  // Filter inventory items
  const filteredInventory = inventoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Show loading state
  if (inventoryLoading) {
    return (
      <DashboardLayout
        title="Inventory Management"
        allowedRole={Role.PHARMACIST}
      >
        <GlobalSidebar
          links={sidebarLinks}
          user={{
            name: user?.name || `${user?.firstName} ${user?.lastName}` || "Pharmacist",
            ...(user?.profilePicture && { avatarUrl: user.profilePicture }),
          }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading inventory...</p>
            </div>
          </div>
        </GlobalSidebar>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Inventory Management"
      allowedRole={Role.PHARMACIST}
    >
      <GlobalSidebar
        links={sidebarLinks}
        user={{
          name: user?.name || `${user?.firstName} ${user?.lastName}` || "Pharmacist",
          ...(user?.profilePicture && { avatarUrl: user.profilePicture }),
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Inventory Management</h1>
              <p className="text-gray-600">Monitor and manage medicine inventory</p>
            </div>
            <div className="flex items-center gap-2">
              <WebSocketStatusIndicator />
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Reports
              </Button>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Medicine
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Active medicines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Need restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiringItems}</div>
            <p className="text-xs text-muted-foreground">
              Within 90 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current inventory
            </p>
          </CardContent>
        </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search medicines..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="churna">Churna</SelectItem>
                    <SelectItem value="capsules">Capsules</SelectItem>
                    <SelectItem value="tablets">Tablets</SelectItem>
                    <SelectItem value="ghrita">Ghrita</SelectItem>
                    <SelectItem value="avaleha">Avaleha</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="adequate">Adequate</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInventory.map((item) => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}
