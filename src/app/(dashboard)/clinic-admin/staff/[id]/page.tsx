"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Eye, FilePen, History, MapPin, Minus, ShieldCheck, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChoiceChip,
  EmptyBlock,
  FactTile,
  InitialsAvatar,
  ListRow,
  LoadError,
  Note,
  Pill,
  SectionTitle,
  SkeletonRows,
  StatTile,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { AssignRoleModal } from "@/components/clinic/AssignRoleModal";
import { LeaveDecisionCard, leaveRangeLabel } from "@/components/clinic-admin/LeaveDecisionCard";
import { MATRIX_ROLES, MATRIX_ROWS, matrixLevel, type MatrixLevel, type MatrixRole } from "@/components/clinic-admin/roles-matrix.logic";
import { roleLabel } from "@/components/billing/staff/billing.logic";
import {
  useChangeStaffLocation,
  useClinicAudit,
  useLeaveRequests,
  useStaffLocationId,
  useStaffMember,
} from "@/hooks/query/useClinicStaffAdmin";
import { useClinicLocations, useCurrentClinicId } from "@/hooks/query/useClinics";
import { formatDateLabel, formatDateTimeLabel } from "@/lib/utils/date-time";
import { Role } from "@/types/auth.types";

const LEVEL_ICON: Record<MatrixLevel, typeof Check> = { FULL: Check, VIEW: Eye, DRAFT: FilePen, NONE: Minus };

