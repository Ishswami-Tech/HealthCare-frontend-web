"use client";

import { TbdPage } from "@/components/tbd";
import { SupportInbox } from "@/components/support/SupportInbox";

/** RecMessages: patients' help-chat conversations the front desk answers (`/support/threads`). */
export default function ReceptionistMessagesPage() {
  return (
    <TbdPage title="Patient messages" description="Questions patients sent from the Help page. Reply here; they see it in their chat.">
      <SupportInbox />
    </TbdPage>
  );
}
