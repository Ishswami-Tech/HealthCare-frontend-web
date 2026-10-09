"use client";

import { useState } from "react";
import { Globe, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PROFILE_LABEL, ProfileCard, ProfileField } from "./DoctorProfileParts";
import {
  PROFILE_LANGUAGES,
  type LocalizedHighlightDraft,
  type LocalizedLanguageDraft,
  type LocalizedProfileDraft,
  type ProfileLanguageCode,
} from "./doctor-profile-localized";

interface DoctorProfileLocalizedCardProps {
  value: LocalizedProfileDraft;
  onChange: (next: LocalizedProfileDraft) => void;
}

const MAX_HIGHLIGHTS = 20;

/** Public profile text patients see in their own language (name, headline and highlight lines). */
export function DoctorProfileLocalizedCard({ value, onChange }: DoctorProfileLocalizedCardProps) {
  const [active, setActive] = useState<ProfileLanguageCode>("en");
  const group = value[active];

  const updateGroup = (patch: Partial<LocalizedLanguageDraft>) =>
    onChange({ ...value, [active]: { ...group, ...patch } });

  const updateHighlight = (index: number, patch: Partial<LocalizedHighlightDraft>) =>
    updateGroup({
      highlights: group.highlights.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });

  return (
    <ProfileCard
      icon={Globe}
      title="Public profile (English / हिंदी / मराठी)"
      description="Patients see this on your booking card in the language they use. Empty languages fall back to English."
    >
      <div role="tablist" aria-label="Profile language" className="flex flex-wrap gap-2">
        {PROFILE_LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={active === code}
            onClick={() => setActive(code)}
            className={cn(
              "min-h-[34px] rounded-[10px] border px-3.5 text-[13px] font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
              active === code
                ? "border-brand bg-mint-soft text-brand-dark"
                : "border-line bg-card text-ink-soft hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        <ProfileField label="Display name" htmlFor={`localized-name-${active}`}>
          <Input
            id={`localized-name-${active}`}
            value={group.name}
            maxLength={120}
            onChange={(e) => updateGroup({ name: e.target.value })}
          />
        </ProfileField>
        <ProfileField label="Headline" htmlFor={`localized-headline-${active}`}>
          <Input
            id={`localized-headline-${active}`}
            value={group.headline}
            maxLength={300}
            onChange={(e) => updateGroup({ headline: e.target.value })}
          />
        </ProfileField>
      </div>

      <div className="flex flex-col gap-2">
        <span className={PROFILE_LABEL}>Highlights</span>
        {group.highlights.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              aria-label={`Highlight ${index + 1} emoji`}
              placeholder="🏅"
              className="w-14 shrink-0 px-2 text-center"
              value={item.icon}
              maxLength={8}
              onChange={(e) => updateHighlight(index, { icon: e.target.value })}
            />
            <Input
              aria-label={`Highlight ${index + 1} text`}
              className="min-w-0 flex-1"
              value={item.text}
              maxLength={200}
              onChange={(e) => updateHighlight(index, { text: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Remove highlight ${index + 1}`}
              onClick={() => updateGroup({ highlights: group.highlights.filter((_, i) => i !== index) })}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="outline"
            className="h-[34px]"
            disabled={group.highlights.length >= MAX_HIGHLIGHTS}
            onClick={() => updateGroup({ highlights: [...group.highlights, { icon: "", text: "" }] })}
          >
            <Plus aria-hidden="true" />
            Add highlight
          </Button>
        </div>
      </div>
    </ProfileCard>
  );
}
