"use client";

export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof window.gtag !== "undefined") {
    window.gtag("event", eventName, {
      event_category: "engagement",
      event_label: parameters?.label || "",
      value: parameters?.value || 0,
      ...parameters,
    });
  }
}

export function trackConversion(conversionType: string, value?: number) {
  trackEvent("conversion", {
    event_category: "conversion",
    event_label: conversionType,
    value: value || 0,
  });
}
