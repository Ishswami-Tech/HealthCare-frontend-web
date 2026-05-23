"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { APP_CONFIG } from "@/lib/config/config";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
  variant?: "floating" | "inline" | "compact";
  className?: string;
  showText?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

interface WhatsAppChatProps {
  phoneNumber: string;
  clinicName?: string;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Default messages in multiple languages
const BRAND_NAME = APP_CONFIG.CLINIC.APP_NAME;

const DEFAULT_MESSAGES = {
  en: `Hello! I would like to book an appointment at ${BRAND_NAME}. Please let me know the available slots.`,
  hi: "à¤¨à¤®à¤¸à¥à¤¤à¥‡! à¤®à¥ˆà¤‚ à¤¶à¥à¤°à¥€ à¤µà¤¿à¤¶à¥à¤µà¤®à¥‚à¤°à¥à¤¤à¤¿ à¤†à¤¯à¥à¤°à¥à¤µà¥‡à¤¦à¤¾à¤²à¤¯ à¤®à¥‡à¤‚ à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤¬à¥à¤• à¤•à¤°à¤¨à¤¾ à¤šà¤¾à¤¹à¤¤à¤¾ à¤¹à¥‚à¤‚à¥¤ à¤•à¥ƒà¤ªà¤¯à¤¾ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¸à¤®à¤¯ à¤¬à¤¤à¤¾à¤à¤‚à¥¤",
  mr: "à¤¨à¤®à¤¸à¥à¤•à¤¾à¤°! à¤®à¤²à¤¾ à¤¶à¥à¤°à¥€ à¤µà¤¿à¤¶à¥à¤µà¤®à¥‚à¤°à¥à¤¤à¥€ à¤†à¤¯à¥à¤°à¥à¤µà¥‡à¤¦à¤¾à¤²à¤¯à¤¾à¤¤ à¤­à¥‡à¤Ÿà¥€à¤šà¥€ à¤µà¥‡à¤³ à¤¬à¥à¤• à¤•à¤°à¤¾à¤¯à¤šà¥€ à¤†à¤¹à¥‡. à¤•à¥ƒà¤ªà¤¯à¤¾ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤µà¥‡à¤³à¤¾ à¤¸à¤¾à¤‚à¤—à¤¾.",
};

export function WhatsAppButton({
  phoneNumber,
  message,
  variant = "floating",
  className,
  showText = true,
  position = "bottom-right",
}: WhatsAppButtonProps) {
  const { t, language } = useTranslation();
  const [showChat, setShowChat] = useState(false);

  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

  // Get default message based on current language
  const defaultMessage =
    message ||
    DEFAULT_MESSAGES[language as keyof typeof DEFAULT_MESSAGES] ||
    DEFAULT_MESSAGES.en;

  const handleWhatsAppClick = () => {
    if (variant === "floating") {
      setShowChat(true);
    } else {
      openWhatsApp(defaultMessage);
    }
  };

  const openWhatsApp = (customMessage?: string) => {
    const encodedMessage = encodeURIComponent(customMessage || defaultMessage);
    const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  if (variant === "floating") {
    return (
      <>
        <button type="button"
          onClick={handleWhatsAppClick}
          className={cn(
            "fixed z-50 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110",
            positionClasses[position],
            showText ? "px-4 py-3" : "p-4",
            className
          )}
          aria-label={t("common.whatsappMessage")}
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="size-6" />
            {showText && (
              <span className="font-medium whitespace-nowrap">
                {t("common.whatsappMessage")}
              </span>
            )}
          </div>
        </button>

        {showChat && (
          <WhatsAppChat
            phoneNumber={cleanPhoneNumber}
            clinicName={BRAND_NAME}
            isOpen={showChat}
            onClose={() => setShowChat(false)}
          />
        )}
      </>
    );
  }

  if (variant === "compact") {
    return (
      <button type="button"
        onClick={handleWhatsAppClick}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors",
          className
        )}
        aria-label={t("common.whatsappMessage")}
      >
        <MessageCircle className="size-4" />
        {showText && <span className="text-sm font-medium">WhatsApp</span>}
      </button>
    );
  }

  // Inline variant
  return (
    <button type="button"
      onClick={handleWhatsAppClick}
      className={cn(
        "inline-flex items-center gap-3 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg",
        className
      )}
      aria-label={t("common.whatsappMessage")}
    >
      <MessageCircle className="size-5" />
      {showText && <span>{t("common.whatsappMessage")}</span>}
    </button>
  );
}

