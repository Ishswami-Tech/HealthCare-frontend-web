import { redirect } from "next/navigation";

// Drafts now live on the Prescriptions screen (Drafts tab). Old links keep working:
// they land on that tab of the list instead of a separate inbox.
export default function DocDraftsPage() {
  redirect("/doctor/prescriptions?status=draft");
}
