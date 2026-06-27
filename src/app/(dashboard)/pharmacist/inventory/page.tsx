"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Role } from "@/types/auth.types";
import { useAuth } from "@/hooks/auth/useAuth";
import { useInventory } from "@/hooks/query/usePharmacy";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateInIST } from "@/lib/utils/date-time";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye } from "lucide-react";
import type { InventoryItem } from "./_components/InventoryPageContent";

const InventoryPageContent = dynamic(
  () => import("./_components/InventoryPageContent").then((module) => module.InventoryPageContent),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  }
);

const getStatusColor = (status: string) => {
  switch (status) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "low":
      return "bg-yellow-100 text-yellow-800";
    case "adequate":
      return "bg-blue-100 text-blue-800";
    case "good":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStockPercentage = (current: number, max: number) =>
  Math.round((current / max) * 100);

const isExpiringSoon = (expiryDate: string) => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 90;
};

export default function InventoryPage() {
  useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useWebSocketQuerySync();

  const { clinicId } = useClinicContext();
  const { data: inventoryData = [], isPending: inventoryPending } = useInventory(clinicId || "", {
    limit: 100,
  });

  const inventoryItems = useMemo<InventoryItem[]>(
    () =>
      (inventoryData as any[]).map((item: any) => ({
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
        status:
          item.currentStock < (item.minStock || item.minThreshold)
            ? item.currentStock < (item.minStock || item.minThreshold) * 0.5
              ? "critical"
              : "low"
            : "adequate",
      })),
    [inventoryData],
  );

  const inventoryColumns: ColumnDef<InventoryItem>[] = useMemo(
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
              <div className="overflow-hidden rounded-full bg-muted dark:bg-slate-800">
                <div
                  className={`h-2 rounded-full ${
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
            <div>
              Cost: ₹{row.original.costPerUnit}/{row.original.unit}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "expiryDate",
        header: "Expiry",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span
              className={
                isExpiringSoon(row.original.expiryDate)
                  ? "font-semibold text-red-600 dark:text-red-300"
                  : "text-foreground"
              }
            >
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
        cell: ({ row }) => <Badge className={getStatusColor(row.original.status)}>{row.original.status}</Badge>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-1" type="button">
              <Eye className="size-3" />
              View
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-1" type="button">
              <Edit className="size-3" />
              Update
            </Button>
            {(row.original.status === "critical" || row.original.status === "low") && (
              <Button size="sm" className="flex items-center gap-1" type="button">
                <Plus className="size-3" />
                Reorder
              </Button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  const totalItems = inventoryItems.length;
  const lowStockItems = inventoryItems.filter(
    (item) => item.status === "low" || item.status === "critical",
  ).length;
  const expiringItems = inventoryItems.filter((item) => isExpiringSoon(item.expiryDate)).length;
  const totalValue = inventoryItems.reduce(
    (sum, item) => sum + item.currentStock * item.costPerUnit,
    0,
  );
  const lowStockWatchlist = inventoryItems
    .filter((item) => item.status === "low" || item.status === "critical")
    .slice(0, 5);
  const expiringWatchlist = inventoryItems
    .filter((item) => isExpiringSoon(item.expiryDate))
    .slice(0, 5);
  const filteredInventory = inventoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesType = !filterType || item.type === filterType;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  return (
    <InventoryPageContent
      inventoryPending={inventoryPending}
      totalItems={totalItems}
      lowStockItems={lowStockItems}
      expiringItems={expiringItems}
      totalValue={totalValue}
      lowStockWatchlist={lowStockWatchlist}
      expiringWatchlist={expiringWatchlist}
      filteredInventory={filteredInventory}
      inventoryColumns={inventoryColumns}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      filterCategory={filterCategory}
      setFilterCategory={setFilterCategory}
      filterType={filterType}
      setFilterType={setFilterType}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
    />
  );
}
