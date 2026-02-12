"use client";

import { useRealTimeQueueStatus } from "@/hooks/realtime/useRealTimeQueries";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, AlertCircle } from "lucide-react";
import { useMemo } from "react";

export function PatientQueueCard() {
  // Fetch patient's appointments to find one that is active/checked-in
  const { data: appointmentsData, isPending: isAppointmentsPending } = useMyAppointments();
  
  // Find the active appointment (Checked In or In Progress)
  const activeAppointment = useMemo(() => {
    if (!appointmentsData?.appointments) return null;
    return appointmentsData.appointments.find(
      (apt: any) => apt.status === 'CHECKED_IN' || apt.status === 'IN_PROGRESS'
    );
  }, [appointmentsData]);

  // Fetch real-time queue stats
  const { data: queueStats } = useRealTimeQueueStatus();

  if (isAppointmentsPending) {
    return (
      <Card className="border-l-4 border-l-blue-500">
         <CardContent className="p-6 flex items-center gap-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading queue status...</p>
         </CardContent>
      </Card>
    );
  }

  // If no active appointment, we don't show the queue card
  if (!activeAppointment) {
     return null; 
  }

  const estimatedWait = (queueStats as any)?.data?.estimatedWaitTime || 15;

  return (
    <Card className="border-l-4 border-l-blue-600 shadow-md bg-linear-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
             <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Live Queue Status
            </CardTitle>
            <Badge variant={activeAppointment.status === 'IN_PROGRESS' ? 'default' : 'secondary'} className="animate-pulse">
                {activeAppointment.status === 'IN_PROGRESS' ? 'Now Serving You' : 'You are Check-in'}
            </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                <span className="text-xs text-muted-foreground uppercase font-bold">Current Token</span>
                <span className="text-2xl font-bold text-blue-600">
                    {(queueStats as any)?.data?.currentToken || "--"}
                </span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                <span className="text-xs text-muted-foreground uppercase font-bold">Est. Wait Time</span>
                <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-xl font-bold text-gray-700 dark:text-gray-200">
                        {activeAppointment.status === 'IN_PROGRESS' ? '0' : estimatedWait} <span className="text-xs">min</span>
                    </span>
                </div>
            </div>
        </div>
        
        {activeAppointment.status === 'CHECKED_IN' && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                    Please remain seated in the waiting area. The doctor will call you shortly.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
