"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Phone,
  MessageSquare,
  Video,
  Clock,
  User
} from "lucide-react";

// Mobile Header Component
interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  className,
}) => {
  return (
    <header className={cn(
      "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b",
      className
    )}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {leftAction}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {rightAction && (
          <div className="flex items-center space-x-2 flex-shrink-0">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
};

// Mobile Navigation Bottom Bar
interface MobileBottomNavProps {
  items: Array<{
    label: string;
    icon: React.ReactNode;
    href?: string;
    active?: boolean;
    badge?: number;
    onClick?: () => void;
  }>;
  className?: string;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ items, className }) => {
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-50",
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={cn(
              "relative flex flex-col items-center justify-center min-w-0 flex-1 p-2 rounded-lg transition-colors",
              item.active 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <div className="relative">
              {item.icon}
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium mt-1 truncate w-full text-center">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// Mobile Card Stack (Swipeable)
interface MobileCardStackProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  onSwipeLeft?: (item: T, index: number) => void;
  onSwipeRight?: (item: T, index: number) => void;
  keyExtractor: (item: T, index: number) => string;
}

function MobileCardStack<T>({
  items,
  renderItem,
  className,
  onSwipeLeft,
  onSwipeRight,
}: Omit<MobileCardStackProps<T>, 'keyExtractor'>) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const touchStartX = React.useRef<number>(0);
  const touchEndX = React.useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX || 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0]?.clientX || 0;
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swiped left
        if (onSwipeLeft && items[currentIndex]) {
          onSwipeLeft(items[currentIndex], currentIndex);
        }
        if (currentIndex < items.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      } else {
        // Swiped right
        if (onSwipeRight && items[currentIndex]) {
          onSwipeRight(items[currentIndex], currentIndex);
        }
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No items available
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Navigation dots */}
      <div className="flex justify-center space-x-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentIndex ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Current card */}
      <div
        className="touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items[currentIndex] && renderItem(items[currentIndex], currentIndex)}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground self-center">
          {currentIndex + 1} of {items.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex(Math.min(items.length - 1, currentIndex + 1))}
          disabled={currentIndex === items.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// Mobile Patient Card
interface MobilePatientCardProps {
  patient: {
    id: string;
    name: string;
    age?: number;
    condition?: string;
    status: "waiting" | "in-progress" | "completed" | "cancelled";
    time?: string;
    doctor?: string;
    priority?: "low" | "normal" | "high" | "critical";
    avatar?: string;
    lastVisit?: string;
    phone?: string;
  };
  onAction?: (action: "call" | "message" | "video" | "view", patientId: string) => void;
  className?: string;
}

const MobilePatientCardComponent: React.FC<MobilePatientCardProps> = ({
  patient,
  onAction,
  className,
}) => {
  const getStatusColor = () => {
    switch (patient.status) {
      case "waiting": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = () => {
    switch (patient.priority) {
      case "critical": return "border-l-red-500";
      case "high": return "border-l-orange-500";
      case "normal": return "border-l-blue-500";
      case "low": return "border-l-green-500";
      default: return "";
    }
  };

  return (
    <Card className={cn("border-l-4", getPriorityColor(), className)}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {patient.avatar ? (
                <Image 
                  src={patient.avatar} 
                  alt={patient.name}
                  width={48}
                  height={48}
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">{patient.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {patient.age && <span>Age {patient.age}</span>}
                {patient.age && patient.condition && <span>•</span>}
                {patient.condition && <span className="truncate">{patient.condition}</span>}
              </div>
              {patient.lastVisit && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last visit: {patient.lastVisit}
                </p>
              )}
            </div>
          </div>
          <Badge className={getStatusColor()}>
            {patient.status.replace("-", " ")}
          </Badge>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {patient.time && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{patient.time}</span>
            </div>
          )}
          {patient.doctor && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{patient.doctor}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex space-x-2">
            {patient.phone && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => onAction?.("call", patient.id)}
              >
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onAction?.("message", patient.id)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onAction?.("video", patient.id)}
            >
              <Video className="h-4 w-4 mr-1" />
              Video
            </Button>
          </div>
          <Button 
            size="sm" 
            onClick={() => onAction?.("view", patient.id)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Export memoized MobilePatientCard for performance optimization
const MobilePatientCard = React.memo(MobilePatientCardComponent);

// Mobile Quick Actions FAB
interface MobileQuickActionsProps {
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    primary?: boolean;
  }>;
  className?: string;
}

const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({ actions, className }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn("fixed bottom-20 right-4 z-40", className)}>
      {/* Action items */}
      {isOpen && (
        <div className="space-y-2 mb-2">
          {actions.slice(0, -1).map((action, index) => (
            <div key={index} className="flex items-center justify-end space-x-2">
              <div className="bg-background/90 backdrop-blur rounded-lg px-3 py-1 border shadow-lg">
                <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="w-12 h-12 rounded-full shadow-lg"
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
              >
                {action.icon}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="lg"
        className="w-14 h-14 rounded-full shadow-lg"
        onClick={() => {
          if (actions.length === 1) {
            actions[0]?.onClick();
          } else {
            setIsOpen(!isOpen);
          }
        }}
      >
        {actions.length === 1 ? (
          actions[0]?.icon
        ) : isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          actions[actions.length - 1]?.icon || <Menu className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
};

// Mobile Stats Grid
interface MobileStatsGridProps {
  stats: Array<{
    label: string;
    value: string | number;
    change?: {
      value: number;
      type: "increase" | "decrease" | "neutral";
    };
    icon?: React.ReactNode;
    color?: string;
  }>;
  className?: string;
}

const MobileStatsGrid: React.FC<MobileStatsGridProps> = ({ stats, className }) => {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {stats.map((stat, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center justify-between mb-2">
            {stat.icon && (
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {stat.icon}
              </div>
            )}
            {stat.change && (
              <Badge 
                variant={stat.change.type === "increase" ? "default" : "secondary"}
                className="text-xs"
              >
                {stat.change.type === "increase" ? "+" : stat.change.type === "decrease" ? "-" : ""}
                {Math.abs(stat.change.value)}%
              </Badge>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-tight">
              {stat.label}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Responsive Breakpoint Hook
const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<"sm" | "md" | "lg" | "xl" | "2xl">("lg");

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint("sm");
      else if (width < 768) setBreakpoint("md");
      else if (width < 1024) setBreakpoint("lg");
      else if (width < 1280) setBreakpoint("xl");
      else setBreakpoint("2xl");
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === "sm",
    isTablet: breakpoint === "md",
    isDesktop: ["lg", "xl", "2xl"].includes(breakpoint),
    isSmallScreen: ["sm", "md"].includes(breakpoint),
  };
};

export {
  MobileHeader,
  MobileBottomNav,
  MobileCardStack,
  MobilePatientCard,
  MobileQuickActions,
  MobileStatsGrid,
  useBreakpoint,
};

export type {
  MobileHeaderProps,
  MobileBottomNavProps,
  MobileCardStackProps,
  MobilePatientCardProps,
  MobileQuickActionsProps,
  MobileStatsGridProps,
};