"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClinics, useClinicLocations } from "@/hooks/query/useClinics";
import { MapPin, Building, ChevronRight, Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ClinicSelectDialogProps {
  trigger?: React.ReactNode;
}

export function ClinicSelectDialog({ trigger }: ClinicSelectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  const { data: clinicsResponse, isPending: clinicsLoading } = useClinics();
  const clinics = clinicsResponse?.clinics || [];

  const { data: locations, isPending: locationsLoading } = useClinicLocations(selectedClinicId || "");

  const handleSelectLocation = (clinicId: string, locationId: string) => {
    setOpen(false);
    router.push(`/patient/appointments?clinicId=${clinicId}&locationId=${locationId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2 hover:scale-105 transition-transform bg-linear-to-r from-blue-600 to-purple-600">
            <Plus className="w-4 h-4" />
            Book Appointment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            Select Clinic Location
          </DialogTitle>
          <p className="text-muted-foreground text-sm">
            Choose a clinic location to book your appointment.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row border-t mt-4">
          {/* Clinic List */}
          <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r bg-muted/30">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Clinics
            </p>
            <ScrollArea className="h-[300px] md:h-[450px]">
              <div className="p-2 space-y-1">
                {clinicsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : clinics.length === 0 ? (
                  <p className="text-center py-8 text-sm text-muted-foreground">No clinics found.</p>
                ) : (
                  clinics.map((clinic) => (
                    <button
                      key={clinic.id}
                      onClick={() => setSelectedClinicId(clinic.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all hover:bg-white dark:hover:bg-neutral-800",
                        selectedClinicId === clinic.id 
                          ? "border-blue-500 bg-white dark:bg-neutral-800 shadow-sm" 
                          : "border-transparent bg-transparent"
                      )}
                    >
                      <h4 className="font-semibold text-sm">{clinic.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{clinic.address}</p>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Location List */}
          <div className="w-full md:w-1/2 flex flex-col">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Location
            </p>
            <ScrollArea className="h-[300px] md:h-[450px]">
              <div className="p-2 space-y-2">
                {!selectedClinicId ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <MapPin className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Select a clinic on the left to see available locations.
                    </p>
                  </div>
                ) : locationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : !locations || locations.length === 0 ? (
                  <p className="text-center py-12 text-sm text-muted-foreground">No active locations for this clinic.</p>
                ) : (
                  locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectLocation(selectedClinicId, loc.id)}
                      className="group w-full text-left p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 transition-all bg-white dark:bg-neutral-900 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm group-hover:text-blue-600 transition-colors">
                            {loc.name}
                          </h4>
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>{loc.address}, {loc.city}</span>
                          </div>
                          {loc.phone && (
                            <p className="text-[10px] text-muted-foreground pl-4">
                              Ph: {loc.phone}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </div>
                      {loc.isActive && (
                        <div className="mt-2 text-[10px] text-green-600 font-medium flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-green-600 animate-pulse" />
                          Accepting Appointments
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
