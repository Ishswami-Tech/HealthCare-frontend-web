"use client";

import Link from "next/link";
import { CalendarDays, CircleAlert, FileText, Pencil, RefreshCw, Trash2, UserX, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, IconBox, InitialsAvatar, PageHead, Pill, SoftCard, Surface, type IconTone, type TbdIcon } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { FamilyMember } from "@/types/patient-visit.types";
import { ageLabel, dateLabel, genderLabel, memberName } from "./family.logic";

const FAMILY_HREF = "/patient/family";

/** Opens the booking wizard on the appointments page with this family member chosen. */
function bookVideoVisitHref(memberId: string): string {
  return `/patient/appointments?openBooking=1&familyMemberId=${encodeURIComponent(memberId)}`;
}

export type FamilyMemberState = "loading" | "error" | "missing" | "ready";

export interface FamilyMemberViewProps {
  state: FamilyMemberState;
  member: FamilyMember | null;
  onEdit: () => void;
  onRemove: () => void;
  onRetry?: () => void;
}

function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-14 items-center justify-between gap-4 py-2 text-sm",
        !last && "border-b border-hair",
      )}
    >
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      {value ? (
        <dd className="m-0 min-w-0 break-words text-right font-bold text-ink">{value}</dd>
      ) : (
        <dd className="m-0 text-right font-semibold text-ink-muted">Not set</dd>
      )}
    </div>
  );
}

/** Something the patient cannot do online for a family member yet. */
function NotYetRow({
  icon,
  tone,
  title,
  description,
  last = false,
}: {
  icon: TbdIcon;
  tone: IconTone;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <li className={cn("flex items-start gap-3.5 py-3.5", !last && "border-b border-hair")}>
      <IconBox icon={icon} tone={tone} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-ink">{title}</span>
          <Pill tone="slate">Not online yet</Pill>
        </span>
        <span className="text-xs leading-normal text-ink-muted">{description}</span>
      </span>
    </li>
  );
}

/** One family member: who they are, their details, and what can be done for them. */
export function FamilyMemberView({ state, member, onEdit, onRemove, onRetry }: FamilyMemberViewProps) {
  const head = <PageHead title="Family member" backHref={FAMILY_HREF} />;

  if (state === "loading") {
    return (
      <>
        {head}
        <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading this family member">
          <Skeleton className="h-[122px] rounded-3xl" />
          <div className="grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-[220px] rounded-[20px]" />
            <Skeleton className="h-[220px] rounded-[20px]" />
          </div>
        </div>
      </>
    );
  }

  if (state === "error") {
    return (
      <>
        {head}
        <Surface flush>
          <EmptyBlock
            icon={CircleAlert}
            tone="rose"
            title="We could not load this family member"
            description="Check your connection and try again."
            action={
              onRetry ? (
                <Button variant="outline" size="md" onClick={onRetry}>
                  <RefreshCw aria-hidden="true" />
                  Try again
                </Button>
              ) : undefined
            }
          />
        </Surface>
      </>
    );
  }

  if (state === "missing" || !member) {
    return (
      <>
        {head}
        <Surface flush>
          <EmptyBlock
            icon={UserX}
            tone="slate"
            title="Family member not found"
            description="They may have been removed, or the link is wrong."
            action={
              <Button variant="outline" size="md" asChild>
                <Link href={FAMILY_HREF}>Back to family members</Link>
              </Button>
            }
          />
        </Surface>
      </>
    );
  }

  const name = memberName(member);
  const firstName = member.firstName?.trim() || name;
  const stats = [
    { label: "Age", value: ageLabel(member.dateOfBirth) },
    { label: "Gender", value: genderLabel(member.gender) },
    { label: "Born", value: dateLabel(member.dateOfBirth) },
  ];

  return (
    <>
      {head}

      <SoftCard as="section" aria-label={name}>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
          <div className="flex min-w-0 flex-1 basis-[260px] items-center gap-4">
            <InitialsAvatar name={name} size={72} className="border-[3px] border-white dark:border-white/20" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="m-0 break-words text-[22px] font-extrabold leading-tight tracking-[-0.3px] text-ink">
                {name}
              </h2>
              <span className="text-[13px] text-ink-muted">{member.relation} · Linked to your account</span>
            </div>
          </div>

          <dl className="m-0 grid w-full grid-cols-[1fr_1fr_1.3fr] rounded-2xl bg-white/[0.72] py-3.5 sm:w-auto sm:min-w-[360px] sm:grid-cols-[auto_auto_auto] dark:bg-white/5">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-0.5 px-2 text-center sm:px-5",
                  index < stats.length - 1 && "border-r border-[rgba(4,120,87,0.18)] dark:border-white/10",
                )}
              >
                <dt className="text-xs text-ink-muted">{stat.label}</dt>
                {stat.value ? (
                  <dd
                    className={cn(
                      "m-0 whitespace-nowrap font-extrabold text-ink",
                      // The date is longer than the other two values, so it is set a little smaller.
                      stat.label === "Born" ? "text-[15px] leading-[1.45]" : "text-base leading-[1.35] sm:text-lg sm:leading-[1.2]",
                    )}
                  >
                    {stat.value}
                  </dd>
                ) : (
                  <dd className="m-0 text-sm font-semibold leading-[1.55] text-ink-muted">Not set</dd>
                )}
              </div>
            ))}
          </dl>

          <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
            <Button variant="action" size="md" className="h-auto min-h-11 basis-full whitespace-normal py-2 sm:basis-auto" asChild>
              <Link href={bookVideoVisitHref(member.id)}>
                <Video aria-hidden="true" />
                Book a video visit for {firstName}
              </Link>
            </Button>
            <Button variant="outline" size="md" className="flex-1 sm:flex-none" onClick={onEdit}>
              <Pencil aria-hidden="true" />
              Edit details
            </Button>
            <Button variant="danger" size="md" className="flex-1 sm:flex-none" onClick={onRemove}>
              <Trash2 aria-hidden="true" />
              Remove
            </Button>
          </div>
        </div>
      </SoftCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <Surface as="section" className="gap-1 pb-2" aria-labelledby="family-member-details">
          <h2 id="family-member-details" className="m-0 text-base font-bold text-ink">
            Details
          </h2>
          <dl className="m-0 flex flex-col">
            <DetailRow label="Phone" value={member.phone?.trim() ?? ""} />
            <DetailRow label="Notes" value={member.notes?.trim() ?? ""} />
            <DetailRow label="Added on" value={dateLabel(member.createdAt)} last />
          </dl>
        </Surface>

        <Surface as="section" className="gap-1 pb-2" aria-labelledby="family-member-care">
          <h2 id="family-member-care" className="m-0 text-base font-bold text-ink">
            Visits and records
          </h2>
          <ul className="m-0 flex list-none flex-col p-0">
            <NotYetRow
              icon={CalendarDays}
              tone="blue"
              title={`Clinic visit for ${firstName}`}
              description={`Video visits can be booked above. For a visit at the clinic, ask your clinic to book it. They can pick ${firstName} from your family card.`}
            />
            <NotYetRow
              icon={FileText}
              tone="orange"
              title="Reports and medicines"
              description={`Your clinic keeps them on ${firstName}'s own record. You cannot open them here yet.`}
              last
            />
          </ul>
        </Surface>
      </div>
    </>
  );
}
