"use client";

import { ArrowRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PharmacistDashboardHeaderProps {
  onFindMedicine: () => void;
  onAddStock: () => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function PharmacistDashboardHeader({
  onFindMedicine,
  onAddStock,
  searchTerm,
  onSearchTermChange,
}: PharmacistDashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground">Manage prescriptions and medical inventory</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2" onClick={onFindMedicine}>
          <Search className="size-4" />
          Find Medicine
        </Button>
        <Button className="gap-2" onClick={onAddStock}>
          <Plus className="size-4" />
          Add Stock
        </Button>
      </div>
      <div className="relative w-full md:hidden">
        <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search patient..."
          className="h-9 pl-8"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>
    </div>
  );
}
