import { redirect } from "next/navigation";

// The assistant's prescriptions are drafts for the doctor (AsDrafts).
export default function AssistantDoctorPrescriptionsPage() {
  redirect("/assistant-doctor/drafts");
}
