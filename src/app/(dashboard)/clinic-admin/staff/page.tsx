"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MailPlus, RefreshCw, ShieldCheck, UserPlus, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CellTitle,
  EmptyBlock,
  FilterChips,
  GridHead,
  GridRow,
  InitialsAvatar,
  LoadError,
  Pager,
  Pill,
  SearchBox,
  SectionTitle,
  SkeletonRows,
  StatTile,
  Surface,
  TbdPage,
  usePagedRows,
} from "@/components/tbd";
import { AssignRoleModal } from "@/components/clinic/AssignRoleModal";
import { AddStaffModal } from "@/components/clinic/AddStaffModal";
import { roleLabel } from "@/components/billing/staff/billing.logic";
import { useStaffInviteAction, useStaffInvites, useStaffMembers } from "@/hooks/query/useClinicStaffAdmin";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { formatDateLabel, formatDateTimeLabel } from "@/lib/utils/date-time";
import { Role } from "@/types/auth.types";
import type { StaffMember } from "@/types/clinic-admin-ops.types";

const COLUMNS = "minmax(0,1.8fr) minmax(0,1.2fr) minmax(0,1.3fr) minmax(0,1fr) minmax(0,0.9fr)";
type RoleFilter = "ALL" | "DOCTOR" | "ASSISTANT_DOCTOR" | "RECEPTIONIST" | "PHARMACIST" | "NURSE" | "CLINIC_ADMIN";

const statusPill = (member: StaffMember) =>
  !member.isActive ? <Pill tone="slate">Inactive</Pill> : member.onLeaveToday ? <Pill tone="amber">On leave</Pill> : <Pill tone="green">Active</Pill>;

