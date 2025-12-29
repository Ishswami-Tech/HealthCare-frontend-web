"use client";

import React, { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
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
const DEFAULT_MESSAGES = {
  en: "Hello! I would like to book an appointment at Shri Vishwamurti Ayurvedalay. Please let me know the available slots.",
  hi: "नमस्ते! मैं श्री विश्वमूर्ति आयुर्वेदालय में अपॉइंटमेंट बुक करना चाहता हूं। कृपया उपलब्ध समय बताएं।",
  mr: "नमस्कार! मला श्री विश्वमूर्ती आयुर्वेदालयात भेटीची वेळ बुक करायची आहे. कृपया उपलब्ध वेळा सांगा.",
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
        <button
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
            <MessageCircle className="w-6 h-6" />
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
            clinicName="Shri Vishwamurti Ayurvedalay"
            isOpen={showChat}
            onClose={() => setShowChat(false)}
          />
        )}
      </>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleWhatsAppClick}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors",
          className
        )}
        aria-label={t("common.whatsappMessage")}
      >
        <MessageCircle className="w-4 h-4" />
        {showText && <span className="text-sm font-medium">WhatsApp</span>}
      </button>
    );
  }

  // Inline variant
  return (
    <button
      onClick={handleWhatsAppClick}
      className={cn(
        "inline-flex items-center gap-3 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg",
        className
      )}
      aria-label={t("common.whatsappMessage")}
    >
      <MessageCircle className="w-5 h-5" />
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
      hi: "मुझे अपॉइंटमेंट बुक करना है",
      mr: "मला भेटीची वेळ बुक करायची आहे",
    },
    {
      en: "What are your consultation fees?",
      hi: "आपकी परामर्श फीस क्या है?",
      mr: "तुमची सल्लामसलत फी किती आहे?",
    },
    {
      en: "What treatments do you offer?",
      hi: "आप कौन से उपचार प्रदान करते हैं?",
      mr: "तुम्ही कोणते उपचार देता?",
    },
    {
      en: "What are your clinic timings?",
      hi: "आपके क्लिनिक का समय क्या है?",
      mr: "तुमच्या क्लिनिकची वेळ काय आहे?",
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
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">{clinicName}</h3>
            <p className="text-xs opacity-90">Typically replies instantly</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Body */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {/* Welcome message */}
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-sm text-gray-800">
              {language === "hi"
                ? "नमस्ते! श्री विश्वमूर्ति आयुर्वेदालय में आपका स्वागत है। हम आपकी कैसे सहायता कर सकते हैं?"
                : language === "mr"
                ? "नमस्कार! श्री विश्वमूर्ती आयुर्वेदालयात तुमचे स्वागत आहे. आम्ही तुम्हाला कशी मदत करू शकतो?"
                : "Hello! Welcome to Shri Vishwamurti Ayurvedalay. How can we help you today?"}
            </p>
          </div>

          {/* Quick message buttons */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">Quick messages:</p>
            {quickMessages.map((msg, index) => (
              <button
                key={index}
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
            placeholder={
              language === "hi"
                ? "अपना संदेश लिखें..."
                : language === "mr"
                ? "तुमचा संदेश लिहा..."
                : "Type your message..."
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === "Enter" && customMessage.trim()) {
                handleSendMessage(customMessage);
              }
            }}
          />
          <button
            onClick={() =>
              customMessage.trim() && handleSendMessage(customMessage)
            }
            disabled={!customMessage.trim()}
            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
