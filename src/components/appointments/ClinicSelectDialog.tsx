"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClinics, useClinicLocations, useMyClinic, useClinic } from "@/hooks/query/useClinics";
import { MapPin, Building, ChevronRight, Loader2, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconBox, Pill } from "@/components/tbd";


interface ClinicSelectDialogProps {
  trigger?: React.ReactNode;
}

export function ClinicSelectDialog({ trigger }: ClinicSelectDialogProps) {
  const { push } = useRouter();
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

  const effectiveClinicId = selectedClinicId ?? (clinics.length === 1 ? clinics[0]?.id ?? null : null);
  const { data: locationsData, isPending: locationsLoading } = useClinicLocations(effectiveClinicId || "");
  const locationSource = (locationsData ?? {}) as {
    locations?: unknown;
    data?: unknown;
  };
  const locations = Array.isArray(locationsData)
    ? locationsData
    : Array.isArray(locationSource.locations)
      ? ((locationSource.locations as any[]) || [])
      : Array.isArray(locationSource.data)
        ? ((locationSource.data as any[]) || [])
        : [];

  const handleSelectLocation = (clinicId: string, locationId: string) => {
    setOpen(false);
    const selectedClinic = clinics.find(c => c.id === clinicId);
    const clinicName = selectedClinic?.name || "";
    push(`/patient/appointments?clinicId=${clinicId}&locationId=${locationId}&clinicName=${encodeURIComponent(clinicName)}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="action" size="md">
            <Plus className="size-4" />
            Book Video Appointment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2.5">
            <IconBox icon={Building} tone="mint" size={36} />
            Select Clinic Location
          </DialogTitle>
          <DialogDescription>
            Choose a clinic location to book your appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-1 flex-col overflow-hidden border-t border-hair">
          {/* Clinic Header / Context - Only show if we have a clinic selected or only one option */}
          {(effectiveClinicId && clinics.find(c => c.id === effectiveClinicId)) && (
            <div className="flex items-center justify-between border-b border-hair bg-[#f8fafc] px-6 py-4 dark:bg-well/50">
              <div>
                 <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">Clinic</p>
                 <h3 className="flex items-center gap-2 text-base font-bold text-ink">
                    <Building className="size-4 text-brand" />
                    {clinics.find(c => c.id === effectiveClinicId)?.name}
                 </h3>
                 <p className="mt-0.5 text-xs text-ink-muted">{clinics.find(c => c.id === effectiveClinicId)?.address}</p>
              </div>
              {clinics.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedClinicId(null)} className="text-xs h-8">
                  Change
                </Button>
              )}
            </div>
          )}

          {/* Clinic List - Only show if no clinic is selected (rare case if length > 1) */}
          {!effectiveClinicId && (
             <div className="flex-1 overflow-y-auto p-4">
               <p className="mb-3 text-sm font-medium text-ink-muted">Please select a clinic</p>
               <div className="grid gap-3">
                 {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-brand" /></div>
                 ) : clinics.map((clinic) => (
                   <Button
                     key={clinic.id}
                     type="button"
                     variant="outline"
                     onClick={() => setSelectedClinicId(clinic.id)}
                     className="h-auto w-full justify-start whitespace-normal rounded-2xl border-2 border-line bg-card p-4 text-left hover:border-brand/40 hover:bg-mint-soft"
                   >
                      <div className="flex flex-col gap-y-1">
                       <h4 className="m-0 text-sm font-bold text-ink">{clinic.name}</h4>
                       <p className="m-0 text-[13px] font-normal text-ink-muted">{clinic.address}</p>
                     </div>
                   </Button>
                 ))}
               </div>
             </div>
          )}

          {/* Location List - Full Width */}
          {effectiveClinicId && (
            <div className="flex-1 flex flex-col min-h-0 bg-background">
              <div className="z-10 border-b border-hair bg-card px-6 py-3">
                <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">
                  Available Locations
                </p>
              </div>
              <ScrollArea className="flex-1 h-[400px]">
                <div className="flex flex-col gap-y-3 p-4 pt-2">
                  {locationsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="size-6 animate-spin text-brand" />
                    </div>
                  ) : locations.length === 0 ? (
                    <div className="flex flex-col gap-y-3 py-12 text-center">
                      <IconBox icon={MapPin} tone="slate" size={48} className="mx-auto" />
                      <p className="m-0 text-sm text-ink-muted">No active locations for this clinic.</p>
                    </div>
                  ) : (
                    locations.map((loc) => (
                      <Button
                        type="button"
                        key={loc.id}
                        variant="outline"
                        onClick={() => handleSelectLocation(effectiveClinicId, loc.id)}
                        className="group h-auto w-full flex-col items-stretch justify-start whitespace-normal rounded-2xl border-2 border-line bg-card p-4 text-left hover:border-brand/40 hover:bg-mint-soft"
                      >
                        <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-y-1">
                            <h4 className="m-0 text-[15px] font-bold text-ink">
                              {loc.name}
                            </h4>
                            <div className="flex items-start gap-2 text-[13px] font-normal text-ink-muted">
                              <MapPin className="mt-0.5 size-4 shrink-0" />
                              <span>{loc.address}, {loc.city}</span>
                            </div>
                            {loc.phone && (
                              <p className="m-0 pl-6 text-xs font-normal text-ink-muted">
                                Ph: {loc.phone}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="size-5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-brand" />
                        </div>
                        {loc.isActive && (
                          <div className="mt-3 pl-6 flex items-center gap-2">
                             <Pill tone="green" dot>
                                Accepting Appointments
                             </Pill>
                          </div>
                        )}
                      </Button>
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


