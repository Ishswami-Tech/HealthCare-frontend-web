"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Eye, Check, Pill, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";

type PrescriptionQueueItem = {
  id: string;
  patientName: string;
  medicines: unknown[];
  priority: string;
  status: string;
};

interface PharmacistDashboardQueueCardProps {
  queueItems: PrescriptionQueueItem[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onOpenPrescription: (prescriptionId: string) => void;
  onDispensePrescription: (prescriptionId: string) => void;
}

export function PharmacistDashboardQueueCard({
  queueItems,
  searchTerm,
  onSearchTermChange,
  onOpenPrescription,
  onDispensePrescription,
}: PharmacistDashboardQueueCardProps) {
  const prescriptionColumns: ColumnDef<PrescriptionQueueItem>[] = [
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }) => <div className="font-medium">{row.getValue("patientName")}</div>,
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = ((row.getValue("priority") as string) || "normal").toLowerCase();
        const colors: Record<string, string> = {
          urgent: "bg-red-100 text-red-800",
          high: "bg-orange-100 text-orange-800",
          normal: "bg-blue-100 text-blue-800",
        };
        return <Badge className={colors[priority] || "bg-slate-100"}>{priority.toUpperCase()}</Badge>;
      },
    },
    {
      accessorKey: "medicines",
      header: "Medicines",
      cell: ({ row }) => {
        const medicines = row.getValue("medicines") as unknown[];
        return (
          <div className="text-xs text-muted-foreground">
            {Array.isArray(medicines) ? medicines.length : 0} items
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const isReady = status === "ready_to_dispense";
        return (
          <Badge
            variant={isReady ? "default" : "secondary"}
            className={
              isReady
                ? "border-none bg-emerald-600 shadow-none hover:bg-emerald-700"
                : "border-none bg-blue-100 text-blue-800 shadow-none"
            }
          >
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
          <Button
            size="icon"
            variant="outline"
            className="size-8"
            onClick={() => onOpenPrescription(row.original.id)}
          >
            <Eye className="size-4" />
          </Button>
          {row.getValue("status") === "ready_to_dispense" && (
            <Button
              size="icon"
              className="size-8 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onDispensePrescription(row.original.id)}
              title="Dispense prescription"
            >
              <Check className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Pill className="size-5 text-emerald-600" />
          Prescription Queue
        </CardTitle>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-emerald-600 sm:w-auto"
            onClick={() => onOpenPrescription("all")}
          >
            See all <ArrowRight className="size-3" />
          </Button>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search patient..."
              className="h-9 pl-8"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={prescriptionColumns}
          data={queueItems}
          pageSize={5}
          emptyMessage="No pending prescriptions in the queue"
        />
      </CardContent>
    </Card>
  );
}
