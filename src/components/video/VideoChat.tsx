"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Smile,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVideoAppointmentWebSocket } from "@/hooks/useVideoAppointmentSocketIO";
import {
  sendChatMessage,
  getChatMessages,
  updateTypingIndicator,
  type ChatMessage,
} from "@/lib/actions/video-enhanced.server";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface VideoChatProps {
  appointmentId: string;
  className?: string;
}

export function VideoChat({ appointmentId, className }: VideoChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { subscribeToChatMessages, sendChatMessage: sendChatMessageWS, sendTypingIndicator, isConnected } =
    useVideoAppointmentWebSocket();

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const result = await getChatMessages(appointmentId, { limit: 50 });
        if (result && result.messages) {
          setMessages(result.messages);
        }
      } catch (error) {
        console.error("Failed to load chat messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [appointmentId]);

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
      updateTypingIndicator(appointmentId, true).catch(console.error);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingIndicator(appointmentId, false).catch(console.error);
    }, 3000);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    try {
      // Send via WebSocket for real-time
      sendChatMessageWS(appointmentId, newMessage.trim());

      // Also send via API for persistence
      const result = await sendChatMessage(appointmentId, {
        message: newMessage.trim(),
        messageType: 'TEXT',
      });

      if (result) {
        setNewMessage("");
        setIsTyping(false);
        updateTypingIndicator(appointmentId, false).catch(console.error);
        inputRef.current?.focus();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Handle file attachment (placeholder)
  const handleFileAttach = () => {
    // TODO: Implement file upload
    toast({
      title: "Coming Soon",
      description: "File attachment feature will be available soon",
    });
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
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Chat</span>
          <Badge variant="outline" className="text-xs">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[400px]">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isOwnMessage = message.userId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(message.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex flex-col gap-1 max-w-[70%] ${
                        isOwnMessage ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{message.user?.name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), "HH:mm")}
                        </span>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        {message.fileUrl && (
                          <div className="mt-2">
                            <a
                              href={message.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs opacity-90 hover:opacity-100"
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
                  <div className="bg-muted rounded-lg px-3 py-2">
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
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleFileAttach}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
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
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1"
              disabled={!isConnected}
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="h-9 w-9"
              disabled={!newMessage.trim() || !isConnected}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {!isConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              Reconnecting to chat...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

