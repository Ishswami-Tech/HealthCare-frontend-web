"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2 } from "lucide-react";

interface ClinicLocationHeadDashboardLocationsCardProps {
  onManageLocations: () => void;
}

export function ClinicLocationHeadDashboardLocationsCard({
  onManageLocations,
}: ClinicLocationHeadDashboardLocationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="size-4 text-slate-500" />
          Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          Manage your clinic locations and their schedules.
        </p>
        <Button className="w-full gap-2" variant="outline" onClick={onManageLocations} type="button">
          <Building2 className="size-4" />
          Manage Locations
          <ArrowRight className="ml-auto size-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
