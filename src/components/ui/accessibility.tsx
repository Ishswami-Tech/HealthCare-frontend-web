"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Minus,
  Plus,
  RotateCcw,
  Pause,
  Play,
  Settings,
  Contrast,
} from "lucide-react";

// Accessibility Context
interface AccessibilityContextType {
  fontSize: number;
  contrast: "normal" | "high";
  reducedMotion: boolean;
  screenReaderMode: boolean;
  focusVisible: boolean;
  announcements: string[];
  setFontSize: (size: number) => void;
  setContrast: (contrast: "normal" | "high") => void;
  setReducedMotion: (enabled: boolean) => void;
  setScreenReaderMode: (enabled: boolean) => void;
  setFocusVisible: (visible: boolean) => void;
  announce: (message: string) => void;
  resetSettings: () => void;
}

const AccessibilityContext =
  React.createContext<AccessibilityContextType | null>(null);

// Accessibility Provider
interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
}) => {
  const [fontSize, setFontSize] = React.useState(16);
  const [contrast, setContrast] = React.useState<"normal" | "high">("normal");
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [screenReaderMode, setScreenReaderMode] = React.useState(false);
  const [focusVisible, setFocusVisible] = React.useState(false);
  const [announcements, setAnnouncements] = React.useState<string[]>([]);

  const announce = React.useCallback((message: string) => {
    setAnnouncements((prev) => [...prev, message]);
    setTimeout(() => {
      setAnnouncements((prev) => prev.filter((msg) => msg !== message));
    }, 5000);
  }, []);

  const resetSettings = React.useCallback(() => {
    setFontSize(16);
    setContrast("normal");
    setReducedMotion(false);
    setScreenReaderMode(false);
    setFocusVisible(false);
    announce("Accessibility settings reset to default");
  }, [announce]);

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${fontSize}px`;

    if (contrast === "high") {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }

    if (reducedMotion) {
      document.body.classList.add("reduced-motion");
    } else {
      document.body.classList.remove("reduced-motion");
    }

    if (focusVisible) {
      document.body.classList.add("focus-visible");
    } else {
      document.body.classList.remove("focus-visible");
    }

    if (screenReaderMode) {
      document.body.classList.add("screen-reader-mode");
    } else {
      document.body.classList.remove("screen-reader-mode");
    }
  }, [fontSize, contrast, reducedMotion, screenReaderMode, focusVisible]);

  const value = {
    fontSize,
    contrast,
    reducedMotion,
    screenReaderMode,
    focusVisible,
    announcements,
    setFontSize,
    setContrast,
    setReducedMotion,
    setScreenReaderMode,
    setFocusVisible,
    announce,
    resetSettings,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider"
    );
  }
  return context;
};

// Safe version that doesn't throw
export const useAccessibilitySafe = () => {
  const context = React.useContext(AccessibilityContext);
  return context;
};

export const AccessibilityToolbar: React.FC<{ className?: string }> = ({
  className,
}) => {
  // Add error boundary for accessibility context
  let accessibilityContext;
  try {
    accessibilityContext = useAccessibility();
  } catch (error) {
    // If accessibility context is not available, render a fallback
    console.warn("AccessibilityProvider not found, rendering fallback toolbar");
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("fixed top-4 right-4 z-50", className)}
        aria-label="Accessibility settings (unavailable)"
        disabled
      >
        <Settings className="h-4 w-4" />
      </Button>
    );
  }

  const {
    fontSize,
    contrast,
    reducedMotion,
    screenReaderMode,
    focusVisible,
    setFontSize,
    setContrast,
    setReducedMotion,
    setScreenReaderMode,
    setFocusVisible,
    announce,
    resetSettings,
  } = accessibilityContext;

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn("fixed top-4 right-4 z-50", className)}
        aria-label="Toggle accessibility toolbar"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="fixed top-16 right-4 bg-background border rounded-lg shadow-lg p-4 z-50 w-80">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Accessibility Settings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSettings}
                aria-label="Reset accessibility settings"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Font Size: {fontSize}px
              </label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSize = Math.max(fontSize - 2, 12);
                    setFontSize(newSize);
                    announce(`Font size decreased to ${newSize}px`);
                  }}
                  disabled={fontSize <= 12}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="flex-1 text-center text-sm">{fontSize}px</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSize = Math.min(fontSize + 2, 24);
                    setFontSize(newSize);
                    announce(`Font size increased to ${newSize}px`);
                  }}
                  disabled={fontSize >= 24}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">High Contrast</label>
              <Button
                variant={contrast === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newContrast = contrast === "normal" ? "high" : "normal";
                  setContrast(newContrast);
                  announce(
                    `High contrast ${
                      newContrast === "high" ? "enabled" : "disabled"
                    }`
                  );
                }}
              >
                <Contrast className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Reduced Motion</label>
              <Button
                variant={reducedMotion ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newMotion = !reducedMotion;
                  setReducedMotion(newMotion);
                  announce(
                    `Reduced motion ${newMotion ? "enabled" : "disabled"}`
                  );
                }}
              >
                {reducedMotion ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Screen Reader Mode</label>
              <Button
                variant={screenReaderMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newMode = !screenReaderMode;
                  setScreenReaderMode(newMode);
                  announce(
                    `Screen reader mode ${newMode ? "enabled" : "disabled"}`
                  );
                }}
              >
                {screenReaderMode ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enhanced Focus</label>
              <Button
                variant={focusVisible ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newFocus = !focusVisible;
                  setFocusVisible(newFocus);
                  announce(
                    `Enhanced focus indicators ${
                      newFocus ? "enabled" : "disabled"
                    }`
                  );
                }}
              >
                {focusVisible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Skip Navigation Component
export const SkipNavigation: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50",
        "bg-primary text-primary-foreground px-4 py-2 rounded-md",
        "focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
    >
      Skip to main content
    </a>
  );
};

// Fallback Accessibility Toolbar (when provider is not available)
export const AccessibilityToolbarFallback: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("fixed top-4 right-4 z-50", className)}
      aria-label="Accessibility settings (unavailable)"
      disabled
      title="Accessibility settings are not available on this page"
    >
      <Settings className="h-4 w-4" />
    </Button>
  );
};