// CaStaffDetail (B2): profile, location allotment (a receptionist works at ONE location), leave,
// activity, permissions, change role / deactivate.
export default function CaStaffDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = String(params?.id ?? "");
  const clinicId = useCurrentClinicId();
  const member = useStaffMember(userId);
  const isReceptionist = member.data?.role === Role.RECEPTIONIST;
  const currentLocation = useStaffLocationId(userId, isReceptionist);
  const locations = useClinicLocations(clinicId);
  const changeLocation = useChangeStaffLocation();
  const pendingLeave = useLeaveRequests({ userId, status: "PENDING" });
  const activity = useClinicAudit({ entityId: userId, limit: 10 }, Boolean(userId));
  const [locationId, setLocationId] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);

  useEffect(() => {
    if (currentLocation.data) setLocationId(currentLocation.data);
  }, [currentLocation.data]);

  if (member.error && !member.data) {
    return (
      <TbdPage title="Staff member" backHref="/clinic-admin/staff" backLabel="Staff">
        <LoadError title="Staff member could not be loaded" message={member.error.message} onRetry={() => void member.refetch()} />
      </TbdPage>
    );
  }
  const m = member.data;
  if (!m) {
    return (
      <TbdPage title="Staff member" backHref="/clinic-admin/staff" backLabel="Staff">
        <Surface>
          <SkeletonRows rows={5} />
        </Surface>
      </TbdPage>
    );
  }

  const upcoming = m.upcomingLeave ?? [];
  const matrixRole = (MATRIX_ROLES as readonly string[]).includes(m.role) ? (m.role as MatrixRole) : null;
  const locationName = (id: string | null | undefined) => locations.data?.find((entry) => entry.id === id)?.name ?? "Not allotted";

  return (
    <TbdPage
      title={
        <span className="flex items-center gap-3">
          <InitialsAvatar name={m.name} size={44} /> {m.name}
        </span>
      }
      description={
        <span className="flex items-center gap-2">
          <Pill tone="teal">{roleLabel(m.role)}</Pill>
          {m.isActive ? m.onLeaveToday ? <Pill tone="amber">On leave today</Pill> : <Pill tone="green">Active</Pill> : <Pill tone="slate">Inactive</Pill>}
        </span>
      }
      backHref="/clinic-admin/staff"
      backLabel="Staff"
      actions={
        m.role !== Role.DOCTOR ? (
          <Button variant="outline" size="md" onClick={() => setRoleOpen(true)}>
            <UserCog aria-hidden="true" /> Change role or deactivate
          </Button>
        ) : null
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Pending leave" tone="amber" value={m.pendingLeaveRequests ?? 0} />
        <StatTile label="Upcoming leave" value={upcoming.length} />
        <StatTile label="Last sign-in" value={m.lastLogin ? formatDateLabel(m.lastLogin) : "Never"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Profile">
            <SectionTitle title="Profile" />
            <div className="grid gap-3 sm:grid-cols-2">
              <FactTile label="Mobile" value={m.phone ?? "—"} />
              <FactTile label="Email" value={m.email ?? "—"} />
              <FactTile label="Joined" value={m.joinedAt ? formatDateLabel(m.joinedAt) : "—"} />
              <FactTile label="Last sign-in" value={m.lastLogin ? formatDateTimeLabel(m.lastLogin) : "Never"} />
            </div>
          </Surface>

          <Surface as="section" aria-label="Location">
            <SectionTitle title="Location" icon={MapPin} />
            {isReceptionist ? (
              <>
                <p className="mb-2 text-sm text-ink-soft">
                  A receptionist is allotted to ONE location and sees all of its appointments. Now: <strong>{currentLocation.isPending ? "…" : locationName(currentLocation.data)}</strong>
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Allotted location">
                  {(locations.data ?? []).map((location) => (
                    <ChoiceChip key={location.id} active={locationId === location.id} onClick={() => setLocationId(location.id)}>
                      {location.name}
                    </ChoiceChip>
                  ))}
                </div>
                <Button
                  className="mt-3"
                  size="sm"
                  disabled={!locationId || locationId === currentLocation.data || changeLocation.isPending}
                  onClick={() => changeLocation.mutate({ userId, locationId })}
                >
                  {changeLocation.isPending ? "Saving…" : "Allot to this location"}
                </Button>
              </>
            ) : (
              <Note tone="blue">Only receptionists are tied to one location. Other roles work across the clinic&apos;s locations.</Note>
            )}
          </Surface>

          <Surface as="section" aria-label="Leave">
            <SectionTitle title="Leave" />
            {pendingLeave.isPending ? (
              <SkeletonRows rows={2} />
            ) : (
              <div className="flex flex-col gap-3">
                {(pendingLeave.data ?? []).map((leave) => (
                  <LeaveDecisionCard key={leave.id} leave={leave} showProfileLink={false} />
                ))}
                {upcoming
                  .filter((leave) => leave.status === "APPROVED")
                  .map((leave) => (
                    <ListRow key={leave.id} title={`${leave.kind.replace("_", " ").toLowerCase()} · ${leaveRangeLabel(leave)}`} right={<Pill tone="green">Approved</Pill>} />
                  ))}
                {(pendingLeave.data ?? []).length === 0 && upcoming.length === 0 ? <p className="text-sm text-ink-muted">No upcoming leave.</p> : null}
              </div>
            )}
          </Surface>

          <Surface as="section" aria-label="Recent activity">
            <SectionTitle title="Recent activity" icon={History} />
            {activity.isPending ? (
              <SkeletonRows rows={3} />
            ) : (activity.data ?? []).length === 0 ? (
              <EmptyBlock icon={History} title="No recorded activity" />
            ) : (
              (activity.data ?? []).map((event) => (
                <ListRow key={event.id} title={event.action.replace(/_/g, " ").toLowerCase()} description={`${event.entityType} · ${formatDateTimeLabel(event.at)}`} />
              ))
            )}
          </Surface>
        </div>

        <Surface as="section" aria-label="Permissions" className="h-fit">
          <SectionTitle
            title="Permissions"
            icon={ShieldCheck}
            action={
              <Link href="/clinic-admin/roles" className="text-[13px] font-bold text-brand">
                Full matrix
              </Link>
            }
          />
          {matrixRole ? (
            MATRIX_ROWS.map((row) => {
              const level = matrixLevel(row, matrixRole);
              const Icon = LEVEL_ICON[level];
              return (
                <div key={row.label} className="flex items-center gap-2 border-b border-hair py-2 text-sm last:border-b-0">
                  <Icon className={`size-4 ${level === "NONE" ? "text-ink-muted" : "text-brand"}`} aria-hidden="true" />
                  <span className={level === "NONE" ? "text-ink-muted" : "text-ink"}>{row.label}</span>
                  {level === "DRAFT" ? <Pill tone="amber">Draft</Pill> : null}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-ink-muted">See the full matrix for this role.</p>
          )}
        </Surface>
      </div>

      {roleOpen ? (
        <AssignRoleModal
          open
          onOpenChange={(open) => !open && setRoleOpen(false)}
          staffMember={{ id: userId, name: m.name, email: m.email ?? "", role: m.role, status: m.isActive ? "Active" : "Inactive" }}
          currentUserRole={Role.CLINIC_ADMIN}
          clinicId={clinicId || undefined}
          onSuccess={() => void member.refetch()}
        />
      ) : null}
    </TbdPage>
  );
}
