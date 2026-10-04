"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, CircleAlert, Lock, Plus, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, IconBox, InitialsAvatar, PageHead, Pill, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { FamilyMember } from "@/types/patient-visit.types";
import { ageLabel, genderLabel, memberName } from "./family.logic";

const CARD =
  "flex min-w-0 flex-col gap-4 rounded-[20px] bg-card p-[18px] text-ink shadow-card dark:border dark:border-border/70";
const FOCUS =
  "transition-shadow hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40";
const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

export type FamilyMembersState = "loading" | "error" | "ready";

/** The signed-in patient, shown as the first card. */
export interface FamilyAccountHolder {
  name: string;
  avatarUrl?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
}

export interface FamilyMembersViewProps {
  state: FamilyMembersState;
  you: FamilyAccountHolder;
  members: FamilyMember[];
  onAdd: () => void;
  onRetry?: () => void;
}

/** Age and gender of one person. A missing value reads "Not set". */
function FactsWell({ dateOfBirth, gender }: { dateOfBirth?: string | null; gender?: string | null }) {
  const facts = [
    { label: "Age", value: ageLabel(dateOfBirth) },
    { label: "Gender", value: genderLabel(gender) },
  ];
  return (
    <span className="grid grid-cols-2 rounded-[14px] bg-[#f3f7fd] py-2.5 dark:bg-white/5">
      {facts.map((fact, index) => (
        <span
          key={fact.label}
          className={cn("flex min-w-0 flex-col gap-0.5 px-3.5", index === 0 && "border-r border-line")}
        >
          <span className="text-xs text-ink-muted">{fact.label}</span>
          {fact.value ? (
            <span className="truncate text-sm font-bold">{fact.value}</span>
          ) : (
            <span className="text-sm font-semibold text-ink-muted">Not set</span>
          )}
        </span>
      ))}
    </span>
  );
}

function YouAvatar({ you }: { you: FamilyAccountHolder }) {
  const [failed, setFailed] = useState(false);
  if (you.avatarUrl && !failed) {
    return (
      <Image
        src={you.avatarUrl}
        alt=""
        width={56}
        height={56}
        unoptimized
        onError={() => setFailed(true)}
        className="size-14 shrink-0 rounded-full border-[3px] border-[#d1fae5] object-cover dark:border-emerald-500/30"
      />
    );
  }
  return <InitialsAvatar name={you.name} size={56} className="border-[3px] border-[#d1fae5] dark:border-emerald-500/30" />;
}

function AddMemberCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className={cn(
        "flex min-h-[150px] min-w-0 flex-col items-center justify-center gap-2.5 rounded-[20px] border-2 border-dashed border-[#6ee7b7] bg-[#ecfdf5] p-[18px] text-sm font-bold text-[#047857] transition-colors hover:bg-[#d1fae5]",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
        "dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50",
      )}
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white dark:bg-white/10"
        aria-hidden="true"
      >
        <Plus className="size-5" strokeWidth={2.6} />
      </span>
      Add family member
    </button>
  );
}

function PrivacyCard() {
  return (
    <div className="flex min-w-0 items-center gap-3.5 rounded-[20px] border border-white bg-white/60 p-[18px] dark:border-border/70 dark:bg-white/5">
      <IconBox icon={Lock} tone="mint" />
      <p className="m-0 text-[13px] leading-normal text-ink-muted">
        Only you and your clinic can see the family members you add here.
      </p>
    </div>
  );
}

/** Family Members: the patient first, then every member, then the add card. */
export function FamilyMembersView({ state, you, members, onAdd, onRetry }: FamilyMembersViewProps) {
  return (
    <>
      <PageHead
        title="Family Members"
        description="Keep the details of the people you look after"
        backHref="/patient/dashboard"
      />

      {state === "loading" ? (
        <div className={GRID} aria-busy="true" aria-label="Loading your family members">
          {[0, 1, 2].map((index) => (
            <div key={index} className={CARD}>
              <div className="flex items-center gap-3.5">
                <Skeleton className="size-14 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/5 rounded-md" />
                  <Skeleton className="h-3 w-2/5 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-[62px] rounded-[14px]" />
            </div>
          ))}
        </div>
      ) : state === "error" ? (
        <Surface flush>
          <EmptyBlock
            icon={CircleAlert}
            tone="rose"
            title="We could not load your family members"
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
      ) : members.length === 0 ? (
        <>
          <Surface flush>
            <EmptyBlock
              icon={Users}
              title="No family members yet"
              description="Add the people you look after, like a parent or a child. Your clinic will see them on your family card."
              action={
                <Button size="md" onClick={onAdd}>
                  <Plus aria-hidden="true" />
                  Add family member
                </Button>
              }
            />
          </Surface>
          <PrivacyCard />
        </>
      ) : (
        <div className={GRID}>
          <Link href="/patient/profile" className={cn(CARD, FOCUS)} aria-label={`${you.name || "You"}, your profile`}>
            <span className="flex items-center gap-3.5">
              <YouAvatar you={you} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15px] font-bold">{you.name || "You"}</span>
                <span className="text-[13px] text-ink-muted">You</span>
              </span>
              <Pill tone="green">Primary</Pill>
            </span>
            <FactsWell dateOfBirth={you.dateOfBirth} gender={you.gender} />
          </Link>

          {members.map((member) => {
            const name = memberName(member);
            return (
              <Link key={member.id} href={`/patient/family/${encodeURIComponent(member.id)}`} className={cn(CARD, FOCUS)}>
                <span className="flex items-center gap-3.5">
                  <InitialsAvatar name={name} size={56} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[15px] font-bold">{name}</span>
                    <span className="truncate text-[13px] text-ink-muted">{member.relation}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
                </span>
                <FactsWell dateOfBirth={member.dateOfBirth} gender={member.gender} />
              </Link>
            );
          })}

          <AddMemberCard onAdd={onAdd} />
          <PrivacyCard />
        </div>
      )}
    </>
  );
}
