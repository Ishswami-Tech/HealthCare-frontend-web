import { redirect } from "next/navigation";

// DocMissedBulk (B8) was consolidated into Appointments: the "Missed appointments" view
// (`?view=NO_SHOW`) hosts both the single-row list and the bulk follow-up panel (message,
// archive, re-book). Old links land on that view instead of a separate screen.
export default function DocMissedFollowUpRedirect() {
  redirect("/doctor/appointments?view=NO_SHOW");
}
