"use client";

import { useRealTimeQueueStatus } from "@/hooks/realtime/useRealTimeQueries";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, AlertCircle, Maximize2 } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PatientQueueCard() {
  const router = useRouter();
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
  const { data: queueStats } = useRealTimeQueueStatus(undefined, activeAppointment?.locationId);

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

  const stats = (queueStats as any)?.data || {};
  const currentToken = stats.currentToken || 0;
  // Try to find patient's token number in appointment or metadata
  const userToken = activeAppointment.tokenNumber || activeAppointment.metadata?.tokenNumber || 0;
  const totalInQueue = stats.totalInQueue || 0;
  
  // Calculate people ahead
  let peopleAhead = 0;
  if (activeAppointment.status === 'CHECKED_IN' && userToken > currentToken) {
    peopleAhead = userToken - currentToken;
  }

  const estimatedWait = stats.estimatedWaitTime || 15;

  return (
    <Card className="border-l-4 border-l-blue-600 shadow-lg overflow-hidden bg-linear-to-r from-blue-50/50 to-white dark:from-blue-950/20 dark:to-background">
      <CardHeader className="pb-2 border-b bg-white/50 dark:bg-gray-900/50">
        <div className="flex justify-between items-center">
             <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Live Queue Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant={activeAppointment.status === 'IN_PROGRESS' ? 'default' : 'secondary'} 
                className={cn(
                  "animate-pulse capitalize hidden sm:inline-flex",
                  activeAppointment.status === 'IN_PROGRESS' ? "bg-green-600 hover:bg-green-700" : ""
                )}
              >
                  {activeAppointment.status === 'IN_PROGRESS' ? 'Now Serving' : 'Waiting in Queue'}
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => router.push('/patient/queue')} title="Full Screen View">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Your Token */}
            <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Your Token</span>
                <span className="text-3xl font-black text-blue-600">
                    {userToken || "--"}
                </span>
            </div>

            {/* Current Token */}
            <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900/30">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Now Serving</span>
                <span className="text-3xl font-black text-orange-600">
                    {currentToken || "--"}
                </span>
            </div>
            
            {/* People Ahead */}
            <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">People Ahead</span>
                <div className="flex items-center gap-1">
                    <span className="text-3xl font-black text-gray-700 dark:text-gray-200">
                        {activeAppointment.status === 'IN_PROGRESS' ? '0' : peopleAhead}
                    </span>
                </div>
            </div>

            {/* Wait Time */}
            <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Est. Wait</span>
                <div className="flex items-center gap-0.5">
                    <span className="text-2xl font-black text-gray-700 dark:text-gray-200">
                      {activeAppointment.status === 'IN_PROGRESS' ? '0' : (peopleAhead * 10 || estimatedWait)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground mt-2">MIN</span>
                </div>
            </div>
        </div>

        {/* Detailed Stats Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  {totalInQueue} patients currently in queue
                </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Total Waiting: {stats.waitingCount || totalInQueue}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Avg Service: {stats.averageServiceTime || 12}m</span>
                </div>
            </div>
        </div>
        
        {activeAppointment.status === 'CHECKED_IN' && (
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground italic px-2">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                <p>
                    Stay nearby. You will be called when token <span className="font-bold text-foreground">#{userToken}</span> is up.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
