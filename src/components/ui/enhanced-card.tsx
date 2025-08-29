"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

const cardVariants = cva(
  "relative overflow-hidden rounded-xl border bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "shadow-card hover:shadow-cardHover",
        elevated: "shadow-lg hover:shadow-xl",
        outlined: "border-2 shadow-none hover:shadow-card",
        glass: "bg-background/80 backdrop-blur-md border-border/50 shadow-lg",
        gradient: "bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-card",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      interactive: {
        none: "",
        hover: "hover:scale-[1.02] cursor-pointer",
        press: "hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
      },
      status: {
        none: "",
        success: "border-l-4 border-l-success-500",
        warning: "border-l-4 border-l-warning-500",
        danger: "border-l-4 border-l-danger-500",
        info: "border-l-4 border-l-primary-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: "none",
      status: "none",
    },
  }
);

const cardHeaderVariants = cva(
  "flex items-start justify-between space-y-0 pb-4",
  {
    variants: {
      size: {
        sm: "pb-2",
        md: "pb-4",
        lg: "pb-6",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  loading?: boolean;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, status, loading, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size, interactive, status }), className)}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {
  action?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, size, action, children, ...props }, ref) => (
    <div ref={ref} className={cn(cardHeaderVariants({ size }), className)} {...props}>
      <div className="flex-1 space-y-1.5">{children}</div>
      {action && <div className="flex items-center space-x-2">{action}</div>}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-lg", className)}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4 border-t border-border/50", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Specialized Medical Card Components
interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
    period?: string;
  };
  icon?: React.ReactNode;
  loading?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, title, value, change, icon, loading, variant = "default", ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case "success":
          return "border-l-success-500 bg-gradient-to-r from-success-50/50 to-transparent";
        case "warning":
          return "border-l-warning-500 bg-gradient-to-r from-warning-50/50 to-transparent";
        case "danger":
          return "border-l-danger-500 bg-gradient-to-r from-danger-50/50 to-transparent";
        default:
          return "border-l-primary-500 bg-gradient-to-r from-primary-50/50 to-transparent";
      }
    };

    return (
      <Card
        ref={ref}
        className={cn("border-l-4", getVariantStyles(), className)}
        {...props}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            {icon && (
              <div className="flex-shrink-0 text-muted-foreground opacity-70">
                {icon}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2">
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {change && (
              <div
                className={cn(
                  "flex items-center text-sm font-medium",
                  change.type === "increase" && "text-success-600",
                  change.type === "decrease" && "text-danger-600",
                  change.type === "neutral" && "text-muted-foreground"
                )}
              >
                {change.type === "increase" && <TrendingUp className="h-3 w-3 mr-1" />}
                {change.type === "decrease" && <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(change.value)}%
                {change.period && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {change.period}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
MetricCard.displayName = "MetricCard";

// Patient Status Card
interface PatientStatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  patientName: string;
  status: "waiting" | "in-progress" | "completed" | "cancelled";
  time?: string;
  doctor?: string;
  type?: string;
  priority?: "low" | "normal" | "high" | "critical";
  onAction?: (action: string) => void;
}

const PatientStatusCard = React.forwardRef<HTMLDivElement, PatientStatusCardProps>(
  ({ 
    className, 
    patientName, 
    status, 
    time, 
    doctor, 
    type, 
    priority = "normal",
    onAction,
    ...props 
  }, ref) => {
    const getPriorityIndicator = () => {
      switch (priority) {
        case "critical": return "border-r-4 border-r-danger-500";
        case "high": return "border-r-4 border-r-warning-500";
        case "normal": return "";
        case "low": return "border-r-4 border-r-success-500";
        default: return "";
      }
    };

    return (
      <Card
        ref={ref}
        className={cn(
          "transition-colors hover:bg-accent/50",
          getPriorityIndicator(),
          className
        )}
        interactive="hover"
        {...props}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">{patientName}</h4>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {doctor && <span>{doctor}</span>}
                {doctor && type && <span>•</span>}
                {type && <span>{type}</span>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {time && (
                <div className="text-right">
                  <div className="text-sm font-medium">{time}</div>
                </div>
              )}
              <div
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  status === "waiting" && "bg-warning-100 text-warning-800",
                  status === "in-progress" && "bg-primary-100 text-primary-800",
                  status === "completed" && "bg-success-100 text-success-800",
                  status === "cancelled" && "bg-danger-100 text-danger-800"
                )}
              >
                {status.replace("-", " ")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
PatientStatusCard.displayName = "PatientStatusCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  MetricCard,
  PatientStatusCard,
};