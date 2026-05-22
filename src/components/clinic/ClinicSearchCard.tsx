"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ClinicSearchCardProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function ClinicSearchCard({ searchTerm, onSearchChange }: ClinicSearchCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Clinics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by clinic name, address, or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}