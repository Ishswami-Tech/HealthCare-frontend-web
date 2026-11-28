import { Lock } from "lucide-react";
import { EmptyBlock, Surface, TbdPage } from "@/components/tbd";

// Product rule: the doctor never sees billing amounts or earnings (backend closes
// GET /analytics/doctor/me/earnings to DOCTOR; routes.ts lets only SUPER_ADMIN reach this path and
// no sidebar links to it). The old screen is in _removed/phase3-integ-2/doctor-earnings/. If the
// path is reached anyway (old bookmark), say so plainly instead of loading anything.
export default function DoctorEarningsRemovedPage() {
  return (
    <TbdPage title="Earnings" backHref="/doctor/dashboard" backLabel="Dashboard">
      <Surface flush>
        <EmptyBlock
          icon={Lock}
          tone="amber"
          title="Earnings are not available here"
          description="Doctor earnings and billing amounts are shown to the clinic admin only. Ask your clinic admin for a statement."
        />
      </Surface>
    </TbdPage>
  );
}
