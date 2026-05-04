import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/actions/auth.server";
import { Role } from "@/types/auth.types";

function getAppointmentsRouteByRole(role?: string): string {
  const normalizedRole = String(role || "").trim().toUpperCase();

  switch (normalizedRole) {
    case Role.PATIENT:
      return "/patient/appointments";
    case Role.RECEPTIONIST:
      return "/receptionist/appointments";
    case Role.DOCTOR:
      return "/doctor/appointments";
    case Role.ASSISTANT_DOCTOR:
      return "/assistant-doctor/appointments";
    case Role.CLINIC_LOCATION_HEAD:
      return "/clinic-location-head/appointments";
    case Role.THERAPIST:
      return "/therapist/appointments";
    case Role.COUNSELOR:
      return "/counselor/appointments";
    case Role.CLINIC_ADMIN:
    case Role.SUPER_ADMIN:
      return "/video-appointments";
    default:
      return "/patient/appointments";
  }
}

export default async function AppointmentsPage() {
  const session = await getServerSession();
  const role = session?.user?.role;

  redirect(getAppointmentsRouteByRole(role));
}
