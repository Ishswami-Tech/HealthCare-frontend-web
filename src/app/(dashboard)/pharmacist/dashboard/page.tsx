"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  usePrescriptions,
  useInventory,
  usePharmacyStats,
  useMedicineDeskQueue,
} from "@/hooks/query/usePharmacy";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  Pill,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  Search,
  Eye,
  Check,
  Loader2,
} from "lucide-react";
import { getQueuePositionLabel, normalizeQueueEntry } from "@/lib/queue/queue-adapter";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";

export default function PharmacistDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const clinicId = user?.clinicId;

  const [searchTerm, setSearchTerm] = useState("");

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Fetch real data
  const { data: prescriptionsData = [], isPending: prescriptionsPending } =
    usePrescriptions(clinicId || "", { limit: 100 });

  const { data: inventoryData = [], isPending: inventoryPending } = 
    useInventory(clinicId || "", { limit: 100 });

  const { data: pharmacyStats } = usePharmacyStats(clinicId || "");
  const { data: medicineDeskQueue = [] } = useMedicineDeskQueue(clinicId || "", !!clinicId);

  const prescriptions = Array.isArray(prescriptionsData) ? prescriptionsData : (prescriptionsData as any)?.prescriptions || [];
  const inventory = Array.isArray(inventoryData) ? inventoryData : (inventoryData as any)?.inventory || [];

  // Stats calculation
  const stats = useMemo(() => {
    return {
      pendingPrescriptions: prescriptions.filter(
        (p: any) => String(p.status || "").toUpperCase() === "PENDING"
      ).length,
      awaitingPayment: prescriptions.filter((p: any) => {
        const status = String(p.status || "").toUpperCase();
        const paymentStatus = String(p.paymentStatus || "PENDING").toUpperCase();
        return status === "PENDING" && paymentStatus !== "PAID";
      }).length,
      dispensedToday: prescriptions.filter(
        (p: any) => ["FILLED", "DISPENSED", "COMPLETED"].includes(String(p.status || "").toUpperCase())
      ).length,
      lowStockItems: inventory.filter((i: any) => (i.currentStock || i.quantity) < (i.minStock || i.minThreshold)).length,
      monthlyDispensed: (pharmacyStats as any)?.monthlyDispensed || 0,
    };
  }, [prescriptions, inventory, pharmacyStats]);

  const processedQueue = useMemo(() => {
    const raw = (Array.isArray(medicineDeskQueue) ? medicineDeskQueue : [])
      .filter((p: any) => p?.id)
      .map((p: any) => {
        const entry = normalizeQueueEntry(p);
        return {
          id: entry.entryId,
          patientName: entry.patientName || "Unknown Patient",
          medicines: p.medicines || p.medicineNames || [],
          priority: p.priority || "normal",
          status: Boolean(entry.readyForHandover) || String(entry.paymentStatus).toUpperCase() === "PAID"
            ? "ready_to_dispense"
            : "awaiting_payment",
        };
      });
    
    if (!searchTerm) return raw;
    return raw.filter(item => 
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicineDeskQueue, searchTerm]);

  // Table Columns for Prescription Queue
  const prescriptionColumns: ColumnDef<any>[] = [
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("patientName")}</div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = (row.getValue("priority") as string || "normal").toLowerCase();
        const colors: Record<string, string> = {
          urgent: "bg-red-100 text-red-800",
          high: "bg-orange-100 text-orange-800",
          normal: "bg-blue-100 text-blue-800",
        };
        return (
          <Badge className={colors[priority] || "bg-slate-100"}>
            {priority.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "medicines",
      header: "Medicines",
      cell: ({ row }) => {
        const medicines = row.getValue("medicines") as string[];
        return <div className="text-xs text-muted-foreground">{Array.isArray(medicines) ? medicines.length : 0} items</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const isReady = status === "ready_to_dispense";
        return (
          <Badge variant={isReady ? "default" : "secondary"} className={isReady ? "bg-green-600" : "bg-blue-100 text-blue-800"}>
            {isReady ? "READY" : "AWAITING PAYMENT"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="icon" variant="outline" className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
          {row.getValue("status") === "ready_to_dispense" && (
            <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if ((prescriptionsPending || inventoryPending) && (prescriptions.length === 0 && inventory.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">Manage prescriptions and medical inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Search className="w-4 h-4" />
            Find Medicine
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingPrescriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">Prescriptions to fill</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.awaitingPayment}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting checkout</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dispensed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.dispensedToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Today's total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Action required</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyDispensed}</div>
            <p className="text-xs text-muted-foreground mt-1">Volume this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescription Queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              Prescription Queue
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patient..."
                className="pl-8 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={prescriptionColumns} 
              data={processedQueue} 
              pageSize={5}
              emptyMessage="No pending prescriptions in the queue"
            />
          </CardContent>
        </Card>

        {/* Low Stock & Quick Actions */}
        <div className="space-y-6">
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                Inventory Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.filter((i: any) => (i.currentStock || i.quantity) < (i.minStock || i.minThreshold)).slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-3 bg-red-50 rounded-md border border-red-100">
                    <div>
                      <p className="font-semibold text-red-900">{item.name || item.medicineName}</p>
                      <p className="text-xs text-red-700">Stock: {item.currentStock || item.quantity} {item.unit || 'units'}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 hover:bg-red-100 text-red-700">
                      Restock
                    </Button>
                  </div>
                ))}
                {stats.lowStockItems === 0 && (
                  <p className="text-center py-4 text-sm text-muted-foreground">All inventory levels normal</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pharmacy Operations</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="flex flex-col items-center justify-center h-20 gap-1" onClick={() => router.push('/pharmacist/inventory')}>
                <Package className="w-5 h-5 text-green-600" />
                <span className="text-[10px]">Inventory</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center justify-center h-20 gap-1">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-[10px]">Analytics</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center justify-center h-20 gap-1">
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="text-[10px]">History</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center justify-center h-20 gap-1">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-[10px]">Expiry</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
