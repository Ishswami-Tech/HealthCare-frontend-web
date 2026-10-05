import { redirect } from "next/navigation";

/**
 * No-show follow-up lives on the Appointments page ("No Show" view), where the
 * same rows carry the call and book-again actions. Old links land there.
 */
export default function NoShowRedirectPage() {
  redirect("/doctor/appointments?view=NO_SHOW");
}
