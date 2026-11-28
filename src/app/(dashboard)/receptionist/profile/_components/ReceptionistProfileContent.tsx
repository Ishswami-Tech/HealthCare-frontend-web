"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InitialsAvatar, LoadErrorNote, Pill, SectionTitle, Surface, TbdPage } from "@/components/tbd";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { useHashTab } from "@/hooks/navigation/useHashTab";
import { useUpdateUserProfile, useUserProfile } from "@/hooks/query/useUsers";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { ReceptionCanDoList } from "@/components/receptionist/ReceptionNotes";
import { useReceptionLocation } from "@/components/receptionist/useReceptionDesk";
// The staff profile pieces the pharmacist profile already has (same /users/profile form and the
// shared change-password flow); reception reuses them instead of keeping its own copy.
import { PharmacistProfilePersonalCard } from "../../../pharmacist/profile/_components/PharmacistProfilePersonalCard";
import { PharmacistProfileSecurityCard } from "../../../pharmacist/profile/_components/PharmacistProfileSecurityCard";
import {
  toPharmacistProfileForm,
  toPharmacistProfilePayload,
  type PharmacistProfileForm,
} from "../../../pharmacist/profile/_components/pharmacist-profile.logic";

const TABS = ["personal", "security"] as const;

function ProfileForm({ userProfile, loading }: { userProfile: unknown; loading: boolean }) {
  const updateProfile = useUpdateUserProfile();
  const [form, setForm] = useState<PharmacistProfileForm>(() => toPharmacistProfileForm(userProfile));
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { tab, setTab } = useHashTab({ tabs: TABS, defaultValue: "personal" });
  const { locationName } = useReceptionLocation();
  const name = `${form.firstName} ${form.lastName}`.trim();

  const save = async () => {
    try {
      const result = (await updateProfile.mutateAsync(toPharmacistProfilePayload(form))) as
        | { success?: boolean; error?: string }
        | undefined;
      if (!result?.success) {
        showErrorToast(result?.error || "Your profile could not be saved.", { id: TOAST_IDS.PROFILE.UPDATE });
        return;
      }
      showSuccessToast("Profile saved", { id: TOAST_IDS.PROFILE.UPDATE });
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.PROFILE.UPDATE });
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Tabs value={tab} onValueChange={setTab} className="min-w-0 gap-5">
        <TabsList>
          <TabsTrigger value="personal">Personal info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <PharmacistProfilePersonalCard
            form={form}
            onFieldChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
            onSubmit={() => void save()}
            saving={updateProfile.isPending}
            loading={loading}
            unavailable={false}
          />
        </TabsContent>
        <TabsContent value="security">
          <PharmacistProfileSecurityCard
            loading={loading}
            passwordDialogOpen={passwordOpen}
            onPasswordDialogChange={setPasswordOpen}
            changePasswordForm={passwordOpen ? <ChangePasswordForm /> : null}
          />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-5">
        <Surface as="aside" aria-label="Profile summary" className="items-center gap-3 text-center">
          <InitialsAvatar name={name || "Reception"} size={80} />
          <h2 className="m-0 text-lg font-extrabold text-ink">{name || "Reception"}</h2>
          <div className="flex flex-wrap justify-center gap-1.5">
            <Pill tone="clinic">Front desk</Pill>
            <Pill tone="slate">
              <MapPin className="size-3" aria-hidden="true" /> {locationName}
            </Pill>
          </div>
        </Surface>
        <Surface as="section" aria-label="What reception can do">
          <SectionTitle title="What reception can do" />
          <ReceptionCanDoList />
        </Surface>
      </div>
    </div>
  );
}

/** RecProfile: the receptionist's own details, password, and what the desk can do. */
export default function ReceptionistProfileContent() {
  const { data: userProfile, isPending, isFetching, error, refetch } = useUserProfile();
  return (
    <TbdPage title="Reception profile" description="Update your details. Save keeps the current tab open.">
      {error && !userProfile ? (
        <LoadErrorNote
          title="Your profile could not be loaded."
          message={error.message}
          onRetry={() => void refetch()}
        />
      ) : null}
      <ProfileForm
        // The form starts from the loaded profile, so it is mounted again once the profile arrives.
        key={userProfile ? "loaded" : "pending"}
        userProfile={userProfile}
        loading={isPending && isFetching}
      />
    </TbdPage>
  );
}
