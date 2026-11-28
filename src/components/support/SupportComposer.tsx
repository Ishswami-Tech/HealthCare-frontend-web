"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_MAX_MESSAGE, supportMessageToSend } from "@/lib/support/support-chat.logic";

export interface SupportComposerProps {
  /** Resolves when the message was sent (the field is then cleared); rejects to keep the text. */
  onSend: (body: string) => Promise<unknown>;
  isSending: boolean;
  placeholder: string;
  label: string;
  disabled?: boolean;
}

/** The message field and Send button of the help chat. Enter sends, Shift+Enter adds a line. */
export function SupportComposer({ onSend, isSending, placeholder, label, disabled = false }: SupportComposerProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const body = supportMessageToSend(text);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!body || isSending || disabled) return;
    setError(null);
    onSend(body)
      .then(() => setText(""))
      .catch((failure: unknown) => {
        setError(failure instanceof Error && failure.message ? failure.message : "The message could not be sent. Please try again.");
      });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      <div className="flex items-end gap-2">
        <Textarea
          aria-label={label}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          maxLength={SUPPORT_MAX_MESSAGE}
          rows={2}
          disabled={disabled}
          className="min-h-[48px] flex-1 resize-none"
        />
        <Button type="submit" size="md" disabled={!body || isSending || disabled} aria-label="Send">
          {isSending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          Send
        </Button>
      </div>
      {error ? (
        <p role="alert" className="m-0 text-[12px] font-semibold text-[#be123c] dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </form>
  );
}
