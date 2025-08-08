"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types/auth.types";
import { 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  SkipForward,
  UserCheck,
  Stethoscope,
  Flame,
  Droplets,
  Leaf
} from "lucide-react";

export default function QueuePage() {
  const { session } = useAuth();
  const [activeQueue, setActiveQueue] = useState("consultations");

  const userRole = session?.user?.role as Role;

  // Mock queue data
  const consultationQueue = [
    {
      id: "1",
      patientName: "Rajesh Kumar",
      doctorName: "Dr. Priya Sharma",
      appointmentTime: "10:00 AM",
      status: "waiting",
      type: "Consultation",
      checkedInAt: "9:45 AM",
      estimatedWait: "15 min"
    },
    {
      id: "2",
      patientName: "Aarti Singh",
      doctorName: "Dr. Amit Patel",
      appointmentTime: "10:30 AM",
      status: "in-progress",
      type: "Follow-up",
      checkedInAt: "10:15 AM",
      startedAt: "10:25 AM"
    },
    {
      id: "3",
      patientName: "Vikram Gupta",
      doctorName: "Dr. Ravi Mehta",
      appointmentTime: "11:00 AM",
      status: "checked-in",
      type: "Consultation",
      checkedInAt: "10:45 AM",
      estimatedWait: "20 min"
    }
  ];

  const therapyQueues = {
    agnikarma: [
      {
        id: "t1",
        patientName: "Sunita Devi",
        doctorName: "Dr. Priya Sharma",
        appointmentTime: "2:00 PM",
        status: "waiting",
        type: "Agnikarma",
        checkedInAt: "1:45 PM",
        estimatedDuration: "45 min"
      }
    ],
    panchakarma: [
      {
        id: "t2",
        patientName: "Manoj Tiwari",
        doctorName: "Dr. Amit Patel",
        appointmentTime: "3:00 PM",
        status: "in-progress",
        type: "Panchakarma",
        checkedInAt: "2:45 PM",
        startedAt: "3:05 PM",
        estimatedDuration: "90 min"
      }
    ],
    shirodhara: [
      {
        id: "t3",
        patientName: "Kavita Sharma",
        doctorName: "Dr. Ravi Mehta",
        appointmentTime: "4:00 PM",
        status: "waiting",
        type: "Shirodhara",
        checkedInAt: "3:50 PM",
        estimatedDuration: "60 min"
      }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'checked-in': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4" />;
      case 'in-progress': return <Play className="w-4 h-4" />;
      case 'checked-in': return <UserCheck className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTherapyIcon = (type: string) => {
    switch (type) {
      case 'Agnikarma': return <Flame className="w-5 h-5 text-orange-600" />;
      case 'Panchakarma': return <Droplets className="w-5 h-5 text-blue-600" />;
      case 'Shirodhara': return <Leaf className="w-5 h-5 text-green-600" />;
      default: return <Stethoscope className="w-5 h-5 text-gray-600" />;
    }
  };

  const QueueCard = ({ item, showActions = true }: { item: any, showActions?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{item.patientName}</h3>
              <p className="text-sm text-gray-600">{item.doctorName}</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-500">
                  Appointment: {item.appointmentTime}
                </span>
                <span className="text-xs text-gray-500">
                  Checked in: {item.checkedInAt}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <Badge className={`${getStatusColor(item.status)} flex items-center gap-1`}>
                {getStatusIcon(item.status)}
                {item.status.replace('-', ' ')}
              </Badge>
              {item.estimatedWait && (
                <p className="text-xs text-gray-500 mt-1">
                  Est. wait: {item.estimatedWait}
                </p>
              )}
              {item.estimatedDuration && (
                <p className="text-xs text-gray-500 mt-1">
                  Duration: {item.estimatedDuration}
                </p>
              )}
            </div>

            {showActions && userRole !== Role.PATIENT && (
              <div className="flex flex-col gap-1">
                {item.status === 'waiting' && (
                  <Button size="sm" className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    Start
                  </Button>
                )}
                {item.status === 'in-progress' && (
                  <>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <Pause className="w-3 h-3" />
                      Pause
                    </Button>
                    <Button size="sm" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Complete
                    </Button>
                  </>
                )}
                {item.status === 'checked-in' && (
                  <Button size="sm" variant="outline" className="flex items-center gap-1">
                    <SkipForward className="w-3 h-3" />
                    Call Next
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TherapyQueueSection = ({ title, items, icon }: { title: string, items: any[], icon: React.ReactNode }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <QueueCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-400 mb-2">{icon}</div>
            <p className="text-gray-500">No patients in {title.toLowerCase()} queue</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Queue Management</h1>
          <p className="text-gray-600">Monitor and manage patient queues</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Live Updates
          </Badge>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Waiting</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Play className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Wait Time</p>
                <p className="text-2xl font-bold">18m</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Tabs */}
      <Tabs value={activeQueue} onValueChange={setActiveQueue} className="space-y-6">
        <TabsList>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="therapies">Therapies</TabsTrigger>
        </TabsList>

        <TabsContent value="consultations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Consultation Queue
                <Badge variant="secondary">{consultationQueue.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {consultationQueue.map((item) => (
                <QueueCard key={item.id} item={item} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="therapies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TherapyQueueSection
              title="Agnikarma"
              items={therapyQueues.agnikarma}
              icon={<Flame className="w-5 h-5 text-orange-600" />}
            />
            <TherapyQueueSection
              title="Panchakarma"
              items={therapyQueues.panchakarma}
              icon={<Droplets className="w-5 h-5 text-blue-600" />}
            />
            <TherapyQueueSection
              title="Shirodhara"
              items={therapyQueues.shirodhara}
              icon={<Leaf className="w-5 h-5 text-green-600" />}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
