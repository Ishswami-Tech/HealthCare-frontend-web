"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accessibility,
  EyeOff,
  Type,
  Contrast,
  Volume2,
  Settings,
  X,
} from "lucide-react";

// ============================================================================
// ACCESSIBILITY SETTINGS CONTEXT
// ============================================================================

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

const AccessibilityContext = React.createContext<{
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
}>({
  settings: {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
  },
  updateSetting: () => {},
});

export const useAccessibility = () => React.useContext(AccessibilityContext);

// ============================================================================
// ACCESSIBILITY PROVIDER
// ============================================================================

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
  });

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    // Apply settings to document
    const root = document.documentElement;

    switch (key) {
      case "highContrast":
        root.classList.toggle("high-contrast", value);
        break;
      case "largeText":
        root.classList.toggle("large-text", value);
        break;
      case "reducedMotion":
        root.classList.toggle("reduced-motion", value);
        break;
      case "screenReader":
        root.setAttribute("aria-live", value ? "polite" : "off");
        break;
      case "keyboardNavigation":
        root.classList.toggle("keyboard-navigation", value);
        break;
    }

    // Save to localStorage
    localStorage.setItem(
      "accessibility-settings",
      JSON.stringify({ ...settings, [key]: value })
    );
  };

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem("accessibility-settings");
    if (saved) {
      const parsedSettings = JSON.parse(saved);
      setSettings(parsedSettings);

      // Apply saved settings
      Object.entries(parsedSettings).forEach(([key, value]) => {
        updateSetting(key as keyof AccessibilitySettings, value as boolean);
      });
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const prefersHighContrast = window.matchMedia(
      "(prefers-contrast: high)"
    ).matches;

    if (prefersReducedMotion) {
      updateSetting("reducedMotion", true);
    }
    if (prefersHighContrast) {
      updateSetting("highContrast", true);
    }
  }, []);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// ============================================================================
// ACCESSIBILITY TOOLBAR
// ============================================================================

export const AccessibilityToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSetting } = useAccessibility();

  const toggles = [
    {
      key: "highContrast" as const,
      label: "High Contrast",
      icon: Contrast,
      description: "Increase color contrast for better visibility",
    },
    {
      key: "largeText" as const,
      label: "Large Text",
      icon: Type,
      description: "Increase text size for easier reading",
    },
    {
      key: "reducedMotion" as const,
      label: "Reduced Motion",
      icon: EyeOff,
      description: "Minimize animations and transitions",
    },
    {
      key: "screenReader" as const,
      label: "Screen Reader",
      icon: Volume2,
      description: "Optimize for screen reader compatibility",
    },
    {
      key: "keyboardNavigation" as const,
      label: "Keyboard Navigation",
      icon: Settings,
      description: "Enhanced keyboard navigation support",
    },
  ];

  return (
    <>
      {/* Accessibility Button */}
      <motion.div
        className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
          aria-label="Open accessibility settings"
        >
          <Accessibility className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Accessibility Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50"
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <Card className="w-80 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Accessibility Settings
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      aria-label="Close accessibility settings"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {toggles.map((toggle) => {
                      const IconComponent = toggle.icon;
                      const isEnabled = settings[toggle.key];

                      return (
                        <div
                          key={toggle.key}
                          className="flex items-start space-x-3"
                        >
                          <Button
                            variant={isEnabled ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              updateSetting(toggle.key, !isEnabled)
                            }
                            className={`flex-shrink-0 ${
                              isEnabled
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                            aria-pressed={isEnabled}
                          >
                            <IconComponent className="w-4 h-4" />
                          </Button>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {toggle.label}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {toggle.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Settings are automatically saved and will persist across
                      sessions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================================================
// SKIP NAVIGATION LINKS
// ============================================================================

export const SkipNavigation: React.FC = () => {
  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
      <a
        href="#main-content"
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
    </div>
  );
};

// ============================================================================
// ARIA LIVE REGION
// ============================================================================

interface AriaLiveRegionProps {
  message: string;
  priority?: "polite" | "assertive";
}

export const AriaLiveRegion: React.FC<AriaLiveRegionProps> = ({
  message,
  priority = "polite",
}) => {
  return (
    <div
      aria-live={priority as "polite" | "assertive"}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

// ============================================================================
// FOCUS TRAP
// ============================================================================

interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, isActive }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  }, [isActive]);

  return <div ref={containerRef}>{children}</div>;
};
