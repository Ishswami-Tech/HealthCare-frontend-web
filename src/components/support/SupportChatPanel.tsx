"use client";

import { useState } from "react";
import { MessageSquareText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadErrorNote, SkeletonRows, Surface } from "@/components/tbd";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useMySupportThread, useSendSupportMessage } from "@/hooks/query/useSupport";
import { SUPPORT_QUICK_REPLIES } from "@/lib/support/support-chat.logic";
import type { SupportQuickReply } from "@/types/support.types";
import { SupportComposer } from "./SupportComposer";
import { SupportMessageList } from "./SupportMessageList";

/**
 * Patient help chat (same as the mobile SupportChat): quick-reply chips answered by the Care
 * assistant, free text, and "Talk to a person" for the clinic team. Polls every 15 s.
 */
export function SupportChatPanel({ className }: { className?: string }) {
  const clinicId = useCurrentClinicId();
  const { data: thread, isPending, error, refetch } = useMySupportThread(clinicId);
  const send = useSendSupportMessage(clinicId);
  const [chipError, setChipError] = useState<string | null>(null);

  const sendChip = (key: SupportQuickReply, body: string) => {
    setChipError(null);
    send.mutateAsync({ body, quickReply: key }).catch((failure: unknown) => {
      setChipError(failure instanceof Error && failure.message ? failure.message : "The message could not be sent. Please try again.");
    });
  };

  return (
    <Surface as="section" aria-labelledby="support-chat-title" className={className}>
      <div className="flex items-center gap-2.5">
        <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-mint-soft text-brand" aria-hidden="true">
          <MessageSquareText className="size-[18px]" strokeWidth={2.2} />
        </span>
        <div className="flex min-w-0 flex-col">
          <h2 id="support-chat-title" className="m-0 text-base font-bold text-ink">
            Chat with the clinic
          </h2>
          <span className="text-xs text-ink-muted">The Care assistant answers right away; the clinic team replies here too.</span>
        </div>
      </div>

      {!clinicId ? (
        <p className="m-0 text-[13px] text-ink-muted">Chat opens once you are registered with a clinic.</p>
      ) : error && !thread ? (
        <LoadErrorNote
          title="We could not load the chat"
          message={error.message}
          onRetry={() => void refetch()}
          icon={RefreshCw}
        />
      ) : isPending && !thread ? (
        <SkeletonRows rows={3} />
      ) : (
        <>
          <SupportMessageList
            messages={thread?.messages ?? []}
            viewer="PATIENT"
            emptyText="Ask a question or pick a topic below."
            className="max-h-[420px] min-h-[160px] rounded-2xl border border-hair p-3"
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick questions">
            {SUPPORT_QUICK_REPLIES.map((chip) => (
              <Button
                key={chip.key}
                type="button"
                variant="soft"
                size="sm"
                disabled={send.isPending}
                onClick={() => sendChip(chip.key, chip.body)}
              >
                {chip.label}
              </Button>
            ))}
          </div>
          {chipError ? (
            <p role="alert" className="m-0 text-[12px] font-semibold text-[#be123c] dark:text-rose-300">
              {chipError}
            </p>
          ) : null}
          <SupportComposer
            label="Message to the clinic"
            placeholder="Type your message"
            isSending={send.isPending}
            onSend={(body) => send.mutateAsync({ body })}
          />
        </>
      )}
    </Surface>
  );
}
