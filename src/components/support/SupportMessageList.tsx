"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { formatDateTimeLabel } from "@/lib/utils/date-time";
import { SUPPORT_SENDER_LABEL } from "@/lib/support/support-chat.logic";
import type { SupportMessage, SupportSender } from "@/types/support.types";

export interface SupportMessageListProps {
  messages: SupportMessage[];
  /** Whose messages sit on the right: the patient's own chat, or the staff inbox. */
  viewer: "PATIENT" | "STAFF";
  /** Name shown on the patient's bubbles in the staff inbox. */
  patientName?: string;
  emptyText: string;
  className?: string;
}

function senderLabel(sender: SupportSender, viewer: SupportMessageListProps["viewer"], patientName?: string): string {
  if (sender === "PATIENT") return viewer === "PATIENT" ? "You" : patientName || SUPPORT_SENDER_LABEL.PATIENT;
  return SUPPORT_SENDER_LABEL[sender];
}

/** Chat bubbles, oldest first, scrolled to the newest message. */
export function SupportMessageList({ messages, viewer, patientName, emptyText, className }: SupportMessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastId = messages[messages.length - 1]?.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [lastId]);

  if (messages.length === 0) {
    return <p className={cn("m-0 py-8 text-center text-[13px] text-ink-muted", className)}>{emptyText}</p>;
  }

  return (
    <div className={cn("flex flex-col gap-2.5 overflow-y-auto", className)} role="log" aria-live="polite" aria-relevant="additions">
      {messages.map((message) => {
        const own = viewer === "PATIENT" ? message.senderType === "PATIENT" : message.senderType === "STAFF";
        return (
          <div key={message.id} className={cn("flex max-w-[85%] flex-col gap-1", own ? "self-end items-end" : "self-start items-start")}>
            <span className="text-[11px] font-bold text-ink-muted">
              {senderLabel(message.senderType, viewer, patientName)}
              {message.at ? ` · ${formatDateTimeLabel(message.at)}` : ""}
            </span>
            <span
              className={cn(
                "whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-[1.5]",
                own
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : message.senderType === "ASSISTANT"
                    ? "rounded-bl-md bg-mint-soft text-ink"
                    : "rounded-bl-md bg-well text-ink",
              )}
            >
              {message.body}
            </span>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
