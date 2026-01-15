"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  User,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Timer,
  UserCheck,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TherapyBadge, {
  TherapyType,
} from "@/components/ayurveda/TherapyBadge";

export interface QueueItem {
  id: string;
  patientName: string;
  doctorName: string;
  therapyType: TherapyType;
  appointmentTime: string;
  checkedInAt?: string;
  startedAt?: string;
  estimatedDuration: number;
  status: "waiting" | "in-progress" | "completed" | "checked-in";
  priority?: "normal" | "high" | "urgent";
  notes?: string;
}

interface TherapyQueuePanelProps {
  queues: {
    agnikarma: QueueItem[];
    panchakarma: QueueItem[];
    shirodhara: QueueItem[];
    viddhakarma: QueueItem[];
  };
  onStatusChange?: (itemId: string, newStatus: QueueItem["status"]) => void;
  onPriorityChange?: (
    itemId: string,
    newPriority: QueueItem["priority"]
  ) => void;
  className?: string;
}

export default function TherapyQueuePanel({
  queues,
  onStatusChange,
  onPriorityChange,
  className,
}: TherapyQueuePanelProps) {
  const [activeTab, setActiveTab] = useState("agnikarma");

  const getStatusColor = (status: QueueItem["status"]) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "checked-in":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority?: QueueItem["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: QueueItem["status"]) => {
    switch (status) {
      case "waiting":
        return <Clock className="w-4 h-4" />;
      case "in-progress":
        return <Play className="w-4 h-4" />;
      case "checked-in":
        return <UserCheck className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const calculateWaitTime = (checkedInAt: string) => {
    const checkedIn = new Date(checkedInAt);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - checkedIn.getTime()) / (1000 * 60)
    );
    return diffMinutes;
  };

  const calculateSessionTime = (startedAt: string) => {
    const started = new Date(startedAt);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - started.getTime()) / (1000 * 60)
    );
    return diffMinutes;
  };

  const QueueItemCard = ({ item }: { item: QueueItem }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{item.patientName}</h3>
              <p className="text-sm text-gray-600">{item.doctorName}</p>
              <div className="flex items-center gap-2 mt-1">
                <TherapyBadge type={item.therapyType} size="sm" />
                {item.priority && item.priority !== "normal" && (
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={`${getStatusColor(
                item.status
              )} flex items-center gap-1`}
            >
              {getStatusIcon(item.status)}
              {item.status.replace("-", " ")}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {item.status === "waiting" && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange?.(item.id, "in-progress")}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </DropdownMenuItem>
                )}
                {item.status === "in-progress" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(item.id, "waiting")}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Session
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(item.id, "completed")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Session
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => onPriorityChange?.(item.id, "urgent")}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Mark Urgent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Appointment:</span>
            <p className="font-medium">{item.appointmentTime}</p>
          </div>
          <div>
            <span className="text-gray-600">Duration:</span>
            <p className="font-medium">{item.estimatedDuration} min</p>
          </div>

          {item.checkedInAt && (
            <div>
              <span className="text-gray-600">Checked in:</span>
              <p className="font-medium">
                {new Date(item.checkedInAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                <span className="text-xs text-gray-500 ml-1">
                  ({calculateWaitTime(item.checkedInAt)}m ago)
                </span>
              </p>
            </div>
          )}

          {item.startedAt && (
            <div>
              <span className="text-gray-600">Started:</span>
              <p className="font-medium">
                {new Date(item.startedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                <span className="text-xs text-gray-500 ml-1">
                  ({calculateSessionTime(item.startedAt)}m ago)
                </span>
              </p>
            </div>
          )}
        </div>

        {item.notes && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-600">Notes:</span>
            <p>{item.notes}</p>
          </div>
        )}

        {/* Progress indicator for in-progress sessions */}
        {item.status === "in-progress" && item.startedAt && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Session Progress</span>
              <span>
                {calculateSessionTime(item.startedAt)} /{" "}
                {item.estimatedDuration} min
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (calculateSessionTime(item.startedAt) /
                      item.estimatedDuration) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const TherapyQueue = ({
    title,
    items,
    therapyType,
  }: {
    title: string;
    items: QueueItem[];
    therapyType: TherapyType;
  }) => {
    const waitingCount = items.filter(
      (item) => item.status === "waiting"
    ).length;
    const inProgressCount = items.filter(
      (item) => item.status === "in-progress"
    ).length;
    const completedCount = items.filter(
      (item) => item.status === "completed"
    ).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TherapyBadge type={therapyType} />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {waitingCount} waiting
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {inProgressCount} active
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {completedCount} completed
              </Badge>
            </div>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="space-y-3">
            {items
              .sort((a, b) => {
                // Sort by priority first, then by status, then by appointment time
                const priorityOrder = { urgent: 3, high: 2, normal: 1 };
                const statusOrder = {
                  "in-progress": 4,
                  waiting: 3,
                  "checked-in": 2,
                  completed: 1,
                };

                const aPriority = priorityOrder[a.priority || "normal"];
                const bPriority = priorityOrder[b.priority || "normal"];

                if (aPriority !== bPriority) return bPriority - aPriority;

                const aStatus = statusOrder[a.status];
                const bStatus = statusOrder[b.status];

                if (aStatus !== bStatus) return bStatus - aStatus;

                return (
                  new Date(a.appointmentTime).getTime() -
                  new Date(b.appointmentTime).getTime()
                );
              })
              .map((item) => (
                <QueueItemCard key={item.id} item={item} />
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <TherapyBadge type={therapyType} className="mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No patients in queue
              </h3>
              <p className="text-gray-500">
                All {title.toLowerCase()} sessions are completed.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Therapy Queue Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agnikarma">Agnikarma</TabsTrigger>
            <TabsTrigger value="panchakarma">Panchakarma</TabsTrigger>
            <TabsTrigger value="shirodhara">Shirodhara</TabsTrigger>
            <TabsTrigger value="viddhakarma">Viddhakarma</TabsTrigger>
          </TabsList>

          <TabsContent value="agnikarma">
            <TherapyQueue
              title="Agnikarma"
              items={queues.agnikarma}
              therapyType="AGNIKARMA"
            />
          </TabsContent>

          <TabsContent value="panchakarma">
            <TherapyQueue
              title="Panchakarma"
              items={queues.panchakarma}
              therapyType="PANCHAKARMA"
            />
          </TabsContent>

          <TabsContent value="shirodhara">
            <TherapyQueue
              title="Shirodhara"
              items={queues.shirodhara}
              therapyType="SHIRODHARA"
            />
          </TabsContent>

          <TabsContent value="viddhakarma">
            <TherapyQueue
              title="Viddhakarma"
              items={queues.viddhakarma}
              therapyType="VIDDHAKARMA"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
