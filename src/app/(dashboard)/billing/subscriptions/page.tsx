import { redirect } from "next/navigation";

/**
 * Subscriptions used to be managed on their own page, separate from the Plans tab. They are
 * now one view (the active subscription, with cancel/renew, sits above the plan grid on
 * `/billing`), so this route just forwards old links/bookmarks there instead of 404ing.
 */
export default function BillingSubscriptionsRedirectPage() {
  redirect("/billing?tab=plans");
}