function WhatsAppChat({
  phoneNumber,
  clinicName,
  className,
  isOpen,
  onClose,
}: WhatsAppChatProps) {
  const { language } = useTranslation();
  const [customMessage, setCustomMessage] = useState("");

  const handleSendMessage = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  const quickMessages = [
    {
      en: "I want to book an appointment",
      hi: "à¤®à¥à¤à¥‡ à¤…à¤ªà¥‰à¤‡à¤‚à¤Ÿà¤®à¥‡à¤‚à¤Ÿ à¤¬à¥à¤• à¤•à¤°à¤¨à¤¾ à¤¹à¥ˆ",
      mr: "à¤®à¤²à¤¾ à¤­à¥‡à¤Ÿà¥€à¤šà¥€ à¤µà¥‡à¤³ à¤¬à¥à¤• à¤•à¤°à¤¾à¤¯à¤šà¥€ à¤†à¤¹à¥‡",
    },
    {
      en: "What are your consultation fees?",
      hi: "à¤†à¤ªà¤•à¥€ à¤ªà¤°à¤¾à¤®à¤°à¥à¤¶ à¤«à¥€à¤¸ à¤•à¥à¤¯à¤¾ à¤¹à¥ˆ?",
      mr: "à¤¤à¥à¤®à¤šà¥€ à¤¸à¤²à¥à¤²à¤¾à¤®à¤¸à¤²à¤¤ à¤«à¥€ à¤•à¤¿à¤¤à¥€ à¤†à¤¹à¥‡?",
    },
    {
      en: "What treatments do you offer?",
      hi: "à¤†à¤ª à¤•à¥Œà¤¨ à¤¸à¥‡ à¤‰à¤ªà¤šà¤¾à¤° à¤ªà¥à¤°à¤¦à¤¾à¤¨ à¤•à¤°à¤¤à¥‡ à¤¹à¥ˆà¤‚?",
      mr: "à¤¤à¥à¤®à¥à¤¹à¥€ à¤•à¥‹à¤£à¤¤à¥‡ à¤‰à¤ªà¤šà¤¾à¤° à¤¦à¥‡à¤¤à¤¾?",
    },
    {
      en: "What are your clinic timings?",
      hi: "à¤†à¤ªà¤•à¥‡ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤•à¤¾ à¤¸à¤®à¤¯ à¤•à¥à¤¯à¤¾ à¤¹à¥ˆ?",
      mr: "à¤¤à¥à¤®à¤šà¥à¤¯à¤¾ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤•à¤šà¥€ à¤µà¥‡à¤³ à¤•à¤¾à¤¯ à¤†à¤¹à¥‡?",
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="bg-green-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <MessageCircle className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold">{clinicName}</h3>
            <p className="text-xs opacity-90">Typically replies instantly</p>
          </div>
        </div>
        <button type="button"
          onClick={onClose}
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Close chat"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Chat Body */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="gap-y-3">
          {/* Welcome message */}
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-sm text-gray-800">
              {language === "hi"
                ? "à¤¨à¤®à¤¸à¥à¤¤à¥‡! à¤¶à¥à¤°à¥€ à¤µà¤¿à¤¶à¥à¤µà¤®à¥‚à¤°à¥à¤¤à¤¿ à¤†à¤¯à¥à¤°à¥à¤µà¥‡à¤¦à¤¾à¤²à¤¯ à¤®à¥‡à¤‚ à¤†à¤ªà¤•à¤¾ à¤¸à¥à¤µà¤¾à¤—à¤¤ à¤¹à¥ˆà¥¤ à¤¹à¤® à¤†à¤ªà¤•à¥€ à¤•à¥ˆà¤¸à¥‡ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤•à¤° à¤¸à¤•à¤¤à¥‡ à¤¹à¥ˆà¤‚?"
                : language === "mr"
                ? "à¤¨à¤®à¤¸à¥à¤•à¤¾à¤°! à¤¶à¥à¤°à¥€ à¤µà¤¿à¤¶à¥à¤µà¤®à¥‚à¤°à¥à¤¤à¥€ à¤†à¤¯à¥à¤°à¥à¤µà¥‡à¤¦à¤¾à¤²à¤¯à¤¾à¤¤ à¤¤à¥à¤®à¤šà¥‡ à¤¸à¥à¤µà¤¾à¤—à¤¤ à¤†à¤¹à¥‡. à¤†à¤®à¥à¤¹à¥€ à¤¤à¥à¤®à¥à¤¹à¤¾à¤²à¤¾ à¤•à¤¶à¥€ à¤®à¤¦à¤¤ à¤•à¤°à¥‚ à¤¶à¤•à¤¤à¥‹?"
                : `Hello! Welcome to ${BRAND_NAME}. How can we help you today?`}
            </p>
          </div>

          {/* Quick message buttons */}
          <div className="gap-y-2">
            <p className="text-xs text-gray-500 font-medium">Quick messages:</p>
            {quickMessages.map((msg) => (
              <button type="button"
                key={msg.en}
                onClick={() =>
                  handleSendMessage(msg[language as keyof typeof msg] || msg.en)
                }
                className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                {msg[language as keyof typeof msg] || msg.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Message Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            aria-label="Custom message"
            placeholder={
              language === "hi"
                ? "à¤…à¤ªà¤¨à¤¾ à¤¸à¤‚à¤¦à¥‡à¤¶ à¤²à¤¿à¤–à¥‡à¤‚..."
                : language === "mr"
                ? "à¤¤à¥à¤®à¤šà¤¾ à¤¸à¤‚à¤¦à¥‡à¤¶ à¤²à¤¿à¤¹à¤¾..."
                : "Type your message..."
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === "Enter" && customMessage.trim()) {
                handleSendMessage(customMessage);
              }
            }}
          />
          <button type="button"
            onClick={() =>
              customMessage.trim() && handleSendMessage(customMessage)
            }
            disabled={!customMessage.trim()}
            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


