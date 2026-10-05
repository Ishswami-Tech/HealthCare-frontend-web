"use client";

import * as React from "react";
import { MessageCircle, Mic, MicOff, Send, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CALL_FOCUS, CALL_HIT_44 } from "./call-theme";
import { getCallInitials, type CallChatMessage, type CallWaitingPerson } from "./call-types";

/**
 * Frame of the side panel (chat or participants).
 * `room` = attached to the doctor room (close button, no icon);
 * `patient` = the separate rounded card of the patient screen (icon in the title).
 */
export function CallSidePanel({
  title,
  variant = "room",
  icon,
  onClose,
  children,
}: {
  title: string;
  variant?: "room" | "patient";
  icon?: "chat" | "people";
  onClose: () => void;
  children: React.ReactNode;
}) {
  const TitleIcon = icon === "people" ? Users : MessageCircle;
  return (
    <section aria-label={title} className="flex h-full min-h-0 w-full flex-col bg-[#131c2e] text-white">
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-3 border-b",
          variant === "patient" ? "min-h-[61px] border-white/[0.08] px-5 py-[13px]" : "border-white/[0.09] px-[18px] py-4",
        )}
      >
        <h2 className="flex min-w-0 items-center gap-2.5 text-[16px] font-bold">
          {variant === "patient" ? <TitleIcon className="size-[18px] shrink-0" aria-hidden="true" /> : null}
          <span className="truncate">{title}</span>
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title.toLowerCase()}`}
          title="Close"
          className={cn(
            "flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#9aa7bd] transition-colors hover:bg-white/[0.12] hover:text-white",
            CALL_FOCUS,
            CALL_HIT_44,
            // On wide screens the patient closes the card with the Chat button (as in the design).
            variant === "patient" && "lg:hidden",
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </section>
  );
}

/** In-call messages. Sending is the caller's job (`onSend`); this only keeps the draft text. */
export function CallChatPanel({
  messages,
  onSend,
  variant = "room",
  emptyTitle = "No messages yet",
  emptyDescription,
  notice,
  placeholder,
}: {
  messages: CallChatMessage[];
  onSend: (text: string) => void;
  variant?: "room" | "patient";
  emptyTitle?: string;
  emptyDescription: string;
  /** Small note above the messages (who can see them). */
  notice?: string;
  placeholder: string;
}) {
  const [draft, setDraft] = React.useState("");
  const endRef = React.useRef<HTMLDivElement>(null);
  const isPatient = variant === "patient";

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);

  return (
    <>
      {notice ? (
        <p className="mx-4 mt-[14px] shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-center text-[12px] leading-[1.5] text-[#9aa7bd]">
          {notice}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Messages">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-3 text-center">
            <span className="flex size-[52px] items-center justify-center rounded-full bg-white/10">
              <MessageCircle className="size-[22px] text-[#cbd5e1]" aria-hidden="true" />
            </span>
            <p className="text-[14px] font-bold text-white">{emptyTitle}</p>
            <p className="text-[13px] leading-[1.5] text-[#cbd5e1]">{emptyDescription}</p>
          </div>
        ) : (
          messages.map((message) =>
            message.isMine ? (
              <div key={message.id} className="flex flex-col items-end gap-1">
                <p className="max-w-[78%] break-words rounded-[16px_4px_16px_16px] bg-[#047857] px-3 py-[9px] text-[13px] font-medium leading-[1.5] text-white">
                  {message.text}
                </p>
                <span className="text-[11px] text-[#9aa7bd]">
                  <span className="sr-only">You, </span>
                  {message.timeLabel}
                </span>
              </div>
            ) : (
              <div key={message.id} className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#334155] text-[11px] font-extrabold text-[#e2e8f0]"
                >
                  {getCallInitials(message.senderName)}
                </span>
                <div className="flex max-w-[78%] min-w-0 flex-col gap-1">
                  <span className="flex min-w-0 items-baseline gap-2 text-[11px] text-[#9aa7bd]">
                    <b className="min-w-0 truncate font-bold text-[#e2e8f0]">{message.senderName}</b>
                    {message.timeLabel ? <span className="shrink-0 whitespace-nowrap">{message.timeLabel}</span> : null}
                  </span>
                  <p className="break-words rounded-[4px_16px_16px_16px] border border-white/[0.09] bg-[#1f2a44] px-3 py-[9px] text-[13px] leading-[1.5] text-white">
                    {message.text}
                  </p>
                </div>
              </div>
            ),
          )
        )}
        <div ref={endRef} />
      </div>

      <form
        className={cn(
          "flex shrink-0 items-center border-t",
          isPatient ? "gap-2 border-white/[0.08] p-[14px]" : "gap-2.5 border-white/[0.09] px-4 py-[14px]",
        )}
        onSubmit={(event) => {
          event.preventDefault();
          const text = draft.trim();
          if (!text) return;
          onSend(text);
          setDraft("");
        }}
      >
        <input
          name="message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          aria-label="Message"
          autoComplete="off"
          className={cn(
            "min-h-[44px] min-w-0 flex-1 text-[13px] text-white outline-none transition-colors placeholder:text-[#9aa7bd] focus-visible:ring-2 focus-visible:ring-[#a5b4fc]",
            isPatient
              ? "rounded-[22px] bg-white/10 px-4 placeholder:text-[#cbd5e1]"
              : "rounded-xl border border-white/[0.09] bg-[#1f2a44] px-[14px]",
          )}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          title="Send message"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center bg-[#047857] text-white transition-colors hover:bg-[#065f46] disabled:cursor-not-allowed disabled:opacity-60",
            isPatient ? "rounded-full" : "rounded-xl",
            CALL_FOCUS,
          )}
        >
          <Send className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
        </button>
      </form>
    </>
  );
}

/** One person in the "In call" list. */
export function CallParticipantRow({
  name,
  isLocal = false,
  isMuted = false,
  isActiveSpeaker = false,
}: {
  name: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isActiveSpeaker?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-2.5 rounded-[14px] border px-3 py-2.5",
        isActiveSpeaker ? "border-[#818cf8]/50 bg-[#818cf8]/[0.1]" : "border-white/[0.09] bg-white/[0.03]",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#334155] text-[12px] font-extrabold text-[#e2e8f0]"
      >
        {getCallInitials(name)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-semibold text-white">{name}</span>
        {isLocal ? <span className="text-[11px] font-medium text-[#9aa7bd]">You</span> : null}
        {isActiveSpeaker ? <span className="sr-only">Speaking</span> : null}
      </span>
      {isMuted ? (
        <MicOff className="size-4 shrink-0 text-[#fb7185]" strokeWidth={2.2} aria-label="Microphone off" />
      ) : (
        <Mic className="size-4 shrink-0 text-[#6ee7b7]" strokeWidth={2.2} aria-label="Microphone on" />
      )}
    </li>
  );
}

/** People waiting to be let in, and everyone in the call (`children` = `CallParticipantRow`s). */
export function CallParticipantsPanel({
  waiting,
  onAdmit,
  onDeny,
  inCallCount,
  children,
}: {
  waiting: CallWaitingPerson[];
  onAdmit: (id: string) => void;
  onDeny: (id: string) => void;
  inCallCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      {waiting.length > 0 ? (
        <>
          <h3 className="text-[11px] font-extrabold uppercase tracking-[1px] text-[#9aa7bd]">
            Waiting to join · {waiting.length}
          </h3>
          <ul className="flex flex-col gap-2">
            {waiting.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-2.5 rounded-[14px] border border-[#818cf8]/40 bg-[#818cf8]/[0.1] px-3 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#3730a3] text-[12px] font-extrabold text-[#e0e7ff]"
                >
                  {getCallInitials(person.name)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">{person.name}</span>
                <button
                  type="button"
                  onClick={() => onDeny(person.id)}
                  aria-label={`Deny ${person.name}`}
                  className={cn(
                    "inline-flex min-h-[32px] shrink-0 items-center rounded-[9px] border border-[#f43f5e]/40 bg-[#f43f5e]/10 px-3 text-[12px] font-bold text-[#fda4af] transition-colors hover:bg-[#f43f5e]/20",
                    CALL_FOCUS,
                    CALL_HIT_44,
                  )}
                >
                  Deny
                </button>
                <button
                  type="button"
                  onClick={() => onAdmit(person.id)}
                  aria-label={`Admit ${person.name}`}
                  className={cn(
                    "inline-flex min-h-[32px] shrink-0 items-center rounded-[9px] bg-[#047857] px-3 text-[12px] font-bold text-white transition-colors hover:bg-[#065f46]",
                    CALL_FOCUS,
                    CALL_HIT_44,
                  )}
                >
                  Admit
                </button>
              </li>
            ))}
          </ul>
          <span className="h-1.5 shrink-0" aria-hidden="true" />
        </>
      ) : null}

      <h3 className="text-[11px] font-extrabold uppercase tracking-[1px] text-[#9aa7bd]">In call · {inCallCount}</h3>
      <ul className="flex flex-col gap-3">{children}</ul>
    </div>
  );
}
