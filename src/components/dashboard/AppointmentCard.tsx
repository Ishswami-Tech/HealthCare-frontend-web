"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/index";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface AppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    time: string;
    doctor?: {
      name: string;
      specialty?: string;
      avatar?: string;
    };
    patient?: {
      name: string;
      avatar?: string;
    };
    type: "in-person" | "video" | "phone";
    status: "scheduled" | "completed" | "cancelled" | "in-progress";
    reason?: string;
    location?: string;
    duration?: number;
  };
  showPatient?: boolean;
  showDoctor?: boolean;
  onReschedule?: () => void;
  onCancel?: () => void;
  onJoin?: () => void;
  className?: string;
}

function AppointmentCardComponent({
  appointment,
  showPatient = false,
  showDoctor = true,
  onReschedule,
  onCancel,
  onJoin,
  className,
}: AppointmentCardProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-primary/10 text-primary border-primary/20";
      case "completed":
        return "bg-primary/10 text-primary border-primary/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "in-progress":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-3 h-3" />;
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      case "in-progress":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300 border-l-4",
        appointment.status === "scheduled" && "border-l-primary",
        appointment.status === "completed" && "border-l-primary",
        appointment.status === "cancelled" && "border-l-destructive",
        appointment.status === "in-progress" && "border-l-primary",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {formatDate(appointment.date)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatTime(appointment.time)}
            </div>
          </div>
          <Badge className={cn("text-xs", getStatusColor(appointment.status))}>
            {getStatusIcon(appointment.status)}
            <span className="ml-1">
              {t(`appointments.${appointment.status}`)}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Doctor/Patient Info */}
        {showDoctor && appointment.doctor && (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={appointment.doctor.avatar} />
              <AvatarFallback>
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{appointment.doctor.name}</p>
              {appointment.doctor.specialty && (
                <p className="text-sm text-muted-foreground">
                  {appointment.doctor.specialty}
                </p>
              )}
            </div>
          </div>
        )}

        {showPatient && appointment.patient && (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={appointment.patient.avatar} />
              <AvatarFallback>
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{appointment.patient.name}</p>
              <p className="text-sm text-muted-foreground">
                {t("patients.patient")}
              </p>
            </div>
          </div>
        )}

        {/* Appointment Details */}
        <div className="space-y-2">
          {appointment.reason && (
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <p className="text-sm">{appointment.reason}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {getTypeIcon(appointment.type)}
            <p className="text-sm text-muted-foreground">
              {appointment.type === "video" && t("appointments.videoCall")}
              {appointment.type === "phone" && t("appointments.phoneCall")}
              {appointment.type === "in-person" &&
                (appointment.location || t("appointments.inPerson"))}
            </p>
          </div>

          {appointment.duration && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {appointment.duration} {t("appointments.duration")}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {appointment.status === "scheduled" && onJoin && (
            <Button
              size="sm"
              className="flex-1 hover:scale-105 transition-transform"
              onClick={onJoin}
            >
              {appointment.type === "video" && (
                <Video className="w-4 h-4 mr-2" />
              )}
              {appointment.type === "phone" && (
                <Phone className="w-4 h-4 mr-2" />
              )}
              {appointment.type === "in-person" && (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              {t("appointments.join")}
            </Button>
          )}

          {appointment.status === "scheduled" && onReschedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReschedule}
              className="hover:scale-105 transition-transform"
            >
              {t("appointments.reschedule")}
            </Button>
          )}

          {appointment.status === "scheduled" && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-red-600 hover:text-red-700 hover:scale-105 transition-all"
            >
              {t("appointments.cancel")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Export memoized AppointmentCard for performance optimization
export const AppointmentCard = memo(
  AppointmentCardComponent,
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
      prevProps.appointment.id === nextProps.appointment.id &&
      prevProps.appointment.status === nextProps.appointment.status &&
      prevProps.appointment.date === nextProps.appointment.date &&
      prevProps.appointment.time === nextProps.appointment.time &&
      prevProps.showPatient === nextProps.showPatient &&
      prevProps.showDoctor === nextProps.showDoctor &&
      prevProps.className === nextProps.className
    );
  }
);

// Appointment list component
interface AppointmentListProps {
  appointments: AppointmentCardProps["appointment"][];
  showPatient?: boolean;
  showDoctor?: boolean;
  onReschedule?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
  onJoin?: (appointmentId: string) => void;
  className?: string;
}

export function AppointmentList({
  appointments,
  showPatient = false,
  showDoctor = true,
  onReschedule,
  onCancel,
  onJoin,
  className,
}: AppointmentListProps) {
  const { t } = useTranslation();

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {t("appointments.noAppointments")}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          showPatient={showPatient}
          showDoctor={showDoctor}
          {...(onReschedule && {
            onReschedule: () => onReschedule(appointment.id),
          })}
          {...(onCancel && { onCancel: () => onCancel(appointment.id) })}
          {...(onJoin && { onJoin: () => onJoin(appointment.id) })}
        />
      ))}
    </div>
  );
}