// CaStaff (B2): the clinic team, pending invites, links to profile / invite / roles matrix.
export default function CaStaffPage() {
  const clinicId = useCurrentClinicId();
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");
  const [assign, setAssign] = useState<StaffMember | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const members = useStaffMembers();
  const invites = useStaffInvites("PENDING");
  const inviteAction = useStaffInviteAction();

  const all = useMemo(() => members.data ?? [], [members.data]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter(
      (member) =>
        (role === "ALL" || member.role === role) &&
        (!term || `${member.name} ${member.phone ?? ""} ${member.email ?? ""}`.toLowerCase().includes(term)),
    );
  }, [all, role, search]);
  const paging = usePagedRows(filtered, 25, { resetKey: `${role}|${search}` });
  const count = (value: RoleFilter) => (value === "ALL" ? all.length : all.filter((member) => member.role === value).length);
  const pendingInvites = invites.data ?? [];

  return (
    <TbdPage
      title="Your clinic team"
      description={`${all.length} members${pendingInvites.length ? ` · ${pendingInvites.length} invited` : ""}`}
      actions={
        <>
          <Button asChild variant="outline" size="md">
            <Link href="/clinic-admin/roles">
              <ShieldCheck aria-hidden="true" /> Roles & permissions
            </Link>
          </Button>
          <Button variant="outline" size="md" onClick={() => setAddOpen(true)}>
            <UserPlus aria-hidden="true" /> Create account
          </Button>
          <Button asChild size="md">
            <Link href="/clinic-admin/staff/new">
              <MailPlus aria-hidden="true" /> Invite staff
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Team members" value={members.isPending ? "…" : all.length} />
        <StatTile tone="brand" label="Active" value={all.filter((member) => member.isActive).length} />
        <StatTile tone="amber" label="On leave today" value={all.filter((member) => member.onLeaveToday).length} />
        <StatTile tone="blue" label="Pending invites" value={invites.isPending ? "…" : pendingInvites.length} />
      </div>

      <Surface flush as="section" aria-label="Staff">
        <div className="flex flex-col gap-3 border-b border-hair p-4 lg:flex-row lg:items-center">
          <SearchBox value={search} onChange={setSearch} placeholder="Search name, phone or email" ariaLabel="Search staff" className="lg:max-w-xs" />
          <FilterChips
            ariaLabel="Role"
            value={role}
            onChange={setRole}
            options={(["ALL", "DOCTOR", "ASSISTANT_DOCTOR", "RECEPTIONIST", "PHARMACIST", "NURSE", "CLINIC_ADMIN"] as RoleFilter[]).map((value) => ({
              value,
              label: value === "ALL" ? "All" : roleLabel(value),
              count: count(value),
            }))}
          />
        </div>
        {members.isPending ? (
          <div className="p-5">
            <SkeletonRows rows={6} />
          </div>
        ) : members.error ? (
          <div className="p-5">
            <LoadError title="Staff could not be loaded" message={members.error.message} onRetry={() => void members.refetch()} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyBlock icon={Users} title="No staff match" description="Change the filters or invite a team member." />
        ) : (
          <div role="table" aria-label="Staff members">
            <GridHead columns={COLUMNS} labels={["Member", "Role", "Contact", "Last sign-in", "Status"]} />
            {paging.pageRows.map((member) => (
              <GridRow key={member.userId} columns={COLUMNS}>
                <Link href={`/clinic-admin/staff/${member.userId}`} className="min-w-0 hover:underline">
                  <CellTitle left={<InitialsAvatar name={member.name} size={36} />} title={member.name} />
                </Link>
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <Pill tone="teal">{roleLabel(member.role)}</Pill>
                  {member.role !== Role.DOCTOR ? (
                    <button type="button" className="shrink-0 text-xs font-bold text-brand hover:underline" onClick={() => setAssign(member)}>
                      Change
                    </button>
                  ) : null}
                </span>
                <span className="min-w-0 truncate text-ink-soft">{member.phone ?? member.email ?? "—"}</span>
                <span className="text-ink-soft">{member.lastLogin ? formatDateTimeLabel(member.lastLogin) : "Never"}</span>
                {statusPill(member)}
              </GridRow>
            ))}
            <div className="p-4">
              <Pager paging={paging} noun="members" hideWhenSinglePage id="ca-staff-pager" />
            </div>
          </div>
        )}
      </Surface>

      <Surface as="section" aria-label="Pending invites">
        <SectionTitle title="Pending invites" icon={MailPlus} count={pendingInvites.length} />
        {invites.isPending ? (
          <SkeletonRows rows={2} />
        ) : pendingInvites.length === 0 ? (
          <p className="text-sm text-ink-muted">No invites waiting.</p>
        ) : (
          pendingInvites.map((invite) => (
            <div key={invite.id} className="flex flex-wrap items-center gap-3 border-b border-hair py-2.5 last:border-b-0">
              <InitialsAvatar name={invite.name ?? invite.phone ?? "Invite"} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-ink">{invite.name ?? invite.phone ?? invite.email}</span>
                <span className="text-xs text-ink-muted">
                  {roleLabel(invite.role)} · expires {formatDateLabel(invite.expiresAt)} · sent {invite.resendCount + 1}×
                </span>
              </span>
              <Button size="sm" variant="outline" disabled={inviteAction.isPending} onClick={() => inviteAction.mutate({ inviteId: invite.id, action: "resend" })}>
                <RefreshCw aria-hidden="true" /> Resend
              </Button>
              <Button size="sm" variant="ghost" disabled={inviteAction.isPending} onClick={() => inviteAction.mutate({ inviteId: invite.id, action: "revoke" })}>
                <XCircle aria-hidden="true" /> Revoke
              </Button>
            </div>
          ))
        )}
      </Surface>

      {assign ? (
        <AssignRoleModal
          open
          onOpenChange={(open) => !open && setAssign(null)}
          staffMember={{ id: assign.userId, name: assign.name, email: assign.email ?? "", role: assign.role, status: assign.isActive ? "Active" : "Inactive" }}
          currentUserRole={Role.CLINIC_ADMIN}
          clinicId={clinicId || undefined}
          onSuccess={() => void members.refetch()}
        />
      ) : null}
      <AddStaffModal open={addOpen} onOpenChange={setAddOpen} onSuccess={() => void members.refetch()} />
    </TbdPage>
  );
}
