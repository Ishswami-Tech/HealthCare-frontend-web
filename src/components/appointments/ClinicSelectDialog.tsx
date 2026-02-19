"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClinics, useClinicLocations, useMyClinic, useClinic } from "@/hooks/query/useClinics";
import { MapPin, Building, ChevronRight, Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";


interface ClinicSelectDialogProps {
  trigger?: React.ReactNode;
}

export function ClinicSelectDialog({ trigger }: ClinicSelectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  const { data: clinicsResponse, isPending: clinicsLoading } = useClinics();
  const { data: myClinic, isPending: myClinicLoading } = useMyClinic();
  const { data: defaultClinic, isPending: defaultClinicLoading } = useClinic();
  
  // Prioritize user's associated clinic for isolation, fallback to all clinics only if no association
  const clinics = myClinic 
    ? [myClinic] 
    : (clinicsResponse && clinicsResponse.length > 0 ? clinicsResponse : (defaultClinic ? [defaultClinic] : []));
    
const isLoading = clinicsLoading || myClinicLoading || defaultClinicLoading;

  const { data: locations, isPending: locationsLoading } = useClinicLocations(selectedClinicId || "");

  useEffect(() => {
    if (!selectedClinicId && clinics && clinics.length === 1 && clinics[0]) {
      setSelectedClinicId(clinics[0].id);
    }
  }, [clinics, selectedClinicId]);

  const handleSelectLocation = (clinicId: string, locationId: string) => {
    setOpen(false);
    const selectedClinic = clinics.find(c => c.id === clinicId);
    const clinicName = selectedClinic?.name || "";
    router.push(`/patient/appointments?clinicId=${clinicId}&locationId=${locationId}&clinicName=${encodeURIComponent(clinicName)}`);
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

        <div className="flex-1 overflow-hidden flex flex-col border-t mt-4">
          {/* Clinic Header / Context - Only show if we have a clinic selected or only one option */}
          {(selectedClinicId && clinics.find(c => c.id === selectedClinicId)) && (
            <div className="px-6 py-4 bg-muted/30 border-b flex items-center justify-between">
              <div>
                 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Clinic</p>
                 <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    {clinics.find(c => c.id === selectedClinicId)?.name}
                 </h3>
                 <p className="text-xs text-muted-foreground mt-0.5">{clinics.find(c => c.id === selectedClinicId)?.address}</p>
              </div>
              {clinics.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedClinicId(null)} className="text-xs h-8">
                  Change
                </Button>
              )}
            </div>
          )}

          {/* Clinic List - Only show if no clinic is selected (rare case if length > 1) */}
          {!selectedClinicId && (
             <div className="flex-1 overflow-y-auto p-4">
               <p className="text-sm font-medium mb-3 text-muted-foreground">Please select a clinic</p>
               <div className="grid gap-3">
                 {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-600" /></div>
                 ) : clinics.map(clinic => (
                   <button
                     key={clinic.id}
                     onClick={() => setSelectedClinicId(clinic.id)}
                     className="w-full text-left p-4 rounded-xl border hover:border-blue-500 hover:shadow-sm transition-all bg-card"
                   >
                     <h4 className="font-semibold">{clinic.name}</h4>
                     <p className="text-sm text-muted-foreground">{clinic.address}</p>
                   </button>
                 ))}
               </div>
             </div>
          )}

          {/* Location List - Full Width */}
          {selectedClinicId && (
            <div className="flex-1 flex flex-col min-h-0 bg-background">
              <div className="px-6 py-3 border-b bg-background z-10">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Available Locations
                </p>
              </div>
              <ScrollArea className="flex-1 h-[400px]">
                <div className="p-4 pt-2 space-y-3">
                  {locationsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : !locations || locations.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                         <MapPin className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No active locations for this clinic.</p>
                    </div>
                  ) : (
                    locations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => handleSelectLocation(selectedClinicId, loc.id)}
                        className="group w-full text-left p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 transition-all bg-white dark:bg-neutral-900 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-bold text-base group-hover:text-blue-600 transition-colors">
                              {loc.name}
                            </h4>
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/70" />
                              <span>{loc.address}, {loc.city}</span>
                            </div>
                            {loc.phone && (
                              <p className="text-xs text-muted-foreground pl-6">
                                Ph: {loc.phone}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                        {loc.isActive && (
                          <div className="mt-3 pl-6 flex items-center gap-2">
                             <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Accepting Appointments
                             </span>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
