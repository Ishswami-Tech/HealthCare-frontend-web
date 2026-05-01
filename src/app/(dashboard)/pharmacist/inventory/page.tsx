"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Role } from "@/types/auth.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/hooks/auth/useAuth";
import { useInventory } from "@/hooks/query/usePharmacy";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateInIST } from "@/lib/utils/date-time";
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
  useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Clinic context
  const { clinicId } = useClinicContext();

  // Fetch real inventory data
  const { data: inventoryData = [], isPending: inventoryPending } = useInventory(clinicId || "", {
    limit: 100,
  });

  // Transform inventory data
  const inventoryItems = (inventoryData as any[]).map((item: any) => ({
    id: item.id || item.medicineId,
    name: item.name || item.medicineName,
    category: item.category || item.medicineCategory || "General",
    type: item.type || item.medicineType || "OTHER",
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

  const inventoryColumns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Medicine",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">ID: {row.original.id}</span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.type === "AYURVEDIC"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-800"
            }
          >
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-1">
              <span className="font-semibold">
                {item.currentStock} {item.unit}
              </span>
              <div className="h-2 rounded-full bg-muted overflow-hidden dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${
                    item.status === "critical"
                      ? "bg-red-500"
                      : item.status === "low"
                        ? "bg-amber-500"
                        : item.status === "adequate"
                          ? "bg-blue-500"
                          : "bg-green-500"
                  }`}
                  style={{ width: `${getStockPercentage(item.currentStock, item.maxStock)}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "range",
        header: "Stock Range",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            <div>Min: {row.original.minStock}</div>
            <div>Max: {row.original.maxStock}</div>
            <div>Cost: ₹{row.original.costPerUnit}/{row.original.unit}</div>
          </div>
        ),
      },
      {
        accessorKey: "expiryDate",
        header: "Expiry",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className={isExpiringSoon(row.original.expiryDate) ? "font-semibold text-red-600 dark:text-red-300" : "text-foreground"}>
              {formatDateInIST(row.original.expiryDate)}
            </span>
            {isExpiringSoon(row.original.expiryDate) && (
              <span className="text-xs text-red-600 dark:text-red-300">Expiring soon</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.supplier}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={getStatusColor(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              View
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Edit className="w-3 h-3" />
              Update
            </Button>
            {(row.original.status === "critical" || row.original.status === "low") && (
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Reorder
              </Button>
            )}
          </div>
        ),
      },
    ],
    [getStockPercentage, getStatusColor, isExpiringSoon]
  );


  // Calculate summary stats
  const totalItems = inventoryItems.length;
  const lowStockItems = inventoryItems.filter((item: any) => item.status === 'low' || item.status === 'critical').length;
  const expiringItems = inventoryItems.filter((item: any) => isExpiringSoon(item.expiryDate)).length;
  const totalValue = inventoryItems.reduce((sum: number, item: any) => sum + (item.currentStock * item.costPerUnit), 0);
  const lowStockWatchlist = inventoryItems
    .filter((item: any) => item.status === "low" || item.status === "critical")
    .slice(0, 5);
  const expiringWatchlist = inventoryItems
    .filter((item: any) => isExpiringSoon(item.expiryDate))
    .slice(0, 5);


  // Filter inventory items
  const filteredInventory = inventoryItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesType = !filterType || item.type === filterType;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  // Show loading state
  if (inventoryPending) {
    return (
      
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading inventory...</p>
            </div>
          </div>
      
    );
  }

  return (
    
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Inventory Management</h1>
              <p className="text-gray-600">Monitor and manage medicine inventory</p>
            </div>
            <div className="flex items-center gap-2">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-yellow-200/80 dark:border-yellow-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Low stock watchlist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lowStockWatchlist.length > 0 ? (
                  lowStockWatchlist.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.currentStock} / {item.minStock} {item.unit}
                        </div>
                      </div>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No low stock medicines right now.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-red-200/80 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-red-600" />
                  Expiry watchlist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {expiringWatchlist.length > 0 ? (
                  expiringWatchlist.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Expiry: {formatDateInIST(item.expiryDate)}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-red-200 text-red-700">
                        {isExpiringSoon(item.expiryDate) ? "Expiring soon" : "Safe"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No expiring medicines in the next 90 days.</p>
                )}
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
                <Select
                  value={filterType || "all"}
                  onValueChange={(value) => setFilterType(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="AYURVEDIC">Ayurvedic</SelectItem>
                    <SelectItem value="HERBAL">Herbal</SelectItem>
                    <SelectItem value="CLASSICAL">Classical</SelectItem>
                    <SelectItem value="PROPRIETARY">Proprietary</SelectItem>
                    <SelectItem value="SIDDHA">Siddha</SelectItem>
                    <SelectItem value="UNANI">Unani</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterCategory || "all"}
                  onValueChange={(value) => setFilterCategory(value === "all" ? "" : value)}
                >
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
                <Select
                  value={filterStatus || "all"}
                  onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}
                >
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

          {/* Inventory Table */}
          <Card>
            <CardContent className="p-4">
              <DataTable
                columns={inventoryColumns}
                data={filteredInventory}
                pageSize={10}
                emptyMessage="No inventory items found."
              />
            </CardContent>
          </Card>
        </div>
    
  );
}
