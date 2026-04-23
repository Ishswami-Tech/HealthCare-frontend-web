"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Paperclip,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useVideoAppointmentWebSocket } from "@/hooks/realtime/useVideoAppointmentSocketIO";
import {
  useSendVideoChatMessage,
  useUpdateVideoTypingIndicator,
  useVideoChatMessages,
  type ChatMessage,
} from "@/hooks/query";
import { formatTimeInIST } from "@/lib/utils/appointmentUtils";
import { showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";

interface VideoChatProps {
  appointmentId: string;
  className?: string;
}

const EMPTY_CHAT_MESSAGES: ChatMessage[] = [];

export function VideoChat({ appointmentId, className }: VideoChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers] = useState<Set<string>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    data: chatMessages,
    isPending: isLoading,
  } = useVideoChatMessages(appointmentId);
  const sendChatMessageMutation = useSendVideoChatMessage();
  const typingIndicatorMutation = useUpdateVideoTypingIndicator();

  const { subscribeToChatMessages, sendChatMessage: sendChatMessageWS, isConnected } =
    useVideoAppointmentWebSocket();

  const resolvedChatMessages = chatMessages ?? EMPTY_CHAT_MESSAGES;

  useEffect(() => {
    setMessages(resolvedChatMessages);
  }, [resolvedChatMessages]);

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToChatMessages((data) => {
      if (data.appointmentId === appointmentId && data.message) {
        const newMsg = data as unknown as ChatMessage;
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Auto-scroll to bottom
        setTimeout(() => {
          scrollAreaRef.current?.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    });

    return unsubscribe;
  }, [isConnected, appointmentId, subscribeToChatMessages, user?.id]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      void typingIndicatorMutation.mutateAsync({
        appointmentId,
        isTyping: true,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      void typingIndicatorMutation.mutateAsync({
        appointmentId,
        isTyping: false,
      });
    }, 3000);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    try {
      // Send via WebSocket for real-time
      sendChatMessageWS(appointmentId, newMessage.trim());

      // Also send via API for persistence
      const result = await sendChatMessageMutation.mutateAsync({
        appointmentId,
        message: newMessage.trim(),
      });

      if (result) {
        setNewMessage("");
        setIsTyping(false);
        void typingIndicatorMutation.mutateAsync({
          appointmentId,
          isTyping: false,
        });
        inputRef.current?.focus();
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={cn("h-full overflow-hidden border border-border bg-background shadow-sm", className)}>
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Chat</span>
          <Badge variant="outline" className="rounded-full text-[11px]">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-full min-h-0 flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 bg-background px-4" ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-2xl border border-dashed border-border bg-muted px-4 py-5 text-center">
                <p className="text-sm font-medium text-foreground">No messages yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Start the conversation in this secure session.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {messages.map((message) => {
                const isOwnMessage = message.userId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm">
                      <AvatarFallback className="text-xs">
                        {getInitials(message.user?.name || message.userId || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex max-w-[78%] flex-col gap-1 ${
                        isOwnMessage ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{message.user?.name || 'Unknown'}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTimeInIST(new Date(message.createdAt), {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                      </div>
                      <div
                        className={`rounded-2xl px-3 py-2 shadow-sm ${
                          isOwnMessage
                            ? "bg-emerald-600 text-white"
                            : "border border-border/60 bg-background text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                        {message.fileUrl && (
                          <div className="mt-2">
                            <a
                              href={message.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 rounded-xl px-2 py-1 text-xs font-medium transition-colors ${isOwnMessage ? "bg-muted hover:bg-white/15" : "bg-muted/60 hover:bg-muted"}`}
                            >
                              <Paperclip className="h-3 w-3" />
                              <span>{message.fileName || 'Attachment'}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingUsers.size > 0 && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">...</AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl border border-border/60 bg-muted px-3 py-2">
                    <p className="text-sm text-muted-foreground italic">
                      {Array.from(typingUsers).join(", ")} typing...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-background p-3">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 rounded-2xl bg-background"
              disabled={!isConnected || sendChatMessageMutation.isPending}
            />
            <Button
              onClick={() => void handleSendMessage()}
              size="icon"
              className="h-10 w-10 rounded-2xl"
              disabled={!newMessage.trim() || !isConnected || sendChatMessageMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {!isConnected && (
            <p className="mt-2 text-xs text-muted-foreground">
              Reconnecting to chat...
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            File attachments are not available in this build.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

