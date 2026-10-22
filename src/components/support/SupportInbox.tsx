"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Inbox, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, InitialsAvatar, LoadError, Pill, SkeletonRows, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { formatDateTimeLabel } from "@/lib/utils/date-time";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useReplySupportThread, useSupportThread, useSupportThreads } from "@/hooks/query/useSupport";
import { orderedSupportMessages, threadNeedsReply } from "@/lib/support/support-chat.logic";
import type { SupportThread } from "@/types/support.types";
import { SupportComposer } from "./SupportComposer";
import { SupportMessageList } from "./SupportMessageList";

/** The newest message of a thread, for the list preview. */
function lastMessageOf(thread: SupportThread) {
  return thread.messages[thread.messages.length - 1] ?? null;
}

function ThreadList({
  threads,
  selectedId,
  onSelect,
}: {
  threads: SupportThread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {threads.map((thread) => {
        const last = lastMessageOf(thread);
        const name = thread.patientName || "Patient";
        const selected = thread.id === selectedId;
        return (
          <li key={thread.id} className="border-b border-hair last:border-b-0">
            <button
              type="button"
              onClick={() => onSelect(thread.id)}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left text-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
                selected ? "bg-mint-soft" : "hover:bg-well",
              )}
            >
              <InitialsAvatar name={name} size={40} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold">{name}</span>
                  {thread.lastMessageAt ? (
                    <span className="shrink-0 text-[11px] text-ink-muted">{formatDateTimeLabel(thread.lastMessageAt)}</span>
                  ) : null}
                </span>
                <span className="truncate text-xs text-ink-muted">{last ? last.body : thread.subject || "No messages yet"}</span>
                {thread.needsReply ? (
                  <Pill tone="amber" className="mt-1 self-start">
                    Needs reply
                  </Pill>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ThreadPane({
  clinicId,
  summary,
  onBack,
}: {
  clinicId: string;
  summary: SupportThread;
  onBack: () => void;
}) {
  const { data: full } = useSupportThread(clinicId, summary.id);
  const reply = useReplySupportThread(clinicId);
  // The list may carry only the latest message; the full thread (or the answer of a reply) adds the rest.
  const messages = useMemo(
    () => orderedSupportMessages([...summary.messages, ...(full?.messages ?? [])]),
    [summary.messages, full?.messages],
  );
  const name = summary.patientName || full?.patientName || "Patient";
  const partial = !full;

  return (
    <Surface as="section" aria-label={`Conversation with ${name}`} className="min-h-[420px]">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack} aria-label="Back to all messages">
          <ChevronLeft aria-hidden="true" />
        </Button>
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="m-0 truncate text-base font-bold text-ink">{name}</h2>
          {summary.subject ? <span className="truncate text-xs text-ink-muted">{summary.subject}</span> : null}
        </div>
        {threadNeedsReply(messages) ? <Pill tone="amber">Needs reply</Pill> : null}
      </div>
      {partial && messages.length <= 1 ? (
        <p className="m-0 text-xs text-ink-muted">Showing the latest message. Earlier messages appear after you reply.</p>
      ) : null}
      <SupportMessageList
        messages={messages}
        viewer="STAFF"
        patientName={name}
        emptyText="No messages in this conversation yet."
        className="max-h-[480px] min-h-[200px] flex-1 rounded-2xl border border-hair p-3"
      />
      <SupportComposer
        label={`Reply to ${name}`}
        placeholder="Write a reply to the patient"
        isSending={reply.isPending}
        onSend={(body) => reply.mutateAsync({ threadId: summary.id, body })}
      />
    </Surface>
  );
}

/**
 * Patient messages (help chat) for the front desk and the clinic admin: the clinic's open
 * threads, newest first, with a "Needs reply" badge; open one to read and reply. Polls every 15 s.
 */
export function SupportInbox() {
  const clinicId = useCurrentClinicId();
  const { data, isPending, error, refetch, isFetching } = useSupportThreads(clinicId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const threads = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) => Number(b.needsReply) - Number(a.needsReply) || (Date.parse(b.lastMessageAt ?? "") || 0) - (Date.parse(a.lastMessageAt ?? "") || 0),
      ),
    [data],
  );
  const selected = threads.find((thread) => thread.id === selectedId) ?? null;
  const waiting = threads.filter((thread) => thread.needsReply).length;

  if (error && !data) {
    return (
      <LoadError
        title="Patient messages could not be loaded"
        message={error.message}
        onRetry={() => void refetch()}
        retrying={isFetching}
      />
    );
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <Surface as="section" aria-labelledby="support-inbox-title" className={cn("gap-2 pb-2", selected ? "hidden lg:flex" : "")}>
        <div className="flex items-center justify-between gap-2">
          <h2 id="support-inbox-title" className="m-0 text-base font-bold text-ink">
            Conversations
          </h2>
          {waiting > 0 ? <Pill tone="amber">{waiting} waiting</Pill> : null}
        </div>
        {isPending && !data ? (
          <SkeletonRows rows={4} />
        ) : threads.length === 0 ? (
          <EmptyBlock icon={Inbox} title="No open conversations" description="Messages patients send from the Help page show here." />
        ) : (
          <ThreadList threads={threads} selectedId={selectedId} onSelect={setSelectedId} />
        )}
      </Surface>

      {selected ? (
        <ThreadPane key={selected.id} clinicId={clinicId} summary={selected} onBack={() => setSelectedId(null)} />
      ) : (
        <Surface className="hidden lg:flex">
          <EmptyBlock icon={MessageSquareText} title="Choose a conversation" description="Pick a patient on the left to read and reply." />
        </Surface>
      )}
    </div>
  );
}
