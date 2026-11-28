import { redirect } from "next/navigation";

// Product rule: no vitals capture anywhere. The old screen is kept in _removed/phase3-integ-2/nurse-vitals/.
export default function NurseVitalsRemovedPage(): never {
  redirect("/nurse/dashboard");
}
