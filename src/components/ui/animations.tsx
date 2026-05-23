"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, LazyMotion, domAnimation, m, useInView, useAnimation } from "framer-motion";

const motionFeatures = domAnimation;

const MotionRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LazyMotion features={motionFeatures} strict>
    {children}
  </LazyMotion>
);

// Fade In Animation
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
  once?: boolean;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.6,
  direction = "up",
  className,
  once = true,
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once });
  const controls = useAnimation();

  const directionVariants = {
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
    left: { x: 50, opacity: 0 },
    right: { x: -50, opacity: 0 },
  };

  React.useEffect(() => {
    if (isInView) {
      controls.start({ x: 0, y: 0, opacity: 1 });
    }
  }, [isInView, controls]);

  return (
    <MotionRoot>
      <m.div
        ref={ref}
        initial={directionVariants[direction]}
        animate={controls}
        transition={{ duration, delay }}
        className={className}
      >
        {children}
      </m.div>
    </MotionRoot>
  );
};

// Stagger Container for multiple children
interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.1,
  className,
  }) => {
  return (
    <MotionRoot>
      <m.div
        className={className}
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: staggerDelay,
            },
          },
        }}
      >
        {React.Children.toArray(children).map((child) => {
          const element = React.isValidElement(child) ? child : null;
          const childKey =
            (element && element.key != null ? String(element.key) : "") ||
            (element && typeof element.props === "object" && element.props && "id" in element.props
              ? String((element.props as { id?: React.Key }).id ?? "")
              : "") ||
            (element && typeof element.props === "object" && element.props && "title" in element.props
              ? String((element.props as { title?: React.Key }).title ?? "")
              : "") ||
            JSON.stringify(child);

          return (
          <m.div
            key={childKey}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5 }}
          >
            {child}
          </m.div>
          );
        })}
      </m.div>
    </MotionRoot>
  );
};

// Scale on Hover
interface ScaleOnHoverProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

const ScaleOnHover: React.FC<ScaleOnHoverProps> = ({
  children,
  scale = 1.05,
  className,
}) => {
  return (
    <MotionRoot>
      <m.div
        whileHover={{ scale }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn("cursor-pointer", className)}
      >
        {children}
      </m.div>
    </MotionRoot>
  );
};

