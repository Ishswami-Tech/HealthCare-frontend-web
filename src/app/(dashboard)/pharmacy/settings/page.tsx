import { redirect } from "next/navigation";

// PhInventorySettings (B9): the Settings tab of the pharmacy inventory is this screen; its stock
// alert and auto reorder rows open /pharmacy/alert-settings.
export default function PhInventorySettingsPage() {
  redirect("/pharmacy#settings");
}
