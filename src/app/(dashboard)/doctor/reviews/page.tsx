import { redirect } from "next/navigation";

/**
 * The Reviews screen was consolidated into the doctor's Profile screen (the Reviews tab there is
 * fed by the same `useDoctorReviews` query), so this route only forwards old links to it with
 * the tab preselected (`?tab=reviews` is a deep link the profile's tab bar accepts).
 */
export default function DoctorReviewsRedirect() {
  redirect("/doctor/profile?tab=reviews");
}
