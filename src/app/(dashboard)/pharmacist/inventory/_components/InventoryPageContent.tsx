"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, BarChart3, Calendar, DollarSign, Edit, Eye, Package, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateInIST } from "@/lib/utils/date-time";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  type: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  costPerUnit: number;
  expiryDate: string;
  supplier: string;
  lastRestocked: string;
  status: "critical" | "low" | "adequate" | "good" | string;
}

interface InventoryPageContentProps {
  inventoryPending: boolean;
  totalItems: number;
  lowStockItems: number;
  expiringItems: number;
  totalValue: number;
  lowStockWatchlist: InventoryItem[];
  expiringWatchlist: InventoryItem[];
  filteredInventory: InventoryItem[];
  inventoryColumns: ColumnDef<InventoryItem>[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
}

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

const isExpiringSoon = (expiryDate: string) => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 90;
};

export function InventoryPageContent({
  inventoryPending,
  totalItems,
  lowStockItems,
  expiringItems,
  totalValue,
  lowStockWatchlist,
  expiringWatchlist,
  filteredInventory,
  inventoryColumns,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
}: InventoryPageContentProps) {
  if (inventoryPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-32 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">Loading inventory…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gap-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Inventory Management</h1>
          <p className="text-gray-600">Monitor and manage medicine inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2" type="button">
            <BarChart3 className="size-4" />
            Reports
          </Button>
          <Button className="flex items-center gap-2" type="button">
            <Plus className="size-4" />
            Add Medicine
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Items" icon={<Package className="size-4 text-muted-foreground" />} value={totalItems} description="Active medicines" />
        <MetricCard title="Low Stock" icon={<AlertTriangle className="size-4 text-muted-foreground" />} value={lowStockItems} description="Need restocking" valueClassName="text-yellow-600" />
        <MetricCard title="Expiring Soon" icon={<Calendar className="size-4 text-muted-foreground" />} value={expiringItems} description="Within 90 days" valueClassName="text-red-600" />
        <MetricCard title="Total Value" icon={<DollarSign className="size-4 text-muted-foreground" />} value={`₹${totalValue.toLocaleString()}`} description="Current inventory" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-yellow-200/80 dark:border-yellow-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-yellow-600" />
              Low stock watchlist
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-y-3">
            {lowStockWatchlist.length > 0 ? (
              lowStockWatchlist.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.currentStock} / {item.minStock} {item.unit}
                    </div>
                  </div>
                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                </div>
              ))
            ) : (
              <Empty>
                <EmptyContent>
                  <EmptyMedia>
                    <AlertTriangle className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No low stock medicines right now.</EmptyTitle>
                  <EmptyDescription>
                    Inventory levels are currently within the configured threshold.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-200/80 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4 text-red-600" />
              Expiry watchlist
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-y-3">
            {expiringWatchlist.length > 0 ? (
              expiringWatchlist.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">{item.name}</div>
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
              <Empty>
                <EmptyContent>
                  <EmptyMedia>
                    <Calendar className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No expiring medicines in the next 90 days.</EmptyTitle>
                  <EmptyDescription>
                    Nothing is currently approaching the expiry window.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-full flex-1 min-w-0 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <FilterSelect
              value={filterType}
              setValue={setFilterType}
              placeholder="Type"
              label="All Types"
              options={[
                ["AYURVEDIC", "Ayurvedic"],
                ["HERBAL", "Herbal"],
                ["CLASSICAL", "Classical"],
                ["PROPRIETARY", "Proprietary"],
                ["SIDDHA", "Siddha"],
                ["UNANI", "Unani"],
              ]}
            />
            <FilterSelect
              value={filterCategory}
              setValue={setFilterCategory}
              placeholder="Category"
              label="All Categories"
              options={[
                ["churna", "Churna"],
                ["capsules", "Capsules"],
                ["tablets", "Tablets"],
                ["ghrita", "Ghrita"],
                ["avaleha", "Avaleha"],
              ]}
            />
            <FilterSelect
              value={filterStatus}
              setValue={setFilterStatus}
              placeholder="Stock Status"
              label="All Status"
              options={[
                ["critical", "Critical"],
                ["low", "Low"],
                ["adequate", "Adequate"],
                ["good", "Good"],
              ]}
            />
          </div>
        </CardContent>
      </Card>

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

function MetricCard({
  title,
  icon,
  value,
  description,
  valueClassName,
}: {
  title: string;
  icon: React.ReactNode;
  value: number | string;
  description: string;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={["text-2xl font-bold", valueClassName].filter(Boolean).join(" ")}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  value,
  setValue,
  placeholder,
  label,
  options,
}: {
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
  label: string;
  options: Array<[string, string]>;
}) {
  return (
    <Select value={value || "all"} onValueChange={(next) => setValue(next === "all" ? "" : next)}>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}</SelectItem>
        {options.map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
