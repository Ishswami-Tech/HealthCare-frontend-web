"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Divider, Pill, Surface, type TbdIcon } from "@/components/tbd";
import { pharmacistInitials, type PharmacistProfileForm } from "./pharmacist-profile.logic";

function ContactLine({ icon: Icon, children }: { icon: TbdIcon; children: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5 text-[13px] text-ink-soft">
      <Icon className="size-4 shrink-0 text-brand" strokeWidth={2} aria-hidden="true" />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

/** Right-hand card: photo or initials, name, role tags and contact lines. */
export function PharmacistProfileSummaryCard({
  form,
  photoUrl,
  isVerified,
  loading = false,
}: {
  form: PharmacistProfileForm;
  photoUrl?: string | undefined;
  isVerified: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Surface as="aside" aria-label="Profile summary" aria-busy="true" className="gap-[18px] p-[22px]">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-5 w-36 rounded" />
          <div className="flex gap-1.5">
            <Skeleton className="h-[22px] w-24 rounded-lg" />
            <Skeleton className="h-[22px] w-20 rounded-lg" />
          </div>
        </div>
        <Divider />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-4 w-3/5 rounded" />
        </div>
      </Surface>
    );
  }

  const fullName = `${form.firstName} ${form.lastName}`.trim();
  const location = form.city && form.state ? `${form.city}, ${form.state}` : "No location added";

  return (
    <Surface as="aside" aria-label="Profile summary" className="gap-[18px] p-[22px]">
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar className="size-24">
          {photoUrl ? <AvatarImage src={photoUrl} alt="" className="object-cover" /> : null}
          <AvatarFallback className="bg-[#ccfbf1] text-[34px] font-extrabold text-[#0f766e] dark:bg-teal-500/15 dark:text-teal-300">
            {pharmacistInitials(form)}
          </AvatarFallback>
        </Avatar>
        <h2 className="m-0 text-lg font-extrabold tracking-[-0.2px] text-ink">{fullName || "Pharmacist"}</h2>
        <div className="flex flex-wrap justify-center gap-1.5">
          <Pill tone="clinic">Pharmacist</Pill>
          <Pill tone={isVerified ? "green" : "slate"}>{isVerified ? "Verified" : "Unverified"}</Pill>
        </div>
      </div>
      <Divider />
      <div className="flex flex-col gap-3">
        <ContactLine icon={Mail}>{form.email || "No email added"}</ContactLine>
        <ContactLine icon={Phone}>{form.phone || "No phone added"}</ContactLine>
        <ContactLine icon={MapPin}>{location}</ContactLine>
      </div>
    </Surface>
  );
}