// Slide In Notification
interface SlideInNotificationProps {
  children: React.ReactNode;
  isVisible: boolean;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const SlideInNotification: React.FC<SlideInNotificationProps> = ({
  children,
  isVisible,
  position = "top",
  className,
}) => {
  const variants = {
    top: {
      hidden: { y: -100, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    },
    bottom: {
      hidden: { y: 100, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    },
    left: {
      hidden: { x: -100, opacity: 0 },
      visible: { x: 0, opacity: 1 },
    },
    right: {
      hidden: { x: 100, opacity: 0 },
      visible: { x: 0, opacity: 1 },
    },
  };

  return (
    <MotionRoot>
      <AnimatePresence>
        {isVisible && (
          <m.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants[position]}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className={className}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </MotionRoot>
  );
};

// Pulse Animation
interface PulseProps {
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

const Pulse: React.FC<PulseProps> = ({ children, duration = 2, className }) => {
  return (
    <MotionRoot>
      <m.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
        className={className}
      >
        {children}
      </m.div>
    </MotionRoot>
  );
};

// Loading Spinner with Animation
interface AnimatedSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AnimatedSpinner: React.FC<AnimatedSpinnerProps> = ({ size = "md", className }) => {
  const sizeClasses = {
    sm: "size-4",
    md: "size-8",
    lg: "size-12",
  };

  return (
    <MotionRoot>
      <m.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={cn(
          "border-2 border-primary/30 border-t-primary rounded-full",
          sizeClasses[size],
          className
        )}
      />
    </MotionRoot>
  );
};

// Progress Bar Animation
interface AnimatedProgressProps {
  value: number;
  max?: number;
  height?: string;
  color?: string;
  backgroundColor?: string;
  duration?: number;
  className?: string;
  showValue?: boolean;
}

const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  height = "h-2",
  color = "bg-primary",
  backgroundColor = "bg-muted",
  duration = 1,
  className,
  showValue = false,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("gap-y-2", className)}>
      <div className={cn("w-full rounded-full overflow-hidden", backgroundColor, height)}>
        <MotionRoot>
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration, ease: "easeOut" }}
            className={cn("h-full rounded-full", color)}
          />
        </MotionRoot>
      </div>
      {showValue && (
        <div className="text-sm text-muted-foreground">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

// Floating Elements
interface FloatingElementProps {
  children: React.ReactNode;
  amplitude?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  amplitude = 10,
  duration = 3,
  delay = 0,
  className,
}) => {
  return (
    <MotionRoot>
      <m.div
        animate={{ y: [0, -amplitude, 0] }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
        className={className}
      >
        {children}
      </m.div>
    </MotionRoot>
  );
};

// Typewriter Effect
interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 50,
  className,
  onComplete,
}) => {
  const [state, setState] = React.useState({
    displayText: "",
    currentIndex: 0,
  });

  React.useEffect(() => {
    if (state.currentIndex < text.length) {
      const timer = setTimeout(() => {
        setState((prev) => ({
          displayText: prev.displayText + text[prev.currentIndex],
          currentIndex: prev.currentIndex + 1,
        }));
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
    return undefined;
  }, [state.currentIndex, text, speed, onComplete]);

  return (
    <span className={className}>
      {state.displayText}
      {state.currentIndex < text.length && (
        <MotionRoot>
          <m.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="ml-0.5"
          >
            |
          </m.span>
        </MotionRoot>
      )}
    </span>
  );
};

// Card Flip Animation
interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped?: boolean;
  className?: string;
  onFlip?: () => void;
}

const FlipCard: React.FC<FlipCardProps> = ({
  front,
  back,
  isFlipped = false,
  className,
  onFlip,
  }) => {
  return (
    <button
      type="button"
      className={cn("relative w-full h-full cursor-pointer", className)}
      onClick={onFlip}
    >
      <MotionRoot>
        <m.div
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
          className="w-full h-full relative preserve-3d"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {front}
          </div>
          
          {/* Back */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden"
            style={{ 
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)" 
            }}
          >
            {back}
          </div>
        </m.div>
      </MotionRoot>
    </button>
  );
};

// Morphing Button
interface MorphingButtonProps {
  children: React.ReactNode;
  morphedChildren: React.ReactNode;
  isMorphed?: boolean;
  onClick?: () => void;
  className?: string;
}

const MorphingButton: React.FC<MorphingButtonProps> = ({
  children,
  morphedChildren,
  isMorphed = false,
  onClick,
  className,
  }) => {
  return (
    <MotionRoot>
      <m.button
        layout
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium transition-colors",
          className
        )}
      >
        <AnimatePresence mode="wait">
          {isMorphed ? (
            <m.span
              key="morphed"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {morphedChildren}
            </m.span>
          ) : (
            <m.span
              key="original"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </m.span>
          )}
        </AnimatePresence>
      </m.button>
    </MotionRoot>
  );
};

// Skeleton Loader with Animation
interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, animate = true }) => {
  return (
    <div
      className={cn(
        "bg-muted rounded-md",
        animate && "animate-pulse",
        className
      )}
    />
  );
};

// Reveal on Scroll
interface RevealOnScrollProps {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  // @ts-ignore - threshold parameter reserved for future use
  threshold = 0.1,
  className,
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <MotionRoot>
      <m.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={className}
      >
        {children}
      </m.div>
    </MotionRoot>
  );
};

// Page Transition
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  return (
    <MotionRoot>
      <m.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={className}
      >
        {children}
      </m.div>
    </MotionRoot>
  );
};

export {
  FadeIn,
  StaggerContainer,
  ScaleOnHover,
  SlideInNotification,
  Pulse,
  AnimatedSpinner,
  AnimatedProgress,
  FloatingElement,
  Typewriter,
  FlipCard,
  MorphingButton,
  Skeleton,
  RevealOnScroll,
  PageTransition,
};

export type {
  FadeInProps,
  StaggerContainerProps,
  ScaleOnHoverProps,
  SlideInNotificationProps,
  PulseProps,
  AnimatedSpinnerProps,
  AnimatedProgressProps,
  FloatingElementProps,
  TypewriterProps,
  FlipCardProps,
  MorphingButtonProps,
  SkeletonProps,
  RevealOnScrollProps,
  PageTransitionProps,
};

