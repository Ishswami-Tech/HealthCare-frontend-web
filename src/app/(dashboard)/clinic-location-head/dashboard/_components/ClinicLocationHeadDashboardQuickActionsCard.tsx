"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowRight, Building2, Calendar, ClipboardList, MapPin, Wallet } from "lucide-react";

interface ClinicLocationHeadDashboardQuickActionsCardProps {
  onLocations: () => void;
  onQueue: () => void;
  onAppointments: () => void;
  onCheckIn: () => void;
  onBilling: () => void;
}

export function ClinicLocationHeadDashboardQuickActionsCard({
  onLocations,
  onQueue,
  onAppointments,
  onCheckIn,
  onBilling,
}: ClinicLocationHeadDashboardQuickActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="flex h-20 flex-col gap-1 border-slate-100 hover:bg-blue-50" onClick={onLocations} type="button">
          <MapPin className="size-5 text-blue-600" />
          <span className="text-[11px] font-medium text-slate-600">Locations</span>
        </Button>
        <Button variant="outline" className="flex h-20 flex-col gap-1 border-slate-100 hover:bg-emerald-50" onClick={onQueue} type="button">
          <Activity className="size-5 text-emerald-600" />
          <span className="text-[11px] font-medium text-slate-600">Queue</span>
        </Button>
        <Button variant="outline" className="flex h-20 flex-col gap-1 border-slate-100 hover:bg-amber-50" onClick={onAppointments} type="button">
          <Calendar className="size-5 text-amber-600" />
          <span className="text-[11px] font-medium text-slate-600">Appointments</span>
        </Button>
        <Button variant="outline" className="flex h-20 flex-col gap-1 border-slate-100 hover:bg-purple-50" onClick={onCheckIn} type="button">
          <ClipboardList className="size-5 text-purple-600" />
          <span className="text-[11px] font-medium text-slate-600">Check-In</span>
        </Button>
        <Button
          variant="outline"
          className="col-span-2 flex h-20 flex-col gap-1 border-slate-100 hover:bg-slate-50"
          onClick={onBilling}
          type="button"
        >
          <Wallet className="size-5 text-slate-600" />
          <span className="text-[11px] font-medium text-slate-600">Billing</span>
        </Button>
      </CardContent>
    </Card>
  );
}
